import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { buffer } from 'micro';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Disable body parsing, need raw body for Stripe signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Idempotency check - prevent duplicate processing
const processedEvents = new Set<string>();
const MAX_PROCESSED_EVENTS = 1000;

function markEventProcessed(eventId: string): boolean {
  if (processedEvents.has(eventId)) {
    return false; // Already processed
  }
  
  // Prevent memory leak
  if (processedEvents.size >= MAX_PROCESSED_EVENTS) {
    const firstItem = processedEvents.values().next().value;
    if (firstItem) processedEvents.delete(firstItem);
  }
  
  processedEvents.add(eventId);
  return true;
}

// ─── Grant Access Functions ───────────────────────────────────────────────────

async function setUserPremium(userId: string) {
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
    .update({ account_tier: 'premium', is_premium: true })
    .eq('id', userId);
    
  if (profileError) {
    console.error('❌ Profile update error:', profileError);
  } else {
    console.log('✅ Profile updated to premium');
  }
}

async function addPurchasedLevel(userId: string, level: number, paymentId: string) {
  console.log(`🔧 Adding HSK ${level} to user ${userId}`);
  
  const { error } = await supabase
    .from('purchased_levels')
    .upsert({
      user_id: userId,
      hsk_level: level,
      stripe_payment_id: paymentId,
      purchased_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,hsk_level',
    });
    
  if (error) {
    console.error('❌ Purchased level insert error:', error);
  } else {
    console.log(`✅ HSK ${level} added to user's purchased levels`);
  }
}

// ─── Revoke Access Functions ──────────────────────────────────────────────────

async function revokeUserPremium(userId: string) {
  console.log(`🔒 Revoking premium access for user ${userId}`);
  
  // Update auth metadata
  const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { account_tier: 'free' },
  });
  
  if (authError) {
    console.error('❌ Auth metadata revoke error:', authError);
  } else {
    console.log('✅ Auth metadata updated to free');
  }

  // Update profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ account_tier: 'free', is_premium: false })
    .eq('id', userId);
    
  if (profileError) {
    console.error('❌ Profile revoke error:', profileError);
  } else {
    console.log('✅ Profile updated to free');
  }
}

async function removePurchasedLevel(userId: string, level: number) {
  console.log(`🔒 Removing HSK ${level} from user ${userId}`);
  
  const { error } = await supabase
    .from('purchased_levels')
    .delete()
    .eq('user_id', userId)
    .eq('hsk_level', level);
    
  if (error) {
    console.error('❌ Purchased level delete error:', error);
  } else {
    console.log(`✅ HSK ${level} removed from user's purchased levels`);
  }
}

// NOTE: removeAllPurchasedLevels has been intentionally removed.
// 
// When revoking premium, we should NOT delete individually purchased levels.
// Users who bought HSK 2, then HSK 3, then Premium should keep HSK 2 and 3
// if they later refund the Premium purchase.
//
// The only time a purchased level should be removed is when that specific
// level purchase is refunded (handled by removePurchasedLevel).

// ─── Purchase Record Functions ────────────────────────────────────────────────

async function updatePurchaseRecord(
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
    console.log(`📝 Updated purchase record: ${sessionId} -> ${status}`);
  }
}

async function getPurchaseByPaymentIntent(paymentIntentId: string) {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .limit(1)
    .single();
    
  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    console.error('❌ Error fetching purchase:', error);
    return null;
  }
  
  return data;
}

// ─── Refund Processing ────────────────────────────────────────────────────────

async function processRefund(
  paymentIntentId: string,
  refundedAmount: number,
  totalAmount: number
) {
  console.log(`💸 Processing refund for payment ${paymentIntentId}`);
  console.log(`   Refunded: ${refundedAmount} / Total: ${totalAmount}`);
  
  // Find the purchase record
  const purchase = await getPurchaseByPaymentIntent(paymentIntentId);
  
  if (!purchase) {
    console.error('❌ No purchase found for payment intent:', paymentIntentId);
    
    // Try to find via checkout session metadata from Stripe
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const sessions = await stripe.checkout.sessions.list({
        payment_intent: paymentIntentId,
        limit: 1,
      });
      
      if (sessions.data.length > 0) {
        const session = sessions.data[0];
        const userId = session.metadata?.user_id;
        const productType = session.metadata?.product_type;
        const hskLevel = session.metadata?.hsk_level;
        
        console.log('📋 Found session metadata:', { userId, productType, hskLevel });
        
        if (userId) {
          await revokeAccessForUser(userId, productType || 'premium', hskLevel);
        }
      }
    } catch (err) {
      console.error('❌ Failed to fetch payment intent details:', err);
    }
    return;
  }
  
  const { user_id, product_type, hsk_level, stripe_session_id } = purchase;
  
  // Check if this is a full refund
  const isFullRefund = refundedAmount >= totalAmount;
  
  console.log(`📋 Purchase details:`, {
    userId: user_id,
    productType: product_type,
    hskLevel: hsk_level,
    isFullRefund,
  });
  
  // Update purchase record
  await updatePurchaseRecord(stripe_session_id, paymentIntentId, null, 'refunded');
  
  // Revoke access for full refunds
  if (isFullRefund) {
    await revokeAccessForUser(user_id, product_type, hsk_level?.toString());
    console.log('✅ Access revoked due to full refund');
  } else {
    // For partial refunds, log but don't revoke (manual review needed)
    console.log('⚠️ Partial refund - manual review may be needed');
    console.log(`   Refunded ${refundedAmount} of ${totalAmount} (${Math.round(refundedAmount/totalAmount*100)}%)`);
  }
}

