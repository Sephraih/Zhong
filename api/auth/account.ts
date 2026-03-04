import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Rate limiting in-memory store (resets on cold start, but provides basic protection)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // max requests per window

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  record.count++;
  return false;
}

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string') {
    return realIp;
  }
  return 'unknown';
}

// Validate environment variables
function validateEnv(): { valid: boolean; error?: string } {
  if (!process.env.SUPABASE_URL) return { valid: false, error: 'Server misconfigured' };
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { valid: false, error: 'Server misconfigured' };
  return { valid: true };
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserFromToken(authHeader: string | undefined) {
  if (!authHeader) return null;
  
  // Validate bearer token format
  if (!authHeader.startsWith('Bearer ')) return null;
  
  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  
  // Basic token format validation (JWT has 3 parts)
  if (!token || token.split('.').length !== 3) return null;
  
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;
    return { user, token };
  } catch {
    return null;
  }
}

// Validate email format
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false; // RFC 5321
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password
function isValidPassword(password: string): boolean {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 6 || password.length > 128) return false;
  return true;
}

// Sanitize error messages to avoid leaking sensitive info
function sanitizeErrorMessage(error: any): string {
  const message = error?.message || 'An error occurred';
  
  // Map known error messages to safe alternatives
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password';
  }
  if (message.includes('User not found')) {
    return 'Invalid email or password';
  }
  if (message.includes('Email rate limit exceeded')) {
    return 'Too many requests. Please try again later.';
  }
  
  // Generic fallback for unknown errors
  if (message.includes('database') || message.includes('query') || message.includes('SQL')) {
    return 'An error occurred. Please try again.';
  }
  
  return message;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Validate environment
  const envCheck = validateEnv();
  if (!envCheck.valid) {
    console.error('Environment validation failed');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // CORS headers - restrict to known origins
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'https://hamhao.com',
    'https://www.hamhao.com',
  ].filter(Boolean);
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV !== 'production') {
    // Allow localhost in development
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const clientIp = getClientIp(req);
  if (isRateLimited(`account:${clientIp}`)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  // Validate request body exists
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { action, currentPassword, newEmail, newPassword } = req.body;

  // Validate action
  if (!action || typeof action !== 'string') {
    return res.status(400).json({ error: 'Action is required' });
  }

  const validActions = ['logout', 'change-email', 'change-password', 'delete-account'];
  if (!validActions.includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  // Handle logout (no auth required, but harmless)
  if (action === 'logout') {
    // We don't actually need to do anything server-side for JWT logout
    // The client just needs to delete their token
    return res.json({ success: true, message: 'Logged out successfully' });
  }

  // All other actions require authentication
  const authResult = await getUserFromToken(req.headers.authorization as string);
  if (!authResult) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { user, token } = authResult;

  // Verify current password for sensitive actions
  if (['change-email', 'change-password', 'delete-account'].includes(action)) {
    if (!currentPassword || typeof currentPassword !== 'string') {
      return res.status(400).json({ error: 'Current password is required' });
    }

    if (!isValidPassword(currentPassword)) {
      return res.status(400).json({ error: 'Invalid password format' });
    }

    // Verify password by attempting to sign in
    // Rate limit password verification separately
    if (isRateLimited(`password:${user.id}`)) {
      return res.status(429).json({ error: 'Too many password attempts. Please try again later.' });
    }

    try {
      const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });

      if (signInError) {
        // Don't reveal whether email exists
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    } catch (error) {
      console.error('Password verification error:', error);
      return res.status(401).json({ error: 'Password verification failed' });
    }
  }

  try {
    switch (action) {
      case 'change-email': {
        if (!newEmail || typeof newEmail !== 'string') {
          return res.status(400).json({ error: 'New email is required' });
        }

        const trimmedEmail = newEmail.trim().toLowerCase();

        if (!isValidEmail(trimmedEmail)) {
          return res.status(400).json({ error: 'Invalid email format' });
        }

        if (trimmedEmail === user.email?.toLowerCase()) {
          return res.status(400).json({ error: 'New email must be different from current email' });
        }

        // Check if email is already in use
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const emailInUse = existingUsers?.users?.some(
          u => u.email?.toLowerCase() === trimmedEmail && u.id !== user.id
        );
        
        if (emailInUse) {
          // Don't reveal that email is in use - just say "unable to change"
          return res.status(400).json({ error: 'Unable to change to this email address' });
        }

        // Determine redirect URL
        const frontendUrl = process.env.FRONTEND_URL || 'https://hamhao.com';

        // Use the direct Supabase Auth API to trigger email change
        // This properly sends confirmation emails
        const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
          },
          body: JSON.stringify({ 
            email: trimmedEmail,
            data: {
              email_change_redirect_to: `${frontendUrl}/auth/callback`
            }
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Email change API error:', errorData);
          
          if (errorData.msg?.includes('rate limit') || errorData.error?.includes('rate limit')) {
            return res.status(429).json({ error: 'Too many email change requests. Please try again later.' });
          }
          
          return res.status(400).json({ error: sanitizeErrorMessage(errorData) });
        }

        console.log(`📧 Email change initiated for user ${user.id}: ${user.email} -> ${trimmedEmail}`);

        return res.json({ 
          success: true, 
          message: 'A confirmation link has been sent to your new email address. Please click it to complete the change. Your current email will remain active until you confirm.'
        });
      }

      case 'change-password': {
        if (!newPassword || typeof newPassword !== 'string') {
          return res.status(400).json({ error: 'New password is required' });
        }

        if (!isValidPassword(newPassword)) {
          return res.status(400).json({ error: 'Password must be between 6 and 128 characters' });
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
          return res.status(400).json({ error: sanitizeErrorMessage(updateError) });
        }

        console.log(`🔑 Password changed for user ${user.id}`);

        return res.json({ 
          success: true, 
          message: 'Password updated successfully' 
        });
      }

      case 'delete-account': {
        console.log(`🗑️ Deleting account for user: ${user.id}`);

        // Delete user data from tables (cascade should handle most)
        const deletePromises = [
          supabaseAdmin.from('user_learned_words').delete().eq('user_id', user.id),
          supabaseAdmin.from('purchased_levels').delete().eq('user_id', user.id),
          supabaseAdmin.from('profiles').delete().eq('id', user.id),
        ];

        await Promise.allSettled(deletePromises);

        // Delete the auth user
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

        if (deleteError) {
          console.error('Delete user error:', deleteError);
          return res.status(500).json({ error: 'Failed to delete account. Please contact support.' });
        }

        console.log(`✅ Account deleted: ${user.id}`);
        return res.json({ 
          success: true, 
          message: 'Account deleted successfully' 
        });
      }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Account action error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
}
