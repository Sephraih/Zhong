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

        if (!userId) {
          console.error('❌ No user_id in session metadata!');
          break;
        }

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

        // 1) Always write an auditable purchase record (chargeback-proof)
        try {
          const amountTotal = (session.amount_total ?? null) as number | null;
          const currency = (session.currency ?? null) as string | null;
          const consent = (session as any).consent ?? null; // Stripe may include this depending on API version

          const { error: purchaseError } = await supabase
            .from('purchases')
            .insert({
              user_id: userId,
              stripe_session_id: session.id,
              stripe_payment_intent_id: (session.payment_intent as string) || null,
              stripe_customer_id: (session.customer as string) || null,
              stripe_price_id: session.metadata?.stripe_price_id || null,
              product_type: productType || 'premium',
              hsk_level: hskLevel ? parseInt(hskLevel, 10) : null,
              amount_total: amountTotal,
              currency,
              payment_status: session.payment_status || null,
              tos_url: session.metadata?.tos_url || null,
              privacy_url: session.metadata?.privacy_url || null,
              tos_version: session.metadata?.tos_version || null,
              privacy_version: session.metadata?.privacy_version || null,
              consent_json: consent,
              stripe_session_json: session,
              purchased_at: new Date().toISOString(),
            });

          if (purchaseError) {
            console.error('❌ Purchase audit insert error:', purchaseError);
          } else {
            console.log('✅ Purchase audit record written');
          }
        } catch (e) {
          console.error('❌ Purchase audit exception:', e);
        }

        // 2) Apply entitlements based on product type
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
        break;
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
  }

  res.json({ received: true });
}
