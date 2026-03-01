-- ============================================================
-- SUPABASE SECURE SETUP - HamHao Chinese Learning App
-- ============================================================
-- Run this AFTER the initial SUPABASE_SETUP.sql
-- This script hardens security and adds validation constraints
-- ============================================================

-- ============================================================
-- 1. ADD SIZE CONSTRAINTS TO PREVENT SPAM
-- ============================================================

-- Add check constraint to user_learned_words to limit blob size
-- Max ~10KB should be more than enough for all HSK levels
ALTER TABLE public.user_learned_words
DROP CONSTRAINT IF EXISTS learned_bits_size_limit;

ALTER TABLE public.user_learned_words
ADD CONSTRAINT learned_bits_size_limit
CHECK (
  learned_bits IS NULL OR 
  octet_length(learned_bits::text) <= 10240
);

-- Add check constraint to purchased_levels for valid HSK levels (1-9)
ALTER TABLE public.purchased_levels
DROP CONSTRAINT IF EXISTS valid_hsk_level;

ALTER TABLE public.purchased_levels
ADD CONSTRAINT valid_hsk_level
CHECK (hsk_level >= 1 AND hsk_level <= 9);

-- ============================================================
-- 2. DROP OVERLY PERMISSIVE POLICIES
-- ============================================================

-- profiles: users should only read their own, never insert/update directly
DROP POLICY IF EXISTS "Allow profile inserts" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile updates" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_service" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_service" ON public.profiles;

-- user_learned_words: tighten to own user_id only
DROP POLICY IF EXISTS "Users can manage own learned words" ON public.user_learned_words;
DROP POLICY IF EXISTS "user_learned_words_select_own" ON public.user_learned_words;
DROP POLICY IF EXISTS "user_learned_words_insert_own" ON public.user_learned_words;
DROP POLICY IF EXISTS "user_learned_words_update_own" ON public.user_learned_words;

-- purchased_levels: users can only read their own, inserts via service role only
DROP POLICY IF EXISTS "Users can view own purchased levels" ON public.purchased_levels;
DROP POLICY IF EXISTS "purchased_levels_select_own" ON public.purchased_levels;
DROP POLICY IF EXISTS "purchased_levels_insert_service" ON public.purchased_levels;

-- subscriptions: users can only read their own
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow subscription inserts" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow subscription updates" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;

-- ============================================================
-- 3. CREATE SECURE RLS POLICIES
-- ============================================================

-- profiles: SELECT own only, INSERT/UPDATE via service_role (API endpoints)
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Note: No INSERT/UPDATE policies for authenticated users
-- Profile creation happens via trigger, updates via service_role API

-- user_learned_words: users can SELECT/INSERT/UPDATE only their own row
CREATE POLICY "user_learned_words_select_own"
  ON public.user_learned_words FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_learned_words_insert_own"
  ON public.user_learned_words FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_learned_words_update_own"
  ON public.user_learned_words FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- purchased_levels: SELECT own only, INSERT via service_role (webhook)
CREATE POLICY "purchased_levels_select_own"
  ON public.purchased_levels FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- subscriptions: SELECT own only, INSERT/UPDATE via service_role (webhook)
CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. ENSURE RLS IS ENABLED ON ALL TABLES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learned_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchased_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Public tables remain readable by anyone
ALTER TABLE public.hsk_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.example_sentences ENABLE ROW LEVEL SECURITY;

-- Ensure public read policies exist for vocab
DROP POLICY IF EXISTS "public_read_hsk_words" ON public.hsk_words;
DROP POLICY IF EXISTS "Public read hsk_words" ON public.hsk_words;
CREATE POLICY "public_read_hsk_words"
  ON public.hsk_words FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "public_read_example_sentences" ON public.example_sentences;
DROP POLICY IF EXISTS "Public read examples" ON public.example_sentences;
CREATE POLICY "public_read_example_sentences"
  ON public.example_sentences FOR SELECT
  TO anon, authenticated
  USING (true);

-- Materialized view for vocab (if exists)
-- Note: Materialized views don't support RLS, access is controlled by GRANT
GRANT SELECT ON public.hsk_words_with_examples TO anon, authenticated;

-- ============================================================
-- 5. CREATE VALIDATION FUNCTION FOR learned_bits
-- ============================================================

-- Function to validate learned_bits structure
CREATE OR REPLACE FUNCTION validate_learned_bits()
RETURNS TRIGGER AS $$
BEGIN
  -- Must be a JSON object (not array, not primitive)
  IF NEW.learned_bits IS NOT NULL THEN
    IF jsonb_typeof(NEW.learned_bits) != 'object' THEN
      RAISE EXCEPTION 'learned_bits must be a JSON object';
    END IF;
    
    -- Each key should be a number (HSK level), each value a string (base64)
    DECLARE
      key TEXT;
      val JSONB;
    BEGIN
      FOR key, val IN SELECT * FROM jsonb_each(NEW.learned_bits)
      LOOP
        -- Key should be numeric (HSK level 1-9)
        IF NOT key ~ '^[1-9]$' THEN
          RAISE EXCEPTION 'learned_bits keys must be HSK levels 1-9, got: %', key;
        END IF;
        
        -- Value should be a string (base64 encoded bitset)
        IF jsonb_typeof(val) != 'string' THEN
          RAISE EXCEPTION 'learned_bits values must be strings (base64), got: % for key %', jsonb_typeof(val), key;
        END IF;
        
        -- Value should be reasonable length (max ~2KB per level = plenty for 1000+ words)
        IF length(val #>> '{}') > 2048 THEN
          RAISE EXCEPTION 'learned_bits value too long for key %', key;
        END IF;
      END LOOP;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger
DROP TRIGGER IF EXISTS validate_learned_bits_trigger ON public.user_learned_words;
CREATE TRIGGER validate_learned_bits_trigger
  BEFORE INSERT OR UPDATE ON public.user_learned_words
  FOR EACH ROW EXECUTE FUNCTION validate_learned_bits();

-- ============================================================
-- 6. SUMMARY OF SECURITY MODEL
-- ============================================================
-- 
-- | Table                | anon       | authenticated      | service_role |
-- |----------------------|------------|-------------------|--------------|
-- | hsk_words            | SELECT     | SELECT            | ALL          |
-- | example_sentences    | SELECT     | SELECT            | ALL          |
-- | profiles             | -          | SELECT own        | ALL          |
-- | user_learned_words   | -          | SELECT/INSERT/UPDATE own | ALL    |
-- | purchased_levels     | -          | SELECT own        | ALL          |
-- | subscriptions        | -          | SELECT own        | ALL          |
-- 
-- Writes to profiles, purchased_levels, subscriptions happen ONLY via
-- API endpoints using the service_role key (webhooks, server actions).
-- 
-- Writes to user_learned_words are validated by:
-- 1. RLS policy (must be own user_id)
-- 2. Size constraint (max 10KB)
-- 3. Validation trigger (structure check)
-- ============================================================
