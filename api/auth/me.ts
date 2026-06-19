import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

// An account whose own created_at meaningfully predates its Apple/Google identity's created_at
// existed before this sign-in — i.e. Supabase's auto-linking-by-verified-email attached this
// OAuth sign-in to a pre-existing account that already has its own email/password. A fresh
// OAuth signup creates both rows together, so the gap there is near-zero.
// Duplicated in api/auth/account.ts and mobile/contexts/AuthContext.tsx (separate repo) —
// Vercel's ESM runtime doesn't resolve cross-file imports within api/ in this project, so this
// can't be a shared helper; keep all three in sync if this threshold or logic changes.
const PRE_EXISTING_ACCOUNT_THRESHOLD_MS = 60 * 1000;

function accountHasPassword(user: User): boolean {
  const oauthIdentity = (user.identities ?? []).find((id) => ['apple', 'google'].includes(id.provider));
  if (!oauthIdentity) return true;
  const accountCreatedMs = new Date(user.created_at).getTime();
  const identityCreatedMs = oauthIdentity.created_at
    ? new Date(oauthIdentity.created_at).getTime()
    : accountCreatedMs;
  return accountCreatedMs < identityCreatedMs - PRE_EXISTING_ACCOUNT_THRESHOLD_MS;
}

const ALLOWED_ORIGINS = new Set(
  ['https://hamhao.com', 'https://www.hamhao.com', process.env.FRONTEND_URL].filter(Boolean) as string[]
);
function setCors(res: VercelResponse, origin: string | undefined) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : null;
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', allowed);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (process.env.NODE_ENV !== 'production') {
    res.setHeader('Access-Control-Allow-Origin', origin ?? '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

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
  setCors(res, req.headers.origin as string | undefined);

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
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('account_tier, is_premium, stripe_customer_id, email, tos_accepted_at, privacy_accepted_at')
      .eq('id', user.id)
      .single();
    if (profileErr) {
      console.error(`/api/auth/me profile query failed for user ${user.id}:`, profileErr.code, profileErr.message);
    }

    // Sync email to profiles table if it doesn't match (e.g., after email change)
    if (profile && user.email && profile.email !== user.email) {
      console.log(`Syncing email for user ${user.id}: ${profile.email} -> ${user.email}`);
      await supabase
        .from('profiles')
        .update({ email: user.email })
        .eq('id', user.id);
    }

    // Backfill consent timestamps for accounts created via OAuth (Apple/Google), which
    // bypass /api/auth/signup.ts entirely — Supabase creates the auth.users row directly.
    // The OAuth buttons show a "by continuing you agree to..." disclaimer, so the first
    // authenticated request after sign-in is treated as the acceptance moment.
    if (profile && (!profile.tos_accepted_at || !profile.privacy_accepted_at)) {
      const now = new Date().toISOString();
      await supabase
        .from('profiles')
        .update({
          tos_accepted_at: profile.tos_accepted_at || now,
          privacy_accepted_at: profile.privacy_accepted_at || now,
        })
        .eq('id', user.id);
    }

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
      stripe_customer_id: profile?.stripe_customer_id || null,
      has_password: accountHasPassword(user),
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
