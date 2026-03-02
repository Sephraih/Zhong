import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

async function getPrices(): Promise<{
  hsk2: number | null;
  hsk3: number | null;
  hsk4: number | null;
  premium: number | null;
}> {
  const result = {
    hsk2: null as number | null,
    hsk3: null as number | null,
    hsk4: null as number | null,
    premium: null as number | null,
  };

  if (!stripe) {
    return result;
  }

  const priceIds = {
    hsk2: process.env.STRIPE_PRICE_HSK2,
    hsk3: process.env.STRIPE_PRICE_HSK3,
    hsk4: process.env.STRIPE_PRICE_HSK4,
    premium: process.env.STRIPE_PRICE_PREMIUM,
  };

  for (const [key, priceId] of Object.entries(priceIds)) {
    if (priceId) {
      try {
        const price = await stripe.prices.retrieve(priceId);
        result[key as keyof typeof result] = price.unit_amount;
      } catch (e) {
        console.error(`Failed to fetch price for ${key}:`, e);
      }
    }
  }

  return result;
}

async function getSubscription(userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('account_tier, stripe_customer_id')
    .eq('id', userId)
    .single();

  const { data: purchasedLevels } = await supabase
    .from('purchased_levels')
    .select('hsk_level')
    .eq('user_id', userId);

  const levels = purchasedLevels?.map((p) => p.hsk_level) || [];

  return {
    account_tier: profile?.account_tier || 'free',
    purchased_levels: levels,
    stripe_customer_id: profile?.stripe_customer_id || null,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const action = req.query.action as string | undefined;

  try {
    // GET /api/billing?action=subscription - requires auth
    if (action === 'subscription') {
      const user = await getUserFromToken(req.headers.authorization);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const subscription = await getSubscription(user.id);
      return res.json(subscription);
    }

    // GET /api/billing - returns prices (no auth required)
    const prices = await getPrices();
    return res.json(prices);
  } catch (error) {
    console.error('Billing error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
