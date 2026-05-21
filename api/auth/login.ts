import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { setCors } from '../../lib/cors';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res, req.headers.origin as string | undefined);

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

    // Fetch account tier
    let accountTier = 'free';

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_tier, is_premium')
        .eq('id', data.user.id)
        .single();

      accountTier = profile?.account_tier || 'free';
      if (profile?.is_premium === true && accountTier === 'free') {
        accountTier = 'premium';
      }
    }

    res.json({
      user: data.user,
      session: data.session,
      account_tier: accountTier,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
