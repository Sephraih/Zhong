import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Rate limiting in-memory store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // Allow frequent checks

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

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserFromToken(authHeader: string | undefined) {
  if (!authHeader) return null;
  
  // Validate bearer token format
  if (!authHeader.startsWith('Bearer ')) return null;
  
  const token = authHeader.slice(7);
  
  // Basic JWT format validation
  if (!token || token.split('.').length !== 3) return null;
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  
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

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const clientIp = getClientIp(req);
  if (isRateLimited(`me:${clientIp}`)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    const user = await getUserFromToken(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get profile with account_tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_tier, is_premium, stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    // Sync email to profiles table if it differs (e.g., after email change confirmation)
    if (profile && user.email && profile.email !== user.email) {
      await supabase
        .from('profiles')
        .update({ email: user.email })
        .eq('id', user.id);
      console.log(`📧 Synced email for user ${user.id}: ${profile.email} -> ${user.email}`);
    }

    // Get purchased levels
    const { data: purchasedLevelsData } = await supabase
      .from('purchased_levels')
      .select('hsk_level')
      .eq('user_id', user.id)
      .order('hsk_level', { ascending: true });

    const purchasedLevels = purchasedLevelsData?.map(p => p.hsk_level) || [];

    // Determine account tier
    let accountTier = profile?.account_tier || 'free';
    if (profile?.is_premium === true && accountTier === 'free') {
      accountTier = 'premium';
    }

    // Also check auth metadata for premium status
    const authPremium = user.app_metadata?.account_tier === 'premium' || user.app_metadata?.is_premium === true;
    if (authPremium && accountTier === 'free') {
      accountTier = 'premium';
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      },
      account_tier: accountTier,
      purchased_levels: purchasedLevels,
      stripe_customer_id: profile?.stripe_customer_id || null,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}
