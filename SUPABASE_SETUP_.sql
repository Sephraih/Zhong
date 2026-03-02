-- ============================================================
-- SUPABASE DATABASE SETUP — 汉语学习 (Chinese Learning App)
-- ============================================================
-- Run this in Supabase Dashboard → SQL Editor.
--
-- Includes:
--  1) profiles (auth-linked)
--  2) purchases (tiered access): purchased_levels + profiles.account_tier
--  3) learned state sync (COMPACT): user_learned_words.learned_bits (base64 bitsets)
--
-- Notes
--  - Safe to run multiple times.
--  - Uses RLS. Browser reads/writes learned state using the user JWT.
--  - Service role (your Vercel API) can insert purchases / update profiles.
-- ============================================================

-- Required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1) PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  -- legacy column (kept because existing webhook updates it)
  is_premium BOOLEAN DEFAULT FALSE,
  -- new tier column
  account_tier TEXT DEFAULT 'free' CHECK (account_tier IN ('free', 'premium')),
  stripe_customer_id TEXT,
  tos_accepted_at TIMESTAMPTZ,
  privacy_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- If profiles existed before, ensure the tier column exists
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_tier TEXT DEFAULT 'free' CHECK (account_tier IN ('free', 'premium'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMPTZ;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop older policy names to avoid duplicates
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;

-- End users can read their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- (Optional) allow end users to update their own profile row
-- If you don't want this, comment it out.
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role can manage profiles (Stripe webhook / admin actions)
CREATE POLICY "Service role can manage all profiles"
  ON public.profiles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');


-- ============================================================
-- 2) SUBSCRIPTIONS (legacy)
-- ============================================================
-- Kept for compatibility with older endpoints; one-time payments no longer need it.

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  stripe_session_id TEXT,
  status TEXT DEFAULT 'inactive',
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.subscriptions;

CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');


-- ============================================================
-- 3) PURCHASES (tiered access)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.purchased_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hsk_level INTEGER NOT NULL CHECK (hsk_level BETWEEN 1 AND 9),
  purchased_at TIMESTAMPTZ DEFAULT now(),
  stripe_payment_id TEXT,
  UNIQUE(user_id, hsk_level)
);

ALTER TABLE public.purchased_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchased_levels;
DROP POLICY IF EXISTS "Service role can insert purchases" ON public.purchased_levels;
DROP POLICY IF EXISTS "Service role can update purchases" ON public.purchased_levels;

CREATE POLICY "Users can view own purchases"
  ON public.purchased_levels
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role writes purchases (Stripe webhook)
CREATE POLICY "Service role can insert purchases"
  ON public.purchased_levels
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update purchases"
  ON public.purchased_levels
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');


-- ============================================================
-- 4) LEARNED STATE (COMPACT ONLY)
-- ============================================================
-- Stores base64-encoded bitsets per HSK level.
-- learned_bits JSONB format: { "1": "<base64>", "2": "<base64>", ... }

CREATE TABLE IF NOT EXISTS public.user_learned_words (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  learned_bits JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- If table existed with an older schema, drop learned_ids and ensure learned_bits exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='user_learned_words'
      AND column_name='learned_ids'
  ) THEN
    ALTER TABLE public.user_learned_words DROP COLUMN learned_ids;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='user_learned_words'
      AND column_name='learned_bits'
  ) THEN
    ALTER TABLE public.user_learned_words
      ADD COLUMN learned_bits JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
END $$;

ALTER TABLE public.user_learned_words ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own learned state" ON public.user_learned_words;
DROP POLICY IF EXISTS "Users can insert own learned state" ON public.user_learned_words;
DROP POLICY IF EXISTS "Users can update own learned state" ON public.user_learned_words;

CREATE POLICY "Users can read own learned state"
  ON public.user_learned_words
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learned state"
  ON public.user_learned_words
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learned state"
  ON public.user_learned_words
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 5) TRIGGERS & HELPERS
-- ============================================================

-- Auto-create profile row on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_premium, account_tier)
  VALUES (NEW.id, NEW.email, FALSE, 'free')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Drop older trigger name from previous migrations (if present)
DROP TRIGGER IF EXISTS set_user_learned_words_updated_at ON public.user_learned_words;

DROP TRIGGER IF EXISTS update_user_learned_words_updated_at ON public.user_learned_words;
CREATE TRIGGER update_user_learned_words_updated_at
  BEFORE UPDATE ON public.user_learned_words
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- 6) INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON public.profiles(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON public.subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id
  ON public.subscriptions(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON public.subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_purchased_levels_user
  ON public.purchased_levels(user_id);

CREATE INDEX IF NOT EXISTS idx_purchased_levels_level
  ON public.purchased_levels(hsk_level);


-- ============================================================
-- 7) OPTIONAL: MIGRATE legacy premium flag -> account_tier
-- ============================================================

UPDATE public.profiles
SET account_tier = 'premium'
WHERE is_premium = true AND (account_tier IS NULL OR account_tier = 'free');

SELECT 'SUPABASE_SETUP complete' as status;

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================
-- Stores user profile information and premium status

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow service role to manage all profiles (for webhooks)
CREATE POLICY "Service role can manage all profiles"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- 2. SUBSCRIPTIONS TABLE
-- =====================================================
-- Stores Stripe subscription information

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  stripe_session_id TEXT,
  status TEXT DEFAULT 'inactive',
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Allow service role to manage all subscriptions (for webhooks)
CREATE POLICY "Service role can manage all subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- 3. AUTO-CREATE PROFILE ON USER SIGNUP
-- =====================================================
-- Trigger function to create profile when user signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_premium)
  VALUES (NEW.id, NEW.email, FALSE)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 4. UPDATE TIMESTAMP TRIGGER
-- =====================================================
-- Automatically update updated_at column

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Apply to subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
  ON public.profiles(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id 
  ON public.subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id 
  ON public.subscriptions(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
  ON public.subscriptions(status);

-- =====================================================
-- VERIFICATION QUERIES (Optional - run to check setup)
-- =====================================================

-- Check tables exist:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check policies:
-- SELECT * FROM pg_policies WHERE schemaname = 'public';
