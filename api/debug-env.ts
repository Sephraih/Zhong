import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow in non-production for safety
  if (process.env.VERCEL_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  
  const debug = {
    // Vercel environment info
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF,
    VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7),
    VERCEL_URL: process.env.VERCEL_URL,
    NODE_ENV: process.env.NODE_ENV,
    
    // Stripe key analysis (safe - no secrets exposed)
    STRIPE_KEY_EXISTS: !!stripeKey,
    STRIPE_KEY_LENGTH: stripeKey?.length || 0,
    STRIPE_KEY_PREFIX: stripeKey?.substring(0, 8) || 'MISSING',
    STRIPE_KEY_IS_TEST: stripeKey?.startsWith('sk_test_') || false,
    STRIPE_KEY_IS_LIVE: stripeKey?.startsWith('sk_live_') || false,
    
    // Price IDs (safe to show prefixes)
    PRICE_PREMIUM_PREFIX: process.env.STRIPE_PRICE_PREMIUM?.substring(0, 12) || 'MISSING',
    PRICE_HSK2_PREFIX: process.env.STRIPE_PRICE_HSK2?.substring(0, 12) || 'MISSING',
    
    // All env var names containing STRIPE (names only, not values!)
    ALL_STRIPE_VARS: Object.keys(process.env).filter(k => k.includes('STRIPE')),
    
    // Supabase check
    SUPABASE_URL_EXISTS: !!process.env.SUPABASE_URL,
    SUPABASE_KEY_EXISTS: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  console.log('🔍 DEBUG ENV:', JSON.stringify(debug, null, 2));
  
  return res.json(debug);
}
