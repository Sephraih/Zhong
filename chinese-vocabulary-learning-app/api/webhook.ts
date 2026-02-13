import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { buffer } from 'micro';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Disable body parsing, need raw body for Stripe signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

async function setUserPremium(userId: string, isPremium: boolean) {
  await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { is_premium: isPremium },
  });

  await supabase
    .from('profiles')
    .update({ is_premium: isPremium })
    .eq('id', userId);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    return res.status(400).send('Missing signature');
  }

  let event: Stripe.Event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📩 Webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;

        if (!userId) break;

        await setUserPremium(userId, true);

        await supabase.from('subscriptions').insert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: (session.subscription as string) || null,
          stripe_price_id: process.env.STRIPE_PRICE_ID!,
          stripe_session_id: session.id,
          status: 'active',
          current_period_start: new Date().toISOString(),
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await setUserPremium(profile.id, false);
          await supabase
            .from('subscriptions')
            .update({ status: 'cancelled' })
            .eq('stripe_customer_id', customerId)
            .eq('status', 'active');
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          const isActive =
            subscription.status === 'active' || subscription.status === 'trialing';
          await setUserPremium(profile.id, isActive);

          await supabase
            .from('subscriptions')
            .update({
              status: subscription.status,
              cancel_at_period_end: subscription.cancel_at_period_end,
              current_period_start: new Date(
                subscription.current_period_start * 1000
              ).toISOString(),
              current_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
            })
            .eq('stripe_customer_id', customerId)
            .eq('status', 'active');
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await setUserPremium(profile.id, false);
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await setUserPremium(profile.id, true);
          await supabase
            .from('subscriptions')
            .update({ status: 'active' })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
  }

  res.json({ received: true });
}
