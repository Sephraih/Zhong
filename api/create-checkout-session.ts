import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Use a stable Stripe API version.
  apiVersion: '2024-06-20',
});

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
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

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

    const customerId = await getOrCreateStripeCustomer(user.id, user.email || '');

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return res.status(500).json({ error: 'Missing STRIPE_PRICE_ID env var' });
    }

    // Prefer configured FRONTEND_URL, but fall back to the incoming request host.
    const origin = (req.headers.origin as string | undefined) || '';
    const host = (req.headers.host as string | undefined) || '';
    const fallbackBase = origin || (host ? `${host.startsWith('localhost') ? 'http' : 'https'}://${host}` : '');
    const frontendBase = process.env.FRONTEND_URL || fallbackBase;

    if (!frontendBase) {
      return res.status(500).json({ error: 'Missing FRONTEND_URL and could not infer request origin/host' });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${frontendBase}/?payment=success`,
      cancel_url: `${frontendBase}/?payment=cancelled`,
      metadata: {
        user_id: user.id,
      },
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
