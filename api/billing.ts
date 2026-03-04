import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  record.count++;
  return false;
}

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] as string || 'unknown';
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserFromToken(authHeader: string | undefined) {
  if (!authHeader) return null;
  if (!authHeader.startsWith('Bearer ')) return null;
  
  const token = authHeader.slice(7);
  if (!token || token.split('.').length !== 3) return null;
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

// Cache prices for 5 minutes to reduce Stripe API calls
let pricesCache: { data: any; expiry: number } | null = null;

async function getPrices(): Promise<{
  hsk2: number | null;
  hsk3: number | null;
  hsk4: number | null;
  hsk5: number | null;
  hsk6: number | null;
  premium: number | null;
}> {
  const result = {
    hsk2: null as number | null,
    hsk3: null as number | null,
    hsk4: null as number | null,
    hsk5: null as number | null,
    hsk6: null as number | null,
    premium: null as number | null,
  };

  if (!stripe) {
    return result;
  }

  // Check cache
  if (pricesCache && Date.now() < pricesCache.expiry) {
    return pricesCache.data;
  }

  const priceIds = {
    hsk2: process.env.STRIPE_PRICE_HSK2,
    hsk3: process.env.STRIPE_PRICE_HSK3,
    hsk4: process.env.STRIPE_PRICE_HSK4,
    hsk5: process.env.STRIPE_PRICE_HSK5,
    hsk6: process.env.STRIPE_PRICE_HSK6,
    premium: process.env.STRIPE_PRICE_PREMIUM,
  };

  const fetchPromises = Object.entries(priceIds).map(async ([key, priceId]) => {
    if (priceId) {
      try {
        const price = await stripe.prices.retrieve(priceId);
        return { key, amount: price.unit_amount };
      } catch (e) {
        console.error(`Failed to fetch price for ${key}:`, e);
        return { key, amount: null };
      }
    }
    return { key, amount: null };
  });

  const results = await Promise.all(fetchPromises);
  
  for (const { key, amount } of results) {
    result[key as keyof typeof result] = amount;
  }

  // Cache for 5 minutes
  pricesCache = { data: result, expiry: Date.now() + 5 * 60 * 1000 };

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
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  
  // CORS headers
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'https://hamhao.com',
    'https://www.hamhao.com',
  ].filter(Boolean);
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV !== 'production') {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const clientIp = getClientIp(req);
  if (isRateLimited(`billing:${clientIp}`)) {
    return res.status(429).json({ error: 'Too many requests' });
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

    // GET /api/billing - returns prices (no auth required, cached)
    const prices = await getPrices();
    return res.json(prices);
  } catch (error) {
    console.error('Billing error:', error);
    return res.status(500).json({ error: 'Unable to fetch billing information' });
  }
}
