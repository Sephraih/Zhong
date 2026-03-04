import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_CHECKOUTS = 5; // max checkout attempts per minute

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (record.count >= RATE_LIMIT_MAX_CHECKOUTS) {
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

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Current versions of legal documents
const TOS_VERSION = '2025-01-15';
const PRIVACY_VERSION = '2025-01-15';

// Valid product types
const VALID_PRODUCT_TYPES = ['premium', 'hsk_level'];
const VALID_HSK_LEVELS = [2, 3, 4, 5, 6];

// Price IDs for each product
const PRICE_IDS: Record<string, string | undefined> = {
  hsk_2: process.env.STRIPE_PRICE_HSK2,
  hsk_3: process.env.STRIPE_PRICE_HSK3,
  hsk_4: process.env.STRIPE_PRICE_HSK4,
  hsk_5: process.env.STRIPE_PRICE_HSK5,
  hsk_6: process.env.STRIPE_PRICE_HSK6,
  premium: process.env.STRIPE_PRICE_PREMIUM,
};

async function getUserFromToken(authHeader: string | undefined) {
  if (!authHeader) return null;
  if (!authHeader.startsWith('Bearer ')) return null;
  
  const token = authHeader.slice(7);
  if (!token || token.split('.').length !== 3) return null;
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

async function getOrCreateStripeCustomer(userId: string, email: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  // Verify existing customer exists in Stripe
  if (profile?.stripe_customer_id) {
    try {
      const existing = await stripe.customers.retrieve(profile.stripe_customer_id);
      if (existing && !('deleted' in existing && existing.deleted)) {
        return profile.stripe_customer_id;
      }
    } catch (err: any) {
      console.warn('Stripe customer not found, recreating:', profile.stripe_customer_id);
    }
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  });

  await supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  return customer.id;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  
  // CORS headers
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

  // Validate environment
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY not configured');
    return res.status(500).json({ error: 'Payment system not configured' });
  }

  try {
    // Rate limiting
    const clientIp = getClientIp(req);
    if (isRateLimited(`checkout:${clientIp}`)) {
      return res.status(429).json({ error: 'Too many checkout attempts. Please try again later.' });
    }

    // Authenticate user
    const user = await getUserFromToken(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: 'Please sign in to make a purchase' });
    }

    // Rate limit per user
    if (isRateLimited(`checkout:user:${user.id}`)) {
      return res.status(429).json({ error: 'Too many checkout attempts. Please wait a moment.' });
    }

    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const { 
      product_type, 
      hsk_level,
      tos_accepted,
      privacy_accepted,
      client_timestamp
    } = req.body;
    
    // Require TOS and Privacy acceptance
    if (tos_accepted !== true || privacy_accepted !== true) {
      return res.status(400).json({ 
        error: 'You must accept the Terms of Service and Privacy Policy' 
      });
    }

    // Validate product_type
    const validProductType = product_type && VALID_PRODUCT_TYPES.includes(product_type);
    if (!validProductType && product_type) {
      return res.status(400).json({ error: 'Invalid product type' });
    }

    // Validate hsk_level for hsk_level product type
    if (product_type === 'hsk_level') {
      const level = parseInt(hsk_level, 10);
      if (!VALID_HSK_LEVELS.includes(level)) {
        return res.status(400).json({ error: 'Invalid HSK level' });
      }
    }

    // Determine which price to use
    let priceId: string | undefined;
    let productDescription: string;
    
    if (product_type === 'premium') {
      priceId = PRICE_IDS.premium;
      productDescription = 'Premium - All HSK Levels';
    } else if (product_type === 'hsk_level' && hsk_level) {
      priceId = PRICE_IDS[`hsk_${hsk_level}`];
      productDescription = `HSK Level ${hsk_level}`;
    } else {
      // Fallback to old STRIPE_PRICE_ID for backwards compatibility
      priceId = process.env.STRIPE_PRICE_ID;
      productDescription = 'Premium';
    }

    if (!priceId) {
      console.error('Missing price ID for:', product_type, hsk_level);
      return res.status(400).json({ 
        error: 'This product is not available for purchase at this time' 
      });
    }

    // Check if user already has this product
    if (product_type === 'premium') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_tier, is_premium')
        .eq('id', user.id)
        .single();
      
      if (profile?.account_tier === 'premium' || profile?.is_premium) {
        return res.status(400).json({ error: 'You already have Premium access' });
      }
    } else if (product_type === 'hsk_level') {
      const { data: existing } = await supabase
        .from('purchased_levels')
        .select('hsk_level')
        .eq('user_id', user.id)
        .eq('hsk_level', parseInt(hsk_level, 10))
        .single();
      
      if (existing) {
        return res.status(400).json({ error: `You already own HSK Level ${hsk_level}` });
      }
    }

    const customerId = await getOrCreateStripeCustomer(user.id, user.email || '');

    // Determine success/cancel URLs
    const frontendUrl = process.env.FRONTEND_URL || 'https://hamhao.com';

    // Get client metadata for fraud prevention
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${frontendUrl}/?payment=success`,
      cancel_url: `${frontendUrl}/?payment=cancelled`,
      consent_collection: {
        terms_of_service: 'required',
      },
      custom_text: {
        terms_of_service_acceptance: {
          message: 'I agree to the [Terms of Service](https://hamhao.com/tos) and [Privacy Policy](https://hamhao.com/privacy)',
        },
      },
      metadata: {
        user_id: user.id,
        product_type: product_type || 'premium',
        hsk_level: hsk_level?.toString() || '',
        tos_version: TOS_VERSION,
        privacy_version: PRIVACY_VERSION,
      },
    });

    // Record the purchase attempt
    const now = new Date().toISOString();
    await supabase
      .from('purchases')
      .insert({
        user_id: user.id,
        user_email: user.email || '',
        product_type: product_type || 'premium',
        hsk_level: product_type === 'hsk_level' ? parseInt(hsk_level) : null,
        stripe_customer_id: customerId,
        stripe_session_id: session.id,
        tos_accepted: true,
        tos_accepted_at: now,
        tos_version: TOS_VERSION,
        privacy_accepted: true,
        privacy_accepted_at: now,
        privacy_version: PRIVACY_VERSION,
        client_ip: clientIp,
        user_agent: userAgent,
        client_timestamp: client_timestamp || now,
        status: 'pending',
      })
      .catch(err => console.error('Error recording purchase:', err));

    console.log(`✅ Checkout session created for ${productDescription}: ${session.id}`);
    res.json({ url: session.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Checkout failed';
    console.error('Checkout error:', message);
    
    // Don't expose internal errors
    if (message.includes('Stripe') || message.includes('API')) {
      return res.status(500).json({ error: 'Payment system temporarily unavailable' });
    }
    
    res.status(500).json({ error: 'Unable to create checkout session' });
  }
}
