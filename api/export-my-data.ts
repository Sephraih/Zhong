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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Gather profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // Gather learning progress
    const { data: learnedWords } = await supabase
      .from('user_learned_words')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Gather purchased levels
    const { data: purchasedLevels } = await supabase
      .from('purchased_levels')
      .select('*')
      .eq('user_id', user.id);

    // Gather subscription/payment history (if exists)
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id);

    const exportData = {
      exported_at: new Date().toISOString(),
      account: {
        user_id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      },
      profile: profile ? {
        account_tier: profile.account_tier,
        stripe_customer_id: profile.stripe_customer_id,
        is_premium: profile.is_premium,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      } : null,
      learning_progress: learnedWords ? {
        learned_bits: learnedWords.learned_bits,
        updated_at: learnedWords.updated_at,
      } : null,
      purchased_levels: purchasedLevels?.map(p => ({
        hsk_level: p.hsk_level,
        purchased_at: p.purchased_at,
      })) ?? [],
      payment_history: subscriptions?.map(s => ({
        status: s.status,
        stripe_price_id: s.stripe_price_id,
        created_at: s.created_at,
      })) ?? [],
    };

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="zhongcang-my-data-${new Date().toISOString().slice(0, 10)}.json"`
    );
    res.json(exportData);
  } catch (error: any) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
}
