import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

// Price IDs for each product
const PRICE_IDS: Record<string, string | undefined> = {
  hsk_2: process.env.STRIPE_PRICE_HSK2,
  hsk_3: process.env.STRIPE_PRICE_HSK3,
  hsk_4: process.env.STRIPE_PRICE_HSK4,
  premium: process.env.STRIPE_PRICE_PREMIUM,
};

async function getUserFromToken(authHeader: string | undefined) {
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

async function getOrCreateStripeCustomer(userId: string, email: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  });

  await supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  return customer.id;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await getUserFromToken(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { product_type, hsk_level } = req.body;
    
    // Determine which price to use
    let priceId: string | undefined;
    let productDescription: string;
    
    if (product_type === 'premium') {
      priceId = PRICE_IDS.premium;
      productDescription = 'Premium - All HSK Levels';
    } else if (product_type === 'hsk_level' && hsk_level) {
      priceId = PRICE_IDS[`hsk_${hsk_level}`];
      productDescription = `HSK Level ${hsk_level}`;
    } else {
      // Fallback to old STRIPE_PRICE_ID for backwards compatibility
      priceId = process.env.STRIPE_PRICE_ID;
      productDescription = 'Premium';
    }

    if (!priceId) {
      console.error('Missing price ID for product:', product_type, hsk_level);
      return res.status(400).json({ 
        error: `Price not configured for ${product_type || 'premium'}${hsk_level ? ` level ${hsk_level}` : ''}` 
      });
    }

    const customerId = await getOrCreateStripeCustomer(user.id, user.email || '');

    // Determine success/cancel URLs
    const frontendUrl = process.env.FRONTEND_URL || 
      (req.headers.origin as string) || 
      (req.headers.referer ? new URL(req.headers.referer as string).origin : 'http://localhost:5173');

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment, not subscription
      success_url: `${frontendUrl}/?payment=success`,
      cancel_url: `${frontendUrl}/?payment=cancelled`,
      metadata: {
        user_id: user.id,
        product_type: product_type || 'premium',
        hsk_level: hsk_level?.toString() || '',
      },
    });

    console.log(`✅ Created checkout session for ${productDescription}:`, session.id);
    res.json({ url: session.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Checkout error:', message);
    res.status(500).json({ error: message });
  }
}
