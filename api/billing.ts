import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
const ALLOWED_ORIGINS = new Set(
  ['https://hamhao.com', 'https://www.hamhao.com', process.env.FRONTEND_URL].filter(Boolean) as string[]
);
function setCors(res: VercelResponse, origin: string | undefined) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : null;
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', allowed);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (process.env.NODE_ENV !== 'production') {
    res.setHeader('Access-Control-Allow-Origin', origin ?? '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Initialize clients lazily to ensure correct env vars are used per-request
function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(url, key);
}

function getStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    console.warn('STRIPE_SECRET_KEY not configured');
    return null;
  }
  
  // Log which environment we're using (test vs live)
  const isTestMode = secretKey.startsWith('sk_test_');
  const isLiveMode = secretKey.startsWith('sk_live_');
  const vercelEnv = process.env.VERCEL_ENV || 'unknown';
  
  console.log(`🔑 Stripe mode: ${isTestMode ? 'TEST' : isLiveMode ? 'LIVE' : 'UNKNOWN'}, Vercel env: ${vercelEnv}`);
  
  return new Stripe(secretKey);
}

async function getUserFromToken(supabase: SupabaseClient, authHeader: string | undefined) {
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

async function getPrices(stripe: Stripe | null): Promise<{ premium: number | null }> {
  const result = { premium: null as number | null };

  if (!stripe) return result;

  const priceId = process.env.STRIPE_PRICE_PREMIUM;
  if (priceId) {
    try {
      const price = await stripe.prices.retrieve(priceId);
      result.premium = price.unit_amount;
    } catch (e) {
      console.error(`Failed to fetch premium price (${priceId}):`, e);
    }
  }

  return result;
}

interface ProfileRow {
  account_tier?: string;
  stripe_customer_id?: string;
}

async function getSubscription(supabase: SupabaseClient, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('account_tier, stripe_customer_id')
    .eq('id', userId)
    .single() as { data: ProfileRow | null };

  return {
    account_tier: profile?.account_tier || 'free',
    stripe_customer_id: profile?.stripe_customer_id || null,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res, req.headers.origin as string | undefined);
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const action = req.query.action as string | undefined;
  
  const vercelEnv = process.env.VERCEL_ENV || 'unknown';
  console.log(`📍 Billing API - Environment: ${vercelEnv}, Action: ${action || 'prices'}`);

  try {
    // Initialize clients per-request
    const supabase = getSupabaseClient();
    const stripe = getStripeClient();

    // GET /api/billing?action=subscription - requires auth
    if (action === 'subscription') {
      const user = await getUserFromToken(supabase, req.headers.authorization);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const subscription = await getSubscription(supabase, user.id);
      return res.json(subscription);
    }

    // GET /api/billing - returns prices (no auth required)
    const prices = await getPrices(stripe);
    return res.json(prices);
  } catch (error) {
    console.error('Billing error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
