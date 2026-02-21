-- ============================================================
-- Supabase Tiered Access Migration
-- ============================================================
-- Run this in Supabase SQL Editor after the base setup
-- ============================================================

-- 1. Add account_tier to profiles (free or premium)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_tier TEXT DEFAULT 'free' CHECK (account_tier IN ('free', 'premium'));

-- 2. Create purchased_levels table for individual level purchases
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

DROP POLICY IF EXISTS "Allow purchase inserts" ON public.purchased_levels;
CREATE POLICY "Allow purchase inserts"
  ON public.purchased_levels FOR INSERT
  WITH CHECK (true);

-- 5. Create function to get user access levels
CREATE OR REPLACE FUNCTION public.get_user_access(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tier TEXT;
  v_levels INTEGER[];
BEGIN
  -- Get account tier
  SELECT account_tier INTO v_tier
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- If premium, return all levels
  IF v_tier = 'premium' THEN
    RETURN json_build_object(
      'tier', 'premium',
      'purchased_levels', ARRAY[1,2,3,4,5,6,7,8,9]
    );
  END IF;
  
  -- Get purchased levels (always include level 1 for free users)
  SELECT ARRAY_AGG(DISTINCT hsk_level ORDER BY hsk_level) INTO v_levels
  FROM public.purchased_levels
  WHERE user_id = p_user_id;
  
  -- Always include level 1 for logged-in users
  IF v_levels IS NULL THEN
    v_levels := ARRAY[1];
  ELSIF NOT (1 = ANY(v_levels)) THEN
    v_levels := array_prepend(1, v_levels);
  END IF;
  
  RETURN json_build_object(
    'tier', COALESCE(v_tier, 'free'),
    'purchased_levels', v_levels
  );
END;
$$;

-- 6. Grant access to the function
GRANT EXECUTE ON FUNCTION public.get_user_access TO authenticated;

-- 7. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_purchased_levels_user ON public.purchased_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_purchased_levels_level ON public.purchased_levels(hsk_level);

-- 8. Update existing premium users (migrate from is_premium boolean)
UPDATE public.profiles
SET account_tier = 'premium'
WHERE is_premium = true AND account_tier = 'free';
