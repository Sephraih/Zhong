import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

// An account whose own created_at meaningfully predates its Apple/Google identity's created_at
// existed before this sign-in — i.e. Supabase's auto-linking-by-verified-email attached this
// OAuth sign-in to a pre-existing account that already has its own email/password. A fresh
// OAuth signup creates both rows together, so the gap there is near-zero.
// Duplicated in api/auth/me.ts and mobile/contexts/AuthContext.tsx (separate repo) — Vercel's
// ESM runtime doesn't resolve cross-file imports within api/ in this project, so this can't be
// a shared helper; keep all three in sync if this threshold or logic changes.
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

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserFromToken(authHeader: string | undefined) {
  if (!authHeader) return null;
  const authToken = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(authToken);
  if (error || !user) return null;
  return { user };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res, req.headers.origin as string | undefined);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, currentPassword, newPassword } = req.body || {};

  if (!action) {
    return res.status(400).json({ error: 'Action is required' });
  }

  // Handle logout (no auth required)
  if (action === 'logout') {
    try {
      await supabaseAdmin.auth.signOut();
      return res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ error: 'Logout failed' });
    }
  }

  // All other actions require authentication
  const authResult = await getUserFromToken(req.headers.authorization);
  if (!authResult) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { user } = authResult;

  // Verify current password for sensitive actions. For delete-account, the question isn't
  // "did they sign in via Apple/Google" but "does this account currently have a password at
  // all" — a fresh OAuth-only account never has one to verify.
  let requiresPassword = action === 'change-password';
  if (action === 'delete-account') {
    requiresPassword = accountHasPassword(user);
  }

  if (requiresPassword) {
    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required' });
    }

    // Verify password by attempting to sign in
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
  }

  try {
    switch (action) {
      // change-email is handled client-side now (see Zhong/src/contexts/AuthContext.tsx and
      // mobile/contexts/AuthContext.tsx) — it goes through supabase.auth.updateUser() on the
      // user's own session so Supabase's built-in secure email change confirmation actually
      // fires, which this admin-driven endpoint has no way to trigger.

      case 'change-password': {
        if (!newPassword) {
          return res.status(400).json({ error: 'New password is required' });
        }

        if (newPassword.length < 8) {
          return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        if (newPassword === currentPassword) {
          return res.status(400).json({ error: 'New password must be different from current password' });
        }

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          { password: newPassword }
        );

        if (updateError) {
          console.error('Password update error:', updateError);
          return res.status(400).json({ error: updateError.message });
        }

        return res.json({
          success: true,
          message: 'Password updated successfully'
        });
      }

      case 'reset-password': {
        // No current password check — the recovery token itself proves identity.
        if (!newPassword) {
          return res.status(400).json({ error: 'New password is required' });
        }

        if (newPassword.length < 8) {
          return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          { password: newPassword }
        );

        if (resetError) {
          console.error('Password reset error:', resetError);
          return res.status(400).json({ error: resetError.message });
        }

        return res.json({ success: true, message: 'Password updated successfully' });
      }

      case 'delete-account': {
        console.log(`🗑️ Deleting account for user: ${user.id}`);

        // Delete user data from tables (cascade should handle most)
        await supabaseAdmin.from('user_learned_words').delete().eq('user_id', user.id);
        await supabaseAdmin.from('purchased_levels').delete().eq('user_id', user.id);
        await supabaseAdmin.from('profiles').delete().eq('id', user.id);

        // Delete the auth user
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

        if (deleteError) {
          console.error('Delete user error:', deleteError);
          return res.status(500).json({ error: 'Failed to delete account' });
        }

        console.log(`✅ Account deleted: ${user.id}`);
        return res.json({ 
          success: true, 
          message: 'Account deleted successfully' 
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    console.error('Account action error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
