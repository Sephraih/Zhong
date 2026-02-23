-- ============================================================
-- Learned state sync (COMPACT ONLY)
-- Stores learned state as base64 bitsets per HSK level.
--
-- Table: public.user_learned_words
-- Columns:
--   user_id UUID PK -> auth.users(id)
--   learned_bits JSONB NOT NULL DEFAULT '{}'::jsonb
--     format: { "1": "<base64>", "2": "<base64>", ... }
--   created_at / updated_at
--
-- Notes:
-- - Bit positions are derived client-side from the sorted word_id list per HSK level.
-- - This migration drops learned_ids (previous array-based approach).
-- - Safe to run multiple times.
-- ============================================================

-- 1) Create table if missing (compact-only schema)
CREATE TABLE IF NOT EXISTS public.user_learned_words (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  learned_bits JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) If table existed with the old schema, drop learned_ids and ensure learned_bits exists
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

-- 3) Enable RLS
ALTER TABLE public.user_learned_words ENABLE ROW LEVEL SECURITY;

-- 4) Policies: user can read/write only their own row
DROP POLICY IF EXISTS "Users can read own learned state" ON public.user_learned_words;
CREATE POLICY "Users can read own learned state"
  ON public.user_learned_words
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own learned state" ON public.user_learned_words;
CREATE POLICY "Users can insert own learned state"
  ON public.user_learned_words
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own learned state" ON public.user_learned_words;
CREATE POLICY "Users can update own learned state"
  ON public.user_learned_words
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5) updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_learned_words_updated_at ON public.user_learned_words;
CREATE TRIGGER set_user_learned_words_updated_at
  BEFORE UPDATE ON public.user_learned_words
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

SELECT 'user_learned_words compact learned_bits setup complete' as status;
