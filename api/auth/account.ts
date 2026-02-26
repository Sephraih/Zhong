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
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, currentPassword, newEmail, newPassword } = req.body || {};

  if (!action) {
    return res.status(400).json({ error: 'Action is required' });
  }

  // Handle logout (no auth required)
  if (action === 'logout') {
    try {
      await supabase.auth.signOut();
      return res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ error: 'Logout failed' });
    }
  }

  // All other actions require authentication
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Verify current password for sensitive actions
  if (['change-email', 'change-password', 'delete-account'].includes(action)) {
    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required' });
    }

    // Verify password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
  }

  try {
    switch (action) {
      case 'change-email': {
        if (!newEmail) {
          return res.status(400).json({ error: 'New email is required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
          return res.status(400).json({ error: 'Invalid email format' });
        }

        // Update email in Supabase Auth
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          { email: newEmail }
        );

        if (updateError) {
          console.error('Email update error:', updateError);
          return res.status(400).json({ error: updateError.message });
        }

        // Also update in profiles table
        await supabase
          .from('profiles')
          .update({ email: newEmail })
          .eq('id', user.id);

        return res.json({ 
          success: true, 
          message: 'Email updated successfully. Please check your new email for confirmation.' 
        });
      }

      case 'change-password': {
        if (!newPassword) {
          return res.status(400).json({ error: 'New password is required' });
        }

        if (newPassword.length < 6) {
          return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        if (newPassword === currentPassword) {
          return res.status(400).json({ error: 'New password must be different from current password' });
        }

        const { error: updateError } = await supabase.auth.admin.updateUserById(
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

      case 'delete-account': {
        console.log(`🗑️ Deleting account for user: ${user.id}`);

        // Delete user data from tables (cascade should handle most)
        await supabase.from('user_learned_words').delete().eq('user_id', user.id);
        await supabase.from('purchased_levels').delete().eq('user_id', user.id);
        await supabase.from('profiles').delete().eq('id', user.id);

        // Delete the auth user
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

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
