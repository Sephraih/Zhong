-- ============================================================
-- Learned state sync (compact bitsets)
-- Extends user_learned_words with learned_bits JSONB
-- learned_bits format: { "1": "<base64>", "2": "<base64>", ... }
-- Bit positions are derived client-side from the sorted word_id list per level.
-- ============================================================

ALTER TABLE public.user_learned_words
  ADD COLUMN IF NOT EXISTS learned_bits JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Optional: index for JSONB (not necessary unless you query by bits server-side)
-- CREATE INDEX IF NOT EXISTS idx_user_learned_words_bits_gin
--   ON public.user_learned_words
--   USING GIN (learned_bits);

SELECT 'user_learned_words learned_bits column added' as status;
