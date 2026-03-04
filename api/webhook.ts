import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { buffer } from 'micro';

// Disable body parsing, need raw body for Stripe signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Initialize clients lazily to ensure correct env vars are used per-request
function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(url, key);
}

function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }
  
  // Log which environment we're using (test vs live)
  const isTestMode = secretKey.startsWith('sk_test_');
  const isLiveMode = secretKey.startsWith('sk_live_');
  const vercelEnv = process.env.VERCEL_ENV || 'unknown';
  
  console.log(`🔑 Webhook - Stripe mode: ${isTestMode ? 'TEST' : isLiveMode ? 'LIVE' : 'UNKNOWN'}, Vercel env: ${vercelEnv}`);
  
  return new Stripe(secretKey);
}

async function setUserPremium(supabase: SupabaseClient, userId: string) {
  console.log(`🔧 Upgrading user ${userId} to premium`);
  
  // Update auth metadata
  const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { account_tier: 'premium' },
  });
  
  if (authError) {
    console.error('❌ Auth metadata update error:', authError);
  } else {
    console.log('✅ Auth metadata updated to premium');
  }

  // Update profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ account_tier: 'premium', is_premium: true } as Record<string, unknown>)
    .eq('id', userId);
    
  if (profileError) {
    console.error('❌ Profile update error:', profileError);
  } else {
    console.log('✅ Profile updated to premium');
  }
}

async function addPurchasedLevel(supabase: SupabaseClient, userId: string, level: number, paymentId: string) {
  console.log(`🔧 Adding HSK ${level} to user ${userId}`);
  
  const purchaseData = {
    user_id: userId,
    hsk_level: level,
    stripe_payment_id: paymentId,
    purchased_at: new Date().toISOString(),
  };
  
  // Insert into purchased_levels
  const { error } = await supabase
    .from('purchased_levels')
    .upsert(purchaseData as Record<string, unknown>, {
      onConflict: 'user_id,hsk_level',
    });
    
  if (error) {
    console.error('❌ Purchased level insert error:', error);
  } else {
    console.log(`✅ HSK ${level} added to user's purchased levels`);
  }
}

async function updatePurchaseRecord(
  supabase: SupabaseClient,
  sessionId: string, 
  paymentIntentId: string | null, 
  amountCents: number | null,
  status: 'completed' | 'failed' | 'refunded' | 'disputed'
) {
  const now = new Date().toISOString();
  
  const updateData: Record<string, unknown> = {
    status,
    stripe_payment_intent_id: paymentIntentId,
    updated_at: now,
  };
  
  if (status === 'completed') {
    updateData.completed_at = now;
    if (amountCents !== null) {
      updateData.amount_cents = amountCents;
    }
  }
  
  if (status === 'refunded') {
    updateData.refunded_at = now;
  }
  
  const { error } = await supabase
    .from('purchases')
    .update(updateData)
    .eq('stripe_session_id', sessionId);
    
  if (error) {
    console.error('❌ Error updating purchase record:', error);
  } else {
    console.log(`📝 Updated purchase record for session ${sessionId} to status: ${status}`);
  }
}

/**
 * Revoke access for a user when they get a refund or chargeback.
 * 
 * IMPORTANT: This function is careful to only revoke what was purchased:
 * - Premium refund: Only removes premium status, keeps individually purchased levels
 * - HSK level refund: Only removes that specific level, keeps premium status and other levels
 */
