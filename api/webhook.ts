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
    processedEvents.delete(firstItem);
  }
  
  processedEvents.add(eventId);
  return true;
}

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

        // Apply the purchase
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
        // checkout.session.completed handles the logic
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('❌ Payment failed:', paymentIntent.id);
        console.log('Failure:', paymentIntent.last_payment_error?.message);
        
        // Update purchase record if we can find it
        const { data: purchases } = await supabase
          .from('purchases')
          .select('stripe_session_id')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .limit(1);
          
        if (purchases?.[0]) {
          await updatePurchaseRecord(purchases[0].stripe_session_id, paymentIntent.id, null, 'failed');
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('💸 Charge refunded:', charge.id);
        
        const { data: purchases } = await supabase
          .from('purchases')
          .select('stripe_session_id')
          .eq('stripe_payment_intent_id', charge.payment_intent)
          .limit(1);
          
        if (purchases?.[0]) {
          await updatePurchaseRecord(purchases[0].stripe_session_id, charge.payment_intent as string, null, 'refunded');
        }
        
        // Note: We don't automatically revoke access on refund
        // This should be handled manually or via a separate process
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        console.log('⚠️ Dispute created:', dispute.id, 'Reason:', dispute.reason);
        
        const { data: purchases } = await supabase
          .from('purchases')
          .select('stripe_session_id, user_id, product_type')
          .eq('stripe_payment_intent_id', dispute.payment_intent)
          .limit(1);
          
        if (purchases?.[0]) {
          await updatePurchaseRecord(purchases[0].stripe_session_id, dispute.payment_intent as string, null, 'disputed');
          
          // Log for manual review
          console.log('📋 Dispute details:', {
            userId: purchases[0].user_id,
            productType: purchases[0].product_type,
            amount: dispute.amount,
            reason: dispute.reason,
            evidenceDueBy: dispute.evidence_details?.due_by 
              ? new Date(dispute.evidence_details.due_by * 1000).toISOString() 
              : null,
          });
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    // Still return 200 to prevent Stripe retries for handler errors
  }

  res.json({ received: true });
}
