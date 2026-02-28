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
    const { email, password, accept_tos, accept_privacy } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (accept_tos !== true || accept_privacy !== true) {
      return res.status(400).json({ error: 'You must accept the Terms of Service and Privacy Policy' });
    }

        // Ensure email confirmation redirects back into the app
    const proto = (req.headers["x-forwarded-proto"] as string) || "https";
    const host = (req.headers["x-forwarded-host"] as string) || req.headers.host;
    const baseUrl = process.env.FRONTEND_URL || (host ? `${proto}://${host}` : undefined);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: baseUrl ? { emailRedirectTo: `${baseUrl}/auth/callback` } : undefined,
    });
    if (error) return res.status(400).json({ error: error.message });

    // Record consent timestamps in profiles (profile row is created by trigger)
    if (data.user?.id) {
      await supabase
        .from('profiles')
        .update({
          tos_accepted_at: new Date().toISOString(),
          privacy_accepted_at: new Date().toISOString(),
        })
        .eq('id', data.user.id);
    }

    res.json({ user: data.user, session: data.session });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
