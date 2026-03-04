import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX_GET = 30;
const RATE_LIMIT_MAX_POST = 20;

function isRateLimited(key: string, max: number): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (record.count >= max) {
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

// Validation constants
const MAX_LEARNED_BITS_SIZE = 10 * 1024; // 10KB max
const VALID_HSK_LEVELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;
const MAX_VALUE_LENGTH = 2048; // 2KB per level

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

function validateLearnedBits(learnedBits: unknown): { valid: boolean; error?: string } {
  // Must be an object
  if (typeof learnedBits !== 'object' || learnedBits === null || Array.isArray(learnedBits)) {
    return { valid: false, error: 'Invalid data format' };
  }

  // Check overall size
  const jsonStr = JSON.stringify(learnedBits);
  if (jsonStr.length > MAX_LEARNED_BITS_SIZE) {
    return { valid: false, error: 'Data too large' };
  }

  // Validate each key-value pair
  for (const [key, value] of Object.entries(learnedBits)) {
    // Key must be a valid HSK level (1-9)
    if (!VALID_HSK_LEVELS.includes(key)) {
      return { valid: false, error: 'Invalid HSK level' };
    }

    // Value must be a string (base64 encoded)
    if (typeof value !== 'string') {
      return { valid: false, error: 'Invalid value type' };
    }

    // Value should be valid base64
    if (value.length > 0 && !BASE64_REGEX.test(value)) {
      return { valid: false, error: 'Invalid value encoding' };
    }

    // Individual value size limit
    if (value.length > MAX_VALUE_LENGTH) {
      return { valid: false, error: 'Value too large' };
    }
  }

  return { valid: true };
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authenticate user
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET: Fetch learned progress
  if (req.method === 'GET') {
    if (isRateLimited(`progress:get:${user.id}`, RATE_LIMIT_MAX_GET)) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    try {
      const { data, error } = await supabase
        .from('user_learned_words')
        .select('learned_bits, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching progress:', error);
        return res.status(500).json({ error: 'Failed to fetch progress' });
      }

      return res.json({
        learned_bits: data?.learned_bits || {},
        updated_at: data?.updated_at || null,
      });
    } catch (error) {
      console.error('Error in GET learned-progress:', error);
      return res.status(500).json({ error: 'An error occurred' });
    }
  }

  // POST: Save learned progress
  if (req.method === 'POST') {
    if (isRateLimited(`progress:post:${user.id}`, RATE_LIMIT_MAX_POST)) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
    }

    try {
      // Validate request body
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Invalid request body' });
      }

      const { learned_bits } = req.body;

      // Validate the learned_bits structure
      const validation = validateLearnedBits(learned_bits);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      // Upsert the learned progress
      const { error } = await supabase
        .from('user_learned_words')
        .upsert(
          { 
            user_id: user.id, 
            learned_bits,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('Error saving progress:', error);
        return res.status(500).json({ error: 'Failed to save progress' });
      }

      return res.json({ success: true });
    } catch (error) {
      console.error('Error in POST learned-progress:', error);
      return res.status(500).json({ error: 'An error occurred' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