async function revokeAccessForUser(
  supabase: SupabaseClient,
  userId: string,
  productType: string,
  hskLevel: number | null
) {
  console.log(`🔒 Revoking access for user ${userId}: product_type=${productType}, hsk_level=${hskLevel}`);

  if (productType === 'premium') {
    // Revoke premium status only - do NOT touch purchased_levels
    // The user may have purchased individual levels before upgrading to premium,
    // and those should remain valid after a premium refund.
    
    // Update auth metadata
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      app_metadata: { account_tier: 'free' },
    });
    
    if (authError) {
      console.error('❌ Failed to update auth metadata:', authError);
    } else {
      console.log('✅ Revoked premium from auth metadata');
    }
    
    // Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ account_tier: 'free', is_premium: false } as Record<string, unknown>)
      .eq('id', userId);
      
    if (profileError) {
      console.error('❌ Failed to update profile:', profileError);
    } else {
      console.log('✅ Revoked premium from profile');
    }
    
    // NOTE: We intentionally do NOT delete from purchased_levels here.
    // Those are separate purchases that remain valid.
    
  } else if (productType === 'hsk_level' && hskLevel) {
    // Revoke specific HSK level only
    const { error } = await supabase
      .from('purchased_levels')
      .delete()
      .eq('user_id', userId)
      .eq('hsk_level', hskLevel);
      
    if (error) {
      console.error(`❌ Failed to revoke HSK ${hskLevel}:`, error);
    } else {
      console.log(`✅ Revoked HSK ${hskLevel} from user`);
    }
  }
}

interface PurchaseRecord {
  stripe_session_id: string;
  user_id: string;
  product_type: string;
  hsk_level: number | null;
}

/**
 * Find purchase info by payment intent ID
 */
