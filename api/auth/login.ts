import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Rate limiting in-memory store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // max login attempts per minute

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

// Validate email format
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password
function isValidPassword(password: string): boolean {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 1 || password.length > 128) return false;
  return true;
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  
  // CORS headers - restrict to known origins
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const clientIp = getClientIp(req);
  if (isRateLimited(`login:${clientIp}`)) {
    return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
  }

  try {
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { email, password } = req.body;
    
    // Input validation
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    
    if (!password || !isValidPassword(password)) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Additional rate limiting per email
    if (isRateLimited(`login:email:${trimmedEmail}`)) {
      return res.status(429).json({ error: 'Too many login attempts for this account. Please try again later.' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });
    
    if (error) {
      // Generic error message to prevent email enumeration
      console.log(`Login failed for ${trimmedEmail}: ${error.message}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!data.user || !data.session) {
      return res.status(401).json({ error: 'Login failed' });
    }

    // Fetch account tier and purchased levels
    let accountTier = 'free';
    let purchasedLevels: number[] = [];
    
    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_tier, is_premium')
      .eq('id', data.user.id)
      .single();
    
    // Determine tier
    accountTier = profile?.account_tier || 'free';
    if (profile?.is_premium === true && accountTier === 'free') {
      accountTier = 'premium';
    }

    // Get purchased levels
    const { data: purchasedLevelsData } = await supabase
      .from('purchased_levels')
      .select('hsk_level')
      .eq('user_id', data.user.id)
      .order('hsk_level', { ascending: true });

    purchasedLevels = purchasedLevelsData?.map(p => p.hsk_level) || [];

    console.log(`✅ Login successful for ${trimmedEmail}`);

    res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
      },
      session: {
        access_token: data.session.access_token,
        expires_at: data.session.expires_at,
      },
      account_tier: accountTier,
      purchased_levels: purchasedLevels,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}
