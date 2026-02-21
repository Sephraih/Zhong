import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return res.status(401).json({ error: error.message });

    // Fetch account tier and purchased levels
    let accountTier = 'free';
    let purchasedLevels: number[] = [];
    
    if (data.user) {
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
    }

    res.json({
      user: data.user,
      session: data.session,
      account_tier: accountTier,
      purchased_levels: purchasedLevels,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
