-- ============================================================
-- HamHao: Purchases audit table (chargeback-proof)
-- ============================================================
-- Run this in Supabase Dashboard → SQL Editor.
--
-- Purpose:
--  - Store immutable proof of checkout purchase + the URLs/versions
--    of the Terms/Privacy shown at purchase time.
--  - Written by your serverless Stripe webhook (service role).
--  - Readable by the user for their own records.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Stripe identifiers
  stripe_session_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  stripe_price_id TEXT,

  -- What was purchased
  product_type TEXT NOT NULL, -- 'premium' | 'hsk_level' | legacy
  hsk_level INTEGER CHECK (hsk_level BETWEEN 1 AND 9),

  -- Payment info
  amount_total INTEGER,
  currency TEXT,
  payment_status TEXT,

  -- Legal proof
  tos_url TEXT,
  privacy_url TEXT,
  tos_version TEXT,
  privacy_version TEXT,

  -- Raw Stripe objects for future disputes (kept small-ish)
  consent_json JSONB,
  stripe_session_json JSONB,

  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_purchased_at ON public.purchases(purchased_at);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Drop old policies if you rerun
DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Service role can insert purchases" ON public.purchases;

-- Users can read their own purchases
CREATE POLICY "Users can view own purchases"
  ON public.purchases
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service_role can write purchase audit records
CREATE POLICY "Service role can insert purchases"
  ON public.purchases
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Prevent users from editing/deleting audit records
-- (no UPDATE/DELETE policies)

SELECT 'SUPABASE_PURCHASES_AUDIT complete' as status;
