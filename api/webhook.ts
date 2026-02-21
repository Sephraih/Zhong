import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { buffer } from 'micro';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Disable body parsing, need raw body for Stripe signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

async function setUserPremium(userId: string) {
  console.log(`🔧 Setting user ${userId} to premium`);
  
  // Update profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ account_tier: 'premium' })
    .eq('id', userId);
    
  if (profileError) {
    console.error('❌ Profile update error:', profileError);
  } else {
    console.log('✅ Profile updated to premium');
  }
}

async function addPurchasedLevel(userId: string, hskLevel: number, paymentId: string) {
  console.log(`🔧 Adding HSK Level ${hskLevel} for user ${userId}`);
  
  const { error } = await supabase
    .from('purchased_levels')
    .upsert({
      user_id: userId,
      hsk_level: hskLevel,
      stripe_payment_id: paymentId,
      purchased_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,hsk_level'
    });
    
  if (error) {
    console.error('❌ Purchase insert error:', error);
  } else {
    console.log(`✅ HSK Level ${hskLevel} added for user`);
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
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
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
        console.log('📚 HSK Level:', hskLevel);

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
          const { data: user } = await supabase.auth.admin.getUserById(userId);
          if (user) {
            await supabase.from('profiles').insert({
              id: userId,
              email: user.user.email,
              account_tier: 'free',
            });
            console.log('✅ Profile created');
          }
        }

        // Handle based on product type
        if (productType === 'premium') {
          await setUserPremium(userId);
        } else if (productType === 'hsk_level' && hskLevel) {
          const level = parseInt(hskLevel, 10);
          if (!isNaN(level)) {
            await addPurchasedLevel(userId, level, session.id);
          }
        }

        console.log('✅ Purchase complete!');
        break;
      }

      case 'payment_intent.succeeded': {
        // Additional handling if needed
        console.log('💰 Payment intent succeeded');
        break;
      }

      case 'payment_intent.payment_failed': {
        console.log('❌ Payment failed');
        break;
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
  }

  res.json({ received: true });
}
