// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface VocabWord {
  id: number;
  hanzi: string;
  pinyin: string;
  english: string;
  hskLevel: 1 | 2 | 3 | 4;
  /** Category/grouping label shown in Browse filters (now sourced from word_type when available). */
  category: string;
  examples: {
    chinese: string;
    pinyinWords: { char: string; pinyin: string }[];
    english: string;
  }[];
}

// ─── Backward-compat re-export ────────────────────────────────────────────────
// App.tsx imports getEnrichedVocabulary from mergeExamples, which re-exports
// from here. Keep this so nothing downstream breaks.
export { buildFallbackVocabulary as getEnrichedVocabulary } from "./supabaseVocab";
