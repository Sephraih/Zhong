-- ============================================================
-- Learned state sync (lightweight)
-- One row per user, storing learned word IDs as bigint[]
-- ============================================================

-- Table: user_learned_words
CREATE TABLE IF NOT EXISTS public.user_learned_words (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  learned_ids BIGINT[] NOT NULL DEFAULT '{}'::BIGINT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_learned_words ENABLE ROW LEVEL SECURITY;

-- Policies: user can read/write only their own row
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

-- updated_at trigger
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

-- Helpful index for array lookups (optional)
-- CREATE INDEX IF NOT EXISTS idx_user_learned_words_gin ON public.user_learned_words USING GIN (learned_ids);

SELECT 'user_learned_words setup complete' as status;
