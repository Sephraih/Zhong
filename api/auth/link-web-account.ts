import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// An account whose own created_at meaningfully predates its Apple/Google identity's created_at
// existed before this sign-in — i.e. Supabase's auto-linking-by-verified-email attached this
// OAuth sign-in to a pre-existing account that already has its own email/password. A fresh
// OAuth signup creates both rows together, so the gap there is near-zero.
const PRE_EXISTING_ACCOUNT_THRESHOLD_MS = 60 * 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res, req.headers.origin as string | undefined);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' });

  const { email, password } = req.body ?? {};
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .select('web_linked')
    .eq('id', user.id)
    .single();
  if (profileErr) {
    console.error('[link-web-account] profile lookup error:', profileErr);
    return res.status(500).json({ error: 'Internal error' });
  }
  if (profile?.web_linked) {
    return res.status(400).json({ error: 'This account already has web access set up.' });
  }

  // Defense in depth (mirrors the client-side check): never overwrite a pre-existing account's
  // password, even if a stale/bypassed client somehow still calls this.
  const oauthIdentity = (user.identities ?? []).find(i => i.provider === 'apple' || i.provider === 'google');
  if (oauthIdentity?.created_at) {
    const accountCreatedMs = new Date(user.created_at).getTime();
    const identityCreatedMs = new Date(oauthIdentity.created_at).getTime();
    if (accountCreatedMs < identityCreatedMs - PRE_EXISTING_ACCOUNT_THRESHOLD_MS) {
      return res.status(409).json({
        error: 'This account already has web access. Sign in at hamhao.com with your existing email and password.',
      });
    }
  }

  const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, { email, password });
  if (updateErr) {
    console.error('[link-web-account] updateUserById error:', updateErr);
    return res.status(400).json({ error: updateErr.message });
  }

  const { error: flagErr } = await supabaseAdmin
    .from('profiles')
    .update({ web_linked: true })
    .eq('id', user.id);
  if (flagErr) console.error('[link-web-account] failed to set web_linked flag:', flagErr);

  return res.json({ success: true });
}
