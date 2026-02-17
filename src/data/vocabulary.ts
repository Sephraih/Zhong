// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface VocabWord {
  id: number;
  hanzi: string;
  pinyin: string;
  english: string;
  hskLevel: 1 | 2;
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
