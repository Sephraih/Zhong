import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Rate limiting in-memory store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_SIGNUPS = 3; // max signups per minute per IP

function isRateLimited(key: string, maxRequests: number = RATE_LIMIT_MAX_SIGNUPS): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (record.count >= maxRequests) {
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
  return req.headers['x-real-ip'] as string || 'unknown';
}

// Validate email format
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
function isValidPassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password is too long' };
  }
  return { valid: true };
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  
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
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting by IP
  const clientIp = getClientIp(req);
  if (isRateLimited(`signup:${clientIp}`)) {
    return res.status(429).json({ error: 'Too many signup attempts. Please try again later.' });
  }

  try {
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { email, password, accept_tos, accept_privacy, captchaToken } = req.body;
    
    // Input validation
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    
    const passwordCheck = isValidPassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ error: passwordCheck.error });
    }

    // Require TOS and Privacy acceptance
    if (accept_tos !== true || accept_privacy !== true) {
      return res.status(400).json({ error: 'You must accept the Terms of Service and Privacy Policy' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Rate limit per email to prevent enumeration
    if (isRateLimited(`signup:email:${trimmedEmail}`, 2)) {
      return res.status(429).json({ error: 'Please wait before trying again' });
    }

    // Ensure email confirmation redirects back into the app
    const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
    const host = (req.headers['x-forwarded-host'] as string) || req.headers.host;
    const baseUrl = process.env.FRONTEND_URL || (host ? `${proto}://${host}` : 'https://hamhao.com');

    const signupOptions: any = {
      emailRedirectTo: `${baseUrl}/auth/callback`,
    };

    // Forward Turnstile captcha token to Supabase if provided
    if (captchaToken && typeof captchaToken === 'string') {
      signupOptions.captchaToken = captchaToken;
    }

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: signupOptions,
    });

    if (error) {
      console.log(`Signup failed for ${trimmedEmail}: ${error.message}`);
      
      // Don't reveal if email already exists
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        return res.status(400).json({ error: 'Unable to create account with this email' });
      }
      
      if (error.message.includes('captcha')) {
        return res.status(400).json({ error: 'Security verification failed. Please try again.' });
      }
      
      return res.status(400).json({ error: 'Signup failed. Please try again.' });
    }

    // Record consent timestamps in profiles (profile row is created by trigger)
    if (data.user?.id) {
      const now = new Date().toISOString();
      await supabase
        .from('profiles')
        .update({
          tos_accepted_at: now,
          privacy_accepted_at: now,
        })
        .eq('id', data.user.id);
    }

    console.log(`✅ Signup initiated for ${trimmedEmail}`);

    // Return minimal user info
    res.json({ 
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
      } : null, 
      session: data.session ? {
        access_token: data.session.access_token,
      } : null,
      message: data.session ? 'Account created successfully' : 'Please check your email to confirm your account',
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}