async function revokeAccessForUser(
  userId: string, 
  productType: string | null, 
  hskLevel: string | null | undefined
) {
  if (productType === 'premium') {
    // Only revoke premium status, DO NOT remove individually purchased levels!
    // 
    // IMPORTANT: The purchased_levels table contains levels purchased INDIVIDUALLY,
    // not levels unlocked via premium. Premium access is tracked separately via
    // the account_tier/is_premium fields in the profiles table.
    //
    // Scenario:
    // 1. User buys HSK 2 → purchased_levels has HSK 2
    // 2. User buys HSK 3 → purchased_levels has HSK 2, 3
    // 3. User buys Premium → account_tier = 'premium' (purchased_levels unchanged)
    // 4. User refunds Premium → account_tier = 'free' (user KEEPS HSK 2, 3)
    //
    // This ensures users who bought individual levels before upgrading to premium
    // retain those individual purchases if they later refund premium.
    
    await revokeUserPremium(userId);
    console.log('✅ Premium revoked. User retains any individually purchased HSK levels.');
  } else if (productType === 'hsk_level' && hskLevel) {
    // Only remove the specific level that was refunded
    const level = parseInt(hskLevel, 10);
    if (level >= 2 && level <= 9) {
      await removePurchasedLevel(userId, level);
    }
  } else {
    // Fallback: assume it was a premium purchase (legacy)
    console.log('⚠️ Unknown product type, treating as premium');
    await revokeUserPremium(userId);
    // Note: Still NOT removing purchased_levels for safety
  }
}

// ─── Dispute Processing ───────────────────────────────────────────────────────

async function processDispute(dispute: Stripe.Dispute) {
  console.log(`⚠️ Processing dispute ${dispute.id}`);
  console.log(`   Reason: ${dispute.reason}`);
  console.log(`   Amount: ${dispute.amount} ${dispute.currency}`);
  
  const paymentIntentId = dispute.payment_intent as string;
  
  // Find the purchase
  const purchase = await getPurchaseByPaymentIntent(paymentIntentId);
  
  if (!purchase) {
    console.error('❌ No purchase found for disputed payment:', paymentIntentId);
    return;
  }
  
  const { user_id, product_type, hsk_level, stripe_session_id } = purchase;
  
  // Update purchase record
  await updatePurchaseRecord(stripe_session_id, paymentIntentId, null, 'disputed');
  
  // IMPORTANT: For disputes, we should immediately revoke access
  // The customer has initiated a chargeback, meaning they're claiming fraud/unauthorized
  await revokeAccessForUser(user_id, product_type, hsk_level?.toString());
  
  console.log('🔒 Access revoked due to dispute/chargeback');
  
  // Log evidence details for responding to the dispute
  console.log('📋 Evidence for dispute response:');
  console.log(`   User ID: ${user_id}`);
  console.log(`   Purchase date: ${purchase.completed_at || purchase.created_at}`);
  console.log(`   Product: ${product_type}${hsk_level ? ` (HSK ${hsk_level})` : ''}`);
  console.log(`   Evidence due by: ${dispute.evidence_details?.due_by 
    ? new Date(dispute.evidence_details.due_by * 1000).toISOString() 
    : 'Unknown'}`);
}

