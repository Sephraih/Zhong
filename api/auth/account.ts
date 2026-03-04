import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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
  // CORS headers - be permissive for same-origin requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || process.env.FRONTEND_URL || '*');
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

  // Verify current password for sensitive actions
  if (['change-email', 'change-password', 'delete-account'].includes(action)) {
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
      case 'change-email': {
        if (!newEmail) {
          return res.status(400).json({ error: 'New email is required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
          return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check if same as current
        if (newEmail.toLowerCase() === user.email?.toLowerCase()) {
          return res.status(400).json({ error: 'New email must be different from current email' });
        }

        // Check if email is already in use
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const emailInUse = existingUsers?.users?.some(
          u => u.email?.toLowerCase() === newEmail.toLowerCase() && u.id !== user.id
        );
        if (emailInUse) {
          return res.status(400).json({ error: 'This email is already in use' });
        }

        // Determine the redirect URL for email confirmation
        const baseUrl = process.env.FRONTEND_URL || 'https://hamhao.com';
        const redirectTo = `${baseUrl}/auth/callback`;

        // Generate a confirmation link for the email change
        // This will send a confirmation email to the NEW email address
        const { error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'email_change_new',
          email: user.email!,
          newEmail: newEmail,
          options: {
            redirectTo: redirectTo,
          },
        });

        if (linkError) {
          console.error('Error generating email change link:', linkError);
          return res.status(400).json({ 
            error: linkError.message || 'Failed to initiate email change' 
          });
        }

        console.log('Email change initiated for user:', user.id);
        
        return res.json({ 
          success: true, 
          message: 'A confirmation link has been sent to your new email address. Please click the link to confirm the change. Your current email will remain active until you confirm.',
          requiresConfirmation: true,
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
