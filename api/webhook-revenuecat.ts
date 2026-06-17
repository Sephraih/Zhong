import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'crypto';

function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase configuration');
  return createClient(url, key);
}

async function setUserPremium(supabase: SupabaseClient, userId: string) {
  console.log(`🔧 [RC] Upgrading user ${userId} to premium`);

  const { error: authErr } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { account_tier: 'premium' },
  });
  if (authErr) console.error('❌ [RC] Auth metadata update error:', authErr);
  else console.log('✅ [RC] Auth metadata updated to premium');

  const { error: profileErr } = await supabase
    .from('profiles')
    .update({ account_tier: 'premium', is_premium: true } as Record<string, unknown>)
    .eq('id', userId);
  if (profileErr) console.error('❌ [RC] Profile update error:', profileErr);
  else console.log('✅ [RC] Profile updated to premium');
}

async function revokeUserPremium(supabase: SupabaseClient, userId: string) {
  console.log(`🔒 [RC] Revoking premium for user ${userId}`);

  const { error: authErr } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { account_tier: 'free' },
  });
  if (authErr) console.error('❌ [RC] Failed to update auth metadata:', authErr);

  const { error: profileErr } = await supabase
    .from('profiles')
    .update({ account_tier: 'free', is_premium: false } as Record<string, unknown>)
    .eq('id', userId);
  if (profileErr) console.error('❌ [RC] Failed to update profile:', profileErr);
  else console.log('✅ [RC] Premium revoked');
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
  } = event as Record<string, unknown> as { type: string; app_user_id?: string; product_id?: string; transaction_id?: string; transferred_to?: string[] };

  console.log(`📩 [RC] Event: ${type}, user: ${userId}, product: ${productId}`);

  const supabase = getSupabaseClient();

  // Transfers merge an anonymous user's entitlement into a newly identified app_user_id
  // (e.g. Purchases.logIn after an anonymous purchase) and carry no product_id, so they
  // must bypass the product_id gate below.
  if (type === 'TRANSFER') {
    const targetUserId = transferredTo?.[0] ?? userId;
    if (!targetUserId) return res.status(400).json({ error: 'Missing transfer target' });
    try {
      await setUserPremium(supabase, targetUserId);
      return res.status(200).json({ received: true });
    } catch (err) {
      console.error('❌ [RC] Webhook error:', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  if (!userId) return res.status(400).json({ error: 'Missing app_user_id' });

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

        await setUserPremium(supabase, userId);
        break;
      }

      case 'REFUND':
      case 'CANCELLATION': {
        await revokeUserPremium(supabase, userId);
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
