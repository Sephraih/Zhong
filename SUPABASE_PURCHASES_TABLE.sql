-- ============================================================
-- Purchases Table for TOS Acceptance & Chargeback Protection
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create purchases table to log all purchase attempts and completions
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User info
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  
  -- Purchase details
  product_type TEXT NOT NULL CHECK (product_type IN ('premium', 'hsk_level')),
  hsk_level INTEGER CHECK (hsk_level IS NULL OR (hsk_level >= 1 AND hsk_level <= 9)),
  amount_cents INTEGER, -- Filled after Stripe checkout completes
  currency TEXT DEFAULT 'usd',
  
  -- Stripe references
  stripe_customer_id TEXT,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  
  -- TOS acceptance proof (critical for chargebacks)
  tos_accepted BOOLEAN NOT NULL DEFAULT false,
  tos_accepted_at TIMESTAMPTZ,
  tos_version TEXT, -- Version of TOS accepted (e.g., "2025-01-15")
  privacy_accepted BOOLEAN NOT NULL DEFAULT false,
  privacy_accepted_at TIMESTAMPTZ,
  privacy_version TEXT,
  
  -- Client metadata for fraud prevention
  client_ip TEXT,
  user_agent TEXT,
  client_timestamp TIMESTAMPTZ, -- Timestamp from user's browser
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'disputed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_session ON public.purchases(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_payment_intent ON public.purchases(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON public.purchases(created_at);

-- 3. Enable Row Level Security
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Users can view their own purchases
DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;
CREATE POLICY "Users can view own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update (from API endpoints)
DROP POLICY IF EXISTS "Service role can manage purchases" ON public.purchases;
CREATE POLICY "Service role can manage purchases"
  ON public.purchases FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 5. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_purchases_updated_at ON public.purchases;
CREATE TRIGGER set_purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE PROCEDURE public.handle_purchases_updated_at();

-- 6. Create a view for easy chargeback reference
CREATE OR REPLACE VIEW public.purchase_evidence AS
SELECT 
  p.id,
  p.user_id,
  p.user_email,
  p.product_type,
  p.hsk_level,
  p.amount_cents,
  p.currency,
  p.stripe_session_id,
  p.stripe_payment_intent_id,
  p.tos_accepted,
  p.tos_accepted_at,
  p.tos_version,
  p.privacy_accepted,
  p.privacy_accepted_at,
  p.privacy_version,
  p.client_ip,
  p.user_agent,
  p.client_timestamp,
  p.status,
  p.created_at,
  p.completed_at,
  -- Formatted evidence summary for chargebacks
  CASE 
    WHEN p.tos_accepted AND p.privacy_accepted THEN 
      'User ' || p.user_email || ' accepted TOS v' || COALESCE(p.tos_version, 'unknown') || 
      ' at ' || p.tos_accepted_at::TEXT || 
      ' and Privacy Policy v' || COALESCE(p.privacy_version, 'unknown') || 
      ' at ' || p.privacy_accepted_at::TEXT ||
      ' from IP ' || COALESCE(p.client_ip, 'unknown') ||
      '. Payment completed at ' || p.completed_at::TEXT
    ELSE 'TOS/Privacy not fully accepted'
  END AS evidence_summary
FROM public.purchases p;

-- Grant access to the view
GRANT SELECT ON public.purchase_evidence TO authenticated;

-- ============================================================
-- IMPORTANT: What this table stores for chargeback protection:
-- ============================================================
-- 1. User explicitly accepted TOS before purchase (tos_accepted = true)
-- 2. Timestamp of TOS acceptance (tos_accepted_at)
-- 3. Version of TOS accepted (tos_version) - update this when you change TOS
-- 4. Same for Privacy Policy
-- 5. Client IP address (for fraud verification)
-- 6. User agent (browser info)
-- 7. Full Stripe payment references
-- 
-- For chargebacks, you can query:
--   SELECT * FROM purchase_evidence WHERE stripe_payment_intent_id = 'pi_xxx';
-- ============================================================
