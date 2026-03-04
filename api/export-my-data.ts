import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Rate limiting - strict for data export
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_EXPORTS = 5; // max exports per hour

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (record.count >= RATE_LIMIT_MAX_EXPORTS) {
    return true;
  }
  
  record.count++;
  return false;
}

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
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Rate limit per user
    if (isRateLimited(`export:${user.id}`)) {
      return res.status(429).json({ error: 'Too many export requests. Please try again later.' });
    }

    // Gather profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_tier, is_premium, stripe_customer_id, created_at, updated_at, tos_accepted_at, privacy_accepted_at')
      .eq('id', user.id)
      .maybeSingle();

    // Gather learning progress
    const { data: learnedWords } = await supabase
      .from('user_learned_words')
      .select('learned_bits, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();

    // Gather purchased levels
    const { data: purchasedLevels } = await supabase
      .from('purchased_levels')
      .select('hsk_level, purchased_at')
      .eq('user_id', user.id);

    // Gather purchase history (if table exists)
    let purchases = null;
    try {
      const { data } = await supabase
        .from('purchases')
        .select('product_type, hsk_level, status, completed_at, amount_cents, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      purchases = data;
    } catch {
      // Table might not exist
    }

    const exportData = {
      exported_at: new Date().toISOString(),
      account: {
        user_id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at,
      },
      profile: profile ? {
        account_tier: profile.account_tier,
        is_premium: profile.is_premium,
        stripe_customer_id: profile.stripe_customer_id ? '[REDACTED]' : null,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        tos_accepted_at: profile.tos_accepted_at,
        privacy_accepted_at: profile.privacy_accepted_at,
      } : null,
      learning_progress: learnedWords ? {
        learned_bits: learnedWords.learned_bits,
        updated_at: learnedWords.updated_at,
      } : null,
      purchased_levels: purchasedLevels?.map(p => ({
        hsk_level: p.hsk_level,
        purchased_at: p.purchased_at,
      })) ?? [],
      purchase_history: purchases?.map(p => ({
        product_type: p.product_type,
        hsk_level: p.hsk_level,
        status: p.status,
        completed_at: p.completed_at,
        amount_cents: p.amount_cents,
        created_at: p.created_at,
      })) ?? [],
    };

    console.log(`📥 Data exported for user ${user.id}`);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="hamhao-my-data-${new Date().toISOString().slice(0, 10)}.json"`
    );
    res.json(exportData);
  } catch (error: unknown) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
}
