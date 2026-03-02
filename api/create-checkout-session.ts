import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Current versions of legal documents - update these when you change TOS/Privacy
const TOS_VERSION = '2025-01-15';
const PRIVACY_VERSION = '2025-01-15';

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
  const token = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

async function getOrCreateStripeCustomer(userId: string, email: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  // If we have a customer ID stored, verify it exists in the current Stripe environment.
  // This commonly breaks when switching from Stripe test → live: old cus_ IDs won't exist.
  if (profile?.stripe_customer_id) {
    try {
      const existing = await stripe.customers.retrieve(profile.stripe_customer_id);
      if (existing && !('deleted' in existing && existing.deleted)) {
        return profile.stripe_customer_id;
      }
      console.warn('⚠️ Stripe customer marked deleted, recreating:', profile.stripe_customer_id);
    } catch (err: any) {
      const msg = typeof err?.message === 'string' ? err.message : String(err);
      // If Stripe says the customer doesn't exist, recreate it and overwrite the profile value.
      if (msg.includes('No such customer') || err?.code === 'resource_missing') {
        console.warn('⚠️ Stripe customer missing in this environment, recreating:', profile.stripe_customer_id);
      } else {
        console.error('❌ Failed to retrieve Stripe customer, recreating as fallback:', msg);
      }
    }
  }

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
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Forwarded-For, X-Real-IP');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await getUserFromToken(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { 
      product_type, 
      hsk_level,
      tos_accepted,
      privacy_accepted,
      client_timestamp
    } = req.body;
    
    // Require TOS and Privacy acceptance for all purchases
    if (!tos_accepted || !privacy_accepted) {
      return res.status(400).json({ 
        error: 'You must accept the Terms of Service and Privacy Policy to make a purchase' 
      });
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
      console.error('Missing price ID for product:', product_type, hsk_level);
      return res.status(400).json({ 
        error: `Price not configured for ${product_type || 'premium'}${hsk_level ? ` level ${hsk_level}` : ''}` 
      });
    }

    const customerId = await getOrCreateStripeCustomer(user.id, user.email || '');

    // Determine success/cancel URLs
    const frontendUrl = process.env.FRONTEND_URL || 
      (req.headers.origin as string) || 
      (req.headers.referer ? new URL(req.headers.referer as string).origin : 'http://localhost:5173');

    // Get client metadata for fraud prevention and chargeback evidence
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                     (req.headers['x-real-ip'] as string) || 
                     'unknown';
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
      mode: 'payment', // One-time payment, not subscription
      success_url: `${frontendUrl}/?payment=success`,
      cancel_url: `${frontendUrl}/?payment=cancelled`,
      consent_collection: {
        terms_of_service: 'required', // Also require consent in Stripe
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

    // Record the purchase attempt with TOS acceptance in the database
    const now = new Date().toISOString();
    const { error: purchaseError } = await supabase
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
      });

    if (purchaseError) {
      console.error('❌ Error recording purchase:', purchaseError);
      // Don't block the checkout, just log the error
    } else {
      console.log(`📝 Recorded purchase attempt for ${productDescription} with TOS acceptance`);
    }

    console.log(`✅ Created checkout session for ${productDescription}:`, session.id);
    res.json({ url: session.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Checkout error:', message);
    res.status(500).json({ error: message });
  }
}
