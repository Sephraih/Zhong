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

    // Get profile with account_tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_tier, is_premium, stripe_customer_id')
      .eq('id', user.id)
      .single();

    // Get purchased levels
    const { data: purchasedLevelsData } = await supabase
      .from('purchased_levels')
      .select('hsk_level')
      .eq('user_id', user.id)
      .order('hsk_level', { ascending: true });

    const purchasedLevels = purchasedLevelsData?.map(p => p.hsk_level) || [];

    // Determine account tier
    // Check both account_tier column and legacy is_premium boolean
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
      user,
      account_tier: accountTier,
      purchased_levels: purchasedLevels,
      stripe_customer_id: profile?.stripe_customer_id || null,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
