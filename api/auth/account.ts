import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserFromToken(authHeader: string | undefined) {
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await getUserFromToken(req.headers.authorization);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { action, currentPassword, newEmail, newPassword } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required' });
    }

    // Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Handle different actions
    if (action === 'change-email') {
      if (!newEmail) {
        return res.status(400).json({ error: 'New email is required' });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      if (newEmail === user.email) {
        return res.status(400).json({ error: 'New email must be different from current email' });
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

      // Update email in profiles table
      await supabase
        .from('profiles')
        .update({ email: newEmail })
        .eq('id', user.id);

      return res.json({ 
        success: true, 
        message: 'Email updated successfully. Please check your new email for confirmation.' 
      });

    } else if (action === 'change-password') {
      if (!newPassword) {
        return res.status(400).json({ error: 'New password is required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }

      if (newPassword === currentPassword) {
        return res.status(400).json({ error: 'New password must be different from current password' });
      }

      // Update password
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

    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Account update error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
