import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'crypto';

function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase configuration');
  return createClient(url, key);
}

// Stripe and RevenueCat each own one independent flag (premium_via_stripe /
// premium_via_revenuecat); account_tier/is_premium are always the OR of both, recomputed here
// on every write. This means a RevenueCat entitlement transferring away (e.g. to a different
// account signing in on the same shared device) or being refunded can never strip premium that
// was separately purchased via Stripe, and vice versa — each webhook only ever touches its own
// flag and trusts the OR to do the right thing with whatever the other source's flag says.
async function setRevenueCatPremiumFlag(supabase: SupabaseClient, userId: string, granted: boolean) {
  console.log(`🔧 [RC] Setting premium_via_revenuecat=${granted} for user ${userId}`);

  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select('premium_via_stripe')
    .eq('id', userId)
    .maybeSingle();
  if (readError) console.error('❌ [RC] Failed to read premium_via_stripe:', readError);

  const otherFlag = Boolean((existing as { premium_via_stripe?: boolean } | null)?.premium_via_stripe);
  const isPremium = granted || otherFlag;

  const { error: authErr } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { account_tier: isPremium ? 'premium' : 'free' },
  });
  if (authErr) console.error('❌ [RC] Auth metadata update error:', authErr);
  else console.log(`✅ [RC] Auth metadata updated to ${isPremium ? 'premium' : 'free'}`);

  const { error: profileErr } = await supabase
    .from('profiles')
    .update({
      premium_via_revenuecat: granted,
      account_tier: isPremium ? 'premium' : 'free',
      is_premium: isPremium,
    } as Record<string, unknown>)
    .eq('id', userId);
  if (profileErr) console.error('❌ [RC] Profile update error:', profileErr);
  else console.log(`✅ [RC] Profile updated — premium_via_revenuecat=${granted}, account_tier=${isPremium ? 'premium' : 'free'}`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verify shared secret using constant-time comparison to prevent timing attacks
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  const authHeader = req.headers.authorization;
  if (!secret || !authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const provided = Buffer.from(authHeader);
  const expected = Buffer.from(`Bearer ${secret}`);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { event } = req.body ?? {};
  if (!event) return res.status(400).json({ error: 'Missing event' });

  const {
    type,
    app_user_id: userId,
    product_id: productId,
    transaction_id: transactionId,
    transferred_to: transferredTo,
    environment,
  } = event as Record<string, unknown> as {
    type: string; app_user_id?: string; product_id?: string; transaction_id?: string;
    transferred_to?: string[]; environment?: string;
  };

  console.log(`📩 [RC] Event: ${type}, user: ${userId}, product: ${productId}, environment: ${environment ?? 'n/a'}`);

  const supabase = getSupabaseClient();

  // Transfers merge an anonymous user's entitlement into a newly identified app_user_id
  // (e.g. Purchases.logIn after an anonymous purchase) and carry no product_id, so they
  // must bypass the product_id gate below.
  //
  // KNOWN GAP: TRANSFER events carry no `environment` field at all (RC docs: they're "user
  // events, not transaction events"), so a sandbox/TestFlight transfer can't be filtered out
  // here the way the other event types below are. Logging the raw payload in case a future
  // occurrence reveals a usable signal — until then, avoid testing IAP while signed into a
  // real account, since Supabase auto-links OAuth sign-ins to an existing account by email.
  if (type === 'TRANSFER') {
    console.log('📦 [RC] TRANSFER payload:', JSON.stringify(event));
    const targetUserId = transferredTo?.[0] ?? userId;
    if (!targetUserId) return res.status(400).json({ error: 'Missing transfer target' });
    try {
      await setRevenueCatPremiumFlag(supabase, targetUserId, true);
      // Safe to revoke the source unconditionally now: if it's a real account with its own
      // Stripe premium, the OR inside setRevenueCatPremiumFlag keeps them premium regardless;
      // if it's an anonymous RC-only id with no profile row, this is just a harmless no-op.
      if (userId && userId !== targetUserId) {
        await setRevenueCatPremiumFlag(supabase, userId, false);
      }
      return res.status(200).json({ received: true });
    } catch (err) {
      console.error('❌ [RC] Webhook error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  if (!userId) return res.status(400).json({ error: 'Missing app_user_id' });

  // Sandbox/TestFlight transactions share the same app_user_id space as production (and, via
  // Supabase's auto-linking-by-email, can even land on a real customer's account) — never let
  // them write to live profile/purchase data. Still ack with 200 so RC doesn't retry.
  if (environment && environment !== 'PRODUCTION') {
    console.log(`🧪 [RC] Ignoring ${type} — non-production environment (${environment})`);
    return res.status(200).json({ received: true });
  }

  const PREMIUM_PRODUCT_IDS = ['premium', 'hamhao_premium'];
  if (!productId || !PREMIUM_PRODUCT_IDS.includes(productId)) {
    console.warn(`⚠️ [RC] Unrecognised product_id: ${productId} — ignoring`);
    return res.status(200).json({ received: true });
  }

  try {
    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'NON_RENEWING_PURCHASE': {
        // Best-effort audit record — skip if a webhook retry already inserted this transaction.
        const sessionId = `revenuecat:${transactionId ?? 'unknown'}`;
        const { data: existing } = await supabase
          .from('purchases')
          .select('id')
          .eq('stripe_session_id', sessionId)
          .maybeSingle();
        if (!existing) {
          await supabase.from('purchases').insert({
            user_id: userId,
            product_type: 'premium',
            hsk_level: null,
            stripe_session_id: sessionId,
            status: 'completed',
            completed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).then(({ error }) => { if (error) console.warn('⚠️ [RC] purchases insert warning:', error.message); });
        }

        await setRevenueCatPremiumFlag(supabase, userId, true);
        break;
      }

      case 'REFUND':
      case 'CANCELLATION': {
        await setRevenueCatPremiumFlag(supabase, userId, false);
        if (transactionId) {
          await supabase
            .from('purchases')
            .update({ status: 'refunded', refunded_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('stripe_session_id', `revenuecat:${transactionId}`);
        }
        break;
      }

      default:
        console.log(`ℹ️ [RC] Unhandled event type: ${type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('❌ [RC] Webhook error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
