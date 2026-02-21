-- ============================================================
-- Supabase Tiered Access Setup
-- ============================================================
-- Run this in the Supabase SQL Editor to set up tiered access
-- for HSK levels with one-time purchases
-- ============================================================

-- 1. Add account_tier column to profiles (if not exists)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_tier TEXT DEFAULT 'free' CHECK (account_tier IN ('free', 'premium'));

-- 2. Create purchased_levels table for individual HSK level purchases
CREATE TABLE IF NOT EXISTS public.purchased_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  hsk_level INTEGER NOT NULL CHECK (hsk_level BETWEEN 1 AND 9),
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  stripe_payment_id TEXT,
  UNIQUE(user_id, hsk_level)
);

-- 3. Enable RLS on purchased_levels
ALTER TABLE public.purchased_levels ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for purchased_levels
DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchased_levels;
CREATE POLICY "Users can view own purchases"
  ON public.purchased_levels FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert purchases" ON public.purchased_levels;
CREATE POLICY "Service role can insert purchases"
  ON public.purchased_levels FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update purchases" ON public.purchased_levels;
CREATE POLICY "Service role can update purchases"
  ON public.purchased_levels FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 5. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_purchased_levels_user ON public.purchased_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_purchased_levels_level ON public.purchased_levels(hsk_level);

-- 6. Function to get user's accessible levels
CREATE OR REPLACE FUNCTION public.get_user_access(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tier TEXT;
  v_purchased INTEGER[];
  v_result JSON;
BEGIN
  -- Get account tier
  SELECT account_tier INTO v_tier
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Default to free if not found
  IF v_tier IS NULL THEN
    v_tier := 'free';
  END IF;
  
  -- Get purchased levels
  SELECT COALESCE(array_agg(hsk_level ORDER BY hsk_level), ARRAY[]::INTEGER[])
  INTO v_purchased
  FROM public.purchased_levels
  WHERE user_id = p_user_id;
  
  -- Build result
  v_result := json_build_object(
    'account_tier', v_tier,
    'purchased_levels', v_purchased,
    'is_premium', v_tier = 'premium'
  );
  
  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_access TO authenticated;

-- 7. Update existing premium users (migrate from is_premium boolean)
UPDATE public.profiles
SET account_tier = 'premium'
WHERE is_premium = true AND (account_tier IS NULL OR account_tier = 'free');

-- 8. Backfill: Give all existing users HSK 1 for free (optional)
-- INSERT INTO public.purchased_levels (user_id, hsk_level)
-- SELECT id, 1 FROM auth.users
-- ON CONFLICT (user_id, hsk_level) DO NOTHING;

SELECT 'Tiered access setup complete!' as status;