async function findPurchaseByPaymentIntent(
  supabase: SupabaseClient,
  paymentIntentId: string
): Promise<{ session_id: string; user_id: string; product_type: string; hsk_level: number | null } | null> {
  const { data, error } = await supabase
    .from('purchases')
    .select('stripe_session_id, user_id, product_type, hsk_level')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .limit(1)
    .single() as { data: PurchaseRecord | null; error: unknown };
    
  if (error || !data) {
    return null;
  }
  
  return {
    session_id: data.stripe_session_id,
    user_id: data.user_id,
    product_type: data.product_type,
    hsk_level: data.hsk_level,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Stripe-Signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = (req.headers['stripe-signature'] || req.headers['Stripe-Signature']) as string | string[] | undefined;
  if (!sig) {
    console.error('❌ Missing Stripe signature');
    return res.status(400).send('Missing signature');
  }

  // Initialize clients
  const supabase = getSupabaseClient();
  const stripe = getStripeClient();

  let event: Stripe.Event;

  try {
    const rawBody = await buffer(req);
    const signature = Array.isArray(sig) ? sig[0] : sig;
    
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET');
    }
    
    event = stripe.webhooks.constructEvent(rawBody, signature!, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Webhook signature verification failed:', message);
    return res.status(400).send(`Webhook Error: ${message}`);
  }

  console.log(`📩 Webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const productType = session.metadata?.product_type;
        const hskLevel = session.metadata?.hsk_level;

        console.log('💳 Checkout completed for session:', session.id);
        console.log('👤 User ID:', userId);
        console.log('📦 Product type:', productType);
        console.log('📊 HSK Level:', hskLevel);
        console.log('💰 Amount:', session.amount_total, session.currency);

        if (!userId) {
          console.error('❌ No user_id in session metadata!');
          break;
        }

        // Update the purchase record with completed status
        await updatePurchaseRecord(
          supabase,
          session.id,
          session.payment_intent as string | null,
          session.amount_total,
          'completed'
        );

        // Ensure profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single();

        if (!existingProfile) {
          console.log('⚠️ Profile not found, creating one...');
          const { data: userData } = await supabase.auth.admin.getUserById(userId);
          if (userData?.user) {
            const newProfile = {
              id: userId,
              email: userData.user.email,
              account_tier: 'free',
              is_premium: false,
            };
            await supabase.from('profiles').insert(newProfile as Record<string, unknown>);
            console.log('✅ Profile created');
          }
        }

        // Handle based on product type
        if (productType === 'premium') {
          console.log('🔄 Processing Premium purchase...');
          await setUserPremium(supabase, userId);
        } else if (productType === 'hsk_level' && hskLevel) {
          console.log(`🔄 Processing HSK ${hskLevel} purchase...`);
          await addPurchasedLevel(supabase, userId, parseInt(hskLevel, 10), session.payment_intent as string);
        } else {
          // Fallback: treat as premium purchase for backwards compatibility
          console.log('🔄 Processing legacy premium purchase...');
          await setUserPremium(supabase, userId);
        }

        console.log('✅ Purchase processing complete!');
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('💰 Payment succeeded:', paymentIntent.id);
        // The checkout.session.completed event handles the actual logic
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('❌ Payment failed:', paymentIntent.id);
        console.log('Failure message:', paymentIntent.last_payment_error?.message);
        
        // Try to find and update the purchase record
        const purchase = await findPurchaseByPaymentIntent(supabase, paymentIntent.id);
        if (purchase) {
          await updatePurchaseRecord(
            supabase,
            purchase.session_id,
            paymentIntent.id,
            null,
            'failed'
          );
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('💸 Charge refunded:', charge.id);
        console.log('   Amount refunded:', charge.amount_refunded, 'of', charge.amount);
        
        const paymentIntentId = charge.payment_intent as string;
        const purchase = await findPurchaseByPaymentIntent(supabase, paymentIntentId);
        
        if (purchase) {
          // Check if this is a full or partial refund
          const isFullRefund = charge.amount_refunded >= charge.amount;
          
          if (isFullRefund) {
            console.log('🔒 Full refund detected - revoking access');
            
            // Update purchase record
            await updatePurchaseRecord(
              supabase,
              purchase.session_id,
              paymentIntentId,
              null,
              'refunded'
            );
            
            // Revoke access
            await revokeAccessForUser(
              supabase,
              purchase.user_id,
              purchase.product_type,
              purchase.hsk_level
            );
          } else {
            console.log('⚠️ Partial refund detected - logging for manual review');
            console.log(`   Refunded: ${charge.amount_refunded} of ${charge.amount} (${Math.round(charge.amount_refunded / charge.amount * 100)}%)`);
            // For partial refunds, we don't automatically revoke access
            // This should be handled manually based on your refund policy
          }
        } else {
          console.warn('⚠️ Could not find purchase for refunded charge:', charge.id);
        }
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        console.log('⚠️ Dispute/chargeback created:', dispute.id);
        console.log('   Reason:', dispute.reason);
        console.log('   Amount:', dispute.amount);
        
        const paymentIntentId = dispute.payment_intent as string;
        const purchase = await findPurchaseByPaymentIntent(supabase, paymentIntentId);
        
        if (purchase) {
          // For disputes/chargebacks, immediately revoke access
          // This is important for fraud prevention
          console.log('🔒 Revoking access due to dispute');
          
          await updatePurchaseRecord(
            supabase,
            purchase.session_id,
            paymentIntentId,
            null,
            'disputed'
          );
          
          await revokeAccessForUser(
            supabase,
            purchase.user_id,
            purchase.product_type,
            purchase.hsk_level
          );
          
          // Log evidence details for dispute response
          console.log('📋 Dispute evidence due by:', 
            new Date((dispute.evidence_details?.due_by || 0) * 1000).toISOString()
          );
        }
        break;
      }

      case 'charge.dispute.closed': {
        const dispute = event.data.object as Stripe.Dispute;
        console.log('📋 Dispute closed:', dispute.id);
        console.log('   Status:', dispute.status);
        
        // If you won the dispute, you might want to restore access
        // This should be handled manually based on the dispute outcome
        if (dispute.status === 'won') {
          console.log('🎉 Dispute won! Consider restoring access manually.');
        } else if (dispute.status === 'lost') {
          console.log('😞 Dispute lost. Access should remain revoked.');
        }
        break;
      }

      case 'refund.created': {
        const refund = event.data.object as Stripe.Refund;
        console.log('📝 Refund created:', refund.id);
        console.log('   Amount:', refund.amount);
        console.log('   Reason:', refund.reason);
        break;
      }

      case 'refund.updated': {
        const refund = event.data.object as Stripe.Refund;
        console.log('📝 Refund updated:', refund.id);
        console.log('   Status:', refund.status);
        break;
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
  }

  res.json({ received: true });
}
