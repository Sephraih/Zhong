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

import { HSK12_SEED } from "./hsk12_seed";

function pw(pairs: [string, string][]): { char: string; pinyin: string }[] {
  return pairs.map(([char, pinyin]) => ({ char, pinyin }));
}

function tokenizeChars(text: string) {
  return text.split("").map((c) => [c, ""] as [string, string]);
}

function autoExamples(w: { hanzi: string; pinyin: string; english: string }) {
  // Minimal auto-generated examples to ensure every word has at least 1 example.
  const ex1 = {
    chinese: `${w.hanzi}。`,
    pinyinWords: pw(tokenizeChars(`${w.hanzi}。`)),
    english: w.english,
  };

  const ex2 = {
    chinese: `我喜欢${w.hanzi}。`,
    pinyinWords: pw(tokenizeChars(`我喜欢${w.hanzi}。`)),
    english: `I like ${w.english}.`,
  };

  return [ex1, ex2];
}

// NOTE:
// This repo includes a seed list as a placeholder. To include the full 450 HSK 1–2 words,
// extend HSK12_SEED in src/data/hsk12_seed.ts.
export const vocabulary: VocabWord[] = HSK12_SEED.map((w, idx) => ({
  id: idx + 1,
  hanzi: w.hanzi,
  pinyin: w.pinyin,
  english: w.english,
  hskLevel: w.hskLevel,
  category: w.category,
  examples: autoExamples(w),
}));
