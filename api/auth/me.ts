import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await getUserFromToken(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get profile with account tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_tier, stripe_customer_id')
      .eq('id', user.id)
      .single();

    // Get purchased levels
    const { data: purchases } = await supabase
      .from('purchased_levels')
      .select('hsk_level')
      .eq('user_id', user.id);

    // Build purchased levels array (always include level 1 for free)
    let purchasedLevels = [1]; // Level 1 is always free for logged-in users
    
    if (profile?.account_tier === 'premium') {
      // Premium users get all levels
      purchasedLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    } else if (purchases && purchases.length > 0) {
      const levels = purchases.map(p => p.hsk_level);
      purchasedLevels = [...new Set([1, ...levels])].sort((a, b) => a - b);
    }

    res.json({
      user,
      account_tier: profile?.account_tier || 'free',
      purchased_levels: purchasedLevels,
      stripe_customer_id: profile?.stripe_customer_id || null,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
