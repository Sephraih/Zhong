-- ============================================================
-- Supabase Database Setup for Premium Features
-- ============================================================
-- Run this in the Supabase SQL Editor:
-- Dashboard > SQL Editor > New query > Paste & Run
-- ============================================================

-- 1. Create profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create subscriptions table to track payment history
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  stripe_session_id TEXT,
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for profiles
-- Users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow inserts for new users (from trigger or webhook)
DROP POLICY IF EXISTS "Allow profile inserts" ON public.profiles;
CREATE POLICY "Allow profile inserts"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Allow updates from service role (webhook updates)
DROP POLICY IF EXISTS "Allow profile updates" ON public.profiles;
CREATE POLICY "Allow profile updates"
  ON public.profiles FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 5. RLS Policies for subscriptions
-- Users can read their own subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Allow inserts for subscriptions (from webhook)
DROP POLICY IF EXISTS "Allow subscription inserts" ON public.subscriptions;
CREATE POLICY "Allow subscription inserts"
  ON public.subscriptions FOR INSERT
  WITH CHECK (true);

-- Allow updates for subscriptions (from webhook)
DROP POLICY IF EXISTS "Allow subscription updates" ON public.subscriptions;
CREATE POLICY "Allow subscription updates"
  ON public.subscriptions FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 6. Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_premium)
  VALUES (NEW.id, NEW.email, FALSE)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 8. Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_session ON public.subscriptions(stripe_session_id);

-- 9. Backfill: Create profiles for any existing users who signed up before this script
INSERT INTO public.profiles (id, email, is_premium)
SELECT id, email, FALSE
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DONE! Your database is ready.
-- ============================================================
