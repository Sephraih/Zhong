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
  
  // Insert into purchased_levels
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
    console.log(`📝 Updated purchase record for session ${sessionId} to status: ${status}`);
  }
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
            await supabase.from('profiles').insert({
              id: userId,
              email: userData.user.email,
              account_tier: 'free',
              is_premium: false,
            });
            console.log('✅ Profile created');
          }
        }

        // Handle based on product type
        if (productType === 'premium') {
          console.log('🔄 Processing Premium purchase...');
          await setUserPremium(userId);
        } else if (productType === 'hsk_level' && hskLevel) {
          console.log(`🔄 Processing HSK ${hskLevel} purchase...`);
          await addPurchasedLevel(userId, parseInt(hskLevel, 10), session.payment_intent as string);
        } else {
          // Fallback: treat as premium purchase for backwards compatibility
          console.log('🔄 Processing legacy premium purchase...');
          await setUserPremium(userId);
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
        // Note: We may not have the session ID directly, so we use payment_intent_id
        const { data: purchases } = await supabase
          .from('purchases')
          .select('stripe_session_id')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .limit(1);
          
        if (purchases && purchases.length > 0) {
          await updatePurchaseRecord(
            purchases[0].stripe_session_id,
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
        
        // Find purchase by payment intent
        const { data: purchases } = await supabase
          .from('purchases')
          .select('stripe_session_id')
          .eq('stripe_payment_intent_id', charge.payment_intent)
          .limit(1);
          
        if (purchases && purchases.length > 0) {
          await updatePurchaseRecord(
            purchases[0].stripe_session_id,
            charge.payment_intent as string,
            null,
            'refunded'
          );
        }
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        console.log('⚠️ Dispute created:', dispute.id);
        
        // Find purchase by payment intent
        const { data: purchases } = await supabase
          .from('purchases')
          .select('stripe_session_id')
          .eq('stripe_payment_intent_id', dispute.payment_intent)
          .limit(1);
          
        if (purchases && purchases.length > 0) {
          await updatePurchaseRecord(
            purchases[0].stripe_session_id,
            dispute.payment_intent as string,
            null,
            'disputed'
          );
          
          // Log dispute details for chargeback response
          console.log('📋 Dispute details for chargeback response:');
          console.log('  Reason:', dispute.reason);
          console.log('  Amount:', dispute.amount);
          console.log('  Evidence due by:', new Date((dispute.evidence_details?.due_by || 0) * 1000).toISOString());
          
          // Fetch the purchase evidence
          const { data: evidence } = await supabase
            .from('purchase_evidence')
            .select('*')
            .eq('stripe_session_id', purchases[0].stripe_session_id)
            .single();
            
          if (evidence) {
            console.log('📝 Evidence for chargeback:', evidence.evidence_summary);
          }
        }
        break;
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
  }

  res.json({ received: true });
}
