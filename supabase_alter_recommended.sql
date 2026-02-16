-- ============================================================
-- RECOMMENDED ALTER SCRIPT for 汉语学习 Supabase schema + RLS
-- ============================================================
-- Purpose:
-- 1) Fix security: remove overly-permissive RLS policies (WITH CHECK (true))
-- 2) Allow end-users to read their own profile + subscriptions
-- 3) Allow ONLY service_role to insert/update profiles/subscriptions
-- 4) Keep your existing triggers & indexes, add a couple of useful constraints
--
-- Safe to run multiple times.
-- ============================================================

-- -----------------------------
-- PROFILES
-- -----------------------------

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop permissive policies (names based on your setup file)
DROP POLICY IF EXISTS "Allow profile inserts" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile updates" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access profiles" ON public.profiles;

-- End-user can SELECT their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- (Optional) End-user update their own email in profiles (not required by your app)
-- If you don't need it, keep it commented out.
-- CREATE POLICY "Users can update own profile"
--   ON public.profiles
--   FOR UPDATE
--   USING (auth.uid() = id)
--   WITH CHECK (auth.uid() = id);

-- Service role can INSERT/UPDATE/DELETE/SELECT everything
-- (Used by your Vercel API via SUPABASE_SERVICE_ROLE_KEY)
CREATE POLICY "Service role full access profiles"
  ON public.profiles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Helpful index (already in your script, included here for completeness)
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer
  ON public.profiles(stripe_customer_id);


-- -----------------------------
-- SUBSCRIPTIONS
-- -----------------------------

ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow subscription inserts" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow subscription updates" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role full access subscriptions" ON public.subscriptions;

-- End-user can SELECT their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role full access subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer
  ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_session
  ON public.subscriptions(stripe_session_id);


-- -----------------------------
-- OPTIONAL CONSTRAINTS (recommended)
-- -----------------------------

-- Ensure there can't be two active subscriptions for the same Stripe customer
-- (Prevents duplicates if webhook is retried)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uniq_active_subscription_per_customer'
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT uniq_active_subscription_per_customer
      UNIQUE (stripe_customer_id, status);
  END IF;
EXCEPTION WHEN others THEN
  -- If you already have duplicates, this could fail. Clean duplicates then re-run.
  RAISE NOTICE 'Could not add uniq_active_subscription_per_customer constraint (maybe duplicates exist).';
END $$;

-- Ensure stripe_customer_id is unique per profile when present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uniq_profiles_stripe_customer_id'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT uniq_profiles_stripe_customer_id
      UNIQUE (stripe_customer_id);
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not add uniq_profiles_stripe_customer_id constraint (maybe duplicates exist).';
END $$;