// ─── Webhook Handler ──────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Only allow POST from Stripe
  res.setHeader('Access-Control-Allow-Origin', 'https://stripe.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Stripe-Signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate webhook secret is configured
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  const sig = (req.headers['stripe-signature'] || req.headers['Stripe-Signature']) as string | string[] | undefined;
  if (!sig) {
    console.error('❌ Missing Stripe signature');
    return res.status(400).json({ error: 'Missing signature' });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await buffer(req);
    const signature = Array.isArray(sig) ? sig[0] : sig;
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Webhook signature verification failed:', message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Idempotency check
  if (!markEventProcessed(event.id)) {
    console.log(`⏭️ Skipping already processed event: ${event.id}`);
    return res.json({ received: true, skipped: true });
  }

  console.log(`📩 Webhook received: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      // ─── Payment Success ────────────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const productType = session.metadata?.product_type;
        const hskLevel = session.metadata?.hsk_level;

        console.log('💳 Checkout completed:', {
          sessionId: session.id,
          userId,
          productType,
          hskLevel,
          amount: session.amount_total,
          currency: session.currency,
        });

        if (!userId) {
          console.error('❌ No user_id in session metadata!');
          break;
        }

        // Update purchase record
        await updatePurchaseRecord(
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
          console.log('⚠️ Profile not found, creating...');
          const { data: userData } = await supabase.auth.admin.getUserById(userId);
          if (userData?.user) {
            await supabase.from('profiles').insert({
              id: userId,
              email: userData.user.email,
              account_tier: 'free',
              is_premium: false,
            });
          }
        }

        // Grant access based on product type
        if (productType === 'premium') {
          await setUserPremium(userId);
        } else if (productType === 'hsk_level' && hskLevel) {
          const level = parseInt(hskLevel, 10);
          if (level >= 2 && level <= 9) {
            await addPurchasedLevel(userId, level, session.payment_intent as string);
          } else {
            console.error('❌ Invalid HSK level:', hskLevel);
          }
        } else {
          // Fallback: treat as premium
          console.log('🔄 Processing as legacy premium purchase');
          await setUserPremium(userId);
        }

        console.log('✅ Purchase processing complete!');
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('💰 Payment succeeded:', paymentIntent.id);
        // checkout.session.completed handles the main logic
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('❌ Payment failed:', paymentIntent.id);
        console.log('   Failure:', paymentIntent.last_payment_error?.message);
        
        const purchase = await getPurchaseByPaymentIntent(paymentIntent.id);
        if (purchase) {
          await updatePurchaseRecord(purchase.stripe_session_id, paymentIntent.id, null, 'failed');
        }
        break;
      }

      // ─── Refunds ────────────────────────────────────────────────────────
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('💸 Charge refunded event:', charge.id);
        
        // Get the refunded amount and total
        const refundedAmount = charge.amount_refunded;
        const totalAmount = charge.amount;
        
        await processRefund(
          charge.payment_intent as string,
          refundedAmount,
          totalAmount
        );
        break;
      }

      case 'refund.created': {
        const refund = event.data.object as Stripe.Refund;
        console.log('💸 Refund created:', refund.id);
        console.log(`   Amount: ${refund.amount} ${refund.currency}`);
        console.log(`   Reason: ${refund.reason || 'Not specified'}`);
        // charge.refunded will handle the actual access revocation
        break;
      }

      case 'refund.updated': {
        const refund = event.data.object as Stripe.Refund;
        console.log('💸 Refund updated:', refund.id);
        console.log(`   Status: ${refund.status}`);
        
        // If refund failed, we might need to restore access
        if (refund.status === 'failed') {
          console.log('⚠️ Refund failed - access should NOT have been revoked');
          // Note: We only revoke access on charge.refunded, so this shouldn't happen
        }
        break;
      }

      // ─── Disputes/Chargebacks ───────────────────────────────────────────
      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        await processDispute(dispute);
        break;
      }

      case 'charge.dispute.closed': {
        const dispute = event.data.object as Stripe.Dispute;
        console.log(`📋 Dispute closed: ${dispute.id}`);
        console.log(`   Status: ${dispute.status}`);
        
        // If we won the dispute, we could restore access
        // But this requires careful consideration - the user might still be malicious
        if (dispute.status === 'won') {
          console.log('✅ Dispute won! Consider restoring access manually if appropriate.');
          // We don't automatically restore access - manual review recommended
        } else if (dispute.status === 'lost') {
          console.log('❌ Dispute lost. Access remains revoked.');
        }
        break;
      }

      // ─── Subscription Events (if you add subscriptions later) ──────────
      case 'customer.subscription.deleted': {
        // Handle subscription cancellation if you implement subscriptions
        const subscription = event.data.object as Stripe.Subscription;
        console.log('📋 Subscription deleted:', subscription.id);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    // Still return 200 to prevent Stripe retries for handler errors
    // Stripe will show the error in the webhook logs
  }

  res.json({ received: true });
}
