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

// Stripe and RevenueCat each own one independent flag (premium_via_stripe /
// premium_via_revenuecat); account_tier/is_premium are always the OR of both, recomputed here
// on every write. This means revoking one source can never strip premium granted by the other —
// e.g. an IAP refund or a RevenueCat entitlement transferring to a different account on a shared
// device won't touch a user's separately-purchased Stripe subscription, and vice versa.
async function setStripePremiumFlag(supabase: SupabaseClient, userId: string, granted: boolean) {
  console.log(`🔧 Setting premium_via_stripe=${granted} for user ${userId}`);

  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select('premium_via_revenuecat')
    .eq('id', userId)
    .maybeSingle();
  if (readError) console.error('❌ Failed to read premium_via_revenuecat:', readError);

  const otherFlag = Boolean((existing as { premium_via_revenuecat?: boolean } | null)?.premium_via_revenuecat);
  const isPremium = granted || otherFlag;

  const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { account_tier: isPremium ? 'premium' : 'free' },
  });
  if (authError) console.error('❌ Auth metadata update error:', authError);
  else console.log(`✅ Auth metadata updated to ${isPremium ? 'premium' : 'free'}`);

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      premium_via_stripe: granted,
      account_tier: isPremium ? 'premium' : 'free',
      is_premium: isPremium,
    } as Record<string, unknown>)
    .eq('id', userId);
  if (profileError) console.error('❌ Profile update error:', profileError);
  else console.log(`✅ Profile updated — premium_via_stripe=${granted}, account_tier=${isPremium ? 'premium' : 'free'}`);
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

interface PurchaseRecord {
  stripe_session_id: string;
  user_id: string;
}

async function findPurchaseByPaymentIntent(
  supabase: SupabaseClient,
  paymentIntentId: string
): Promise<{ session_id: string; user_id: string } | null> {
  const { data, error } = await supabase
    .from('purchases')
    .select('stripe_session_id, user_id')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .limit(1)
    .single() as { data: PurchaseRecord | null; error: unknown };

  if (error || !data) return null;

  return { session_id: data.stripe_session_id, user_id: data.user_id };
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

  // Log incoming request details
  console.log('📬 Webhook request received');
  console.log('   Headers:', JSON.stringify({
    'stripe-signature': req.headers['stripe-signature'] ? 'present' : 'missing',
    'content-type': req.headers['content-type'],
  }));

  const sig = (req.headers['stripe-signature'] || req.headers['Stripe-Signature']) as string | string[] | undefined;
  if (!sig) {
    console.error('❌ Missing Stripe signature');
    return res.status(400).send('Missing signature');
  }

  // Initialize clients
  let supabase: SupabaseClient;
  let stripe: Stripe;
  
  try {
    supabase = getSupabaseClient();
    stripe = getStripeClient();
  } catch (err) {
    console.error('❌ Failed to initialize clients:', err);
    return res.status(500).json({ error: 'Server configuration error' });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await buffer(req);
    const signature = Array.isArray(sig) ? sig[0] : sig;
    
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('❌ Missing STRIPE_WEBHOOK_SECRET env var');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }
    
    console.log('🔐 Verifying webhook signature...');
    console.log('   Secret prefix:', webhookSecret.substring(0, 10) + '...');
    
    event = stripe.webhooks.constructEvent(rawBody, signature!, webhookSecret);
    console.log('✅ Webhook signature verified');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Webhook signature verification failed:', message);
    return res.status(400).send(`Webhook Error: ${message}`);
  }

  console.log(`📩 Webhook received: ${event.type}`);
  console.log(`   Event ID: ${event.id}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log('====== CHECKOUT SESSION COMPLETED ======');
        console.log('💳 Session ID:', session.id);
        console.log('📋 Full metadata:', JSON.stringify(session.metadata));
        
        const userId = session.metadata?.user_id;
        const productType = session.metadata?.product_type;

        console.log('👤 User ID:', userId);
        console.log('📦 Product type:', productType);
        console.log('💰 Amount:', session.amount_total, session.currency);
        console.log('🔗 Payment Intent:', session.payment_intent);

        if (!userId) {
          console.error('❌ No user_id in session metadata!');
          console.error('   This means the checkout session was created without proper metadata.');
          console.error('   Check create-checkout-session.ts to ensure metadata is being set.');
          break;
        }

        // Update the purchase record with completed status
        console.log('📝 Updating purchase record...');
        await updatePurchaseRecord(
          supabase,
          session.id,
          session.payment_intent as string | null,
          session.amount_total,
          'completed'
        );

        // Ensure profile exists
        console.log('👤 Checking if profile exists...');
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, account_tier')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.log('⚠️ Profile query error:', profileError.message);
        }

        if (!existingProfile) {
          console.log('⚠️ Profile not found, creating one...');
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
          
          if (userError) {
            console.error('❌ Failed to get user from auth:', userError.message);
          } else if (userData?.user) {
            const newProfile = {
              id: userId,
              email: userData.user.email,
              account_tier: 'free',
              is_premium: false,
              premium_via_stripe: false,
              premium_via_revenuecat: false,
            };
            const { error: insertError } = await supabase.from('profiles').insert(newProfile as Record<string, unknown>);
            if (insertError) {
              console.error('❌ Failed to create profile:', insertError.message);
            } else {
              console.log('✅ Profile created');
            }
          }
        } else {
          console.log('✅ Profile exists, current tier:', existingProfile.account_tier);
        }

        // Grant premium access (always — only premium purchases are accepted)
        console.log('🔄 Processing Premium purchase...');
        await setStripePremiumFlag(supabase, userId, true);

        // Verify the update worked
        const { data: verifyProfile } = await supabase
          .from('profiles')
          .select('account_tier, is_premium')
          .eq('id', userId)
          .single();

        console.log('🔍 Verification after update - Profile:', verifyProfile);

        console.log('====== PURCHASE PROCESSING COMPLETE ======');
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
            await setStripePremiumFlag(supabase, purchase.user_id, false);
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
          
          await setStripePremiumFlag(supabase, purchase.user_id, false);

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
