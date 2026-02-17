import { HSK12_SEED } from "./hsk12_seed";
import { buildHskPinyinIndex, generateExamplesForWord } from "./exampleGenerator";

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

if (import.meta.env.DEV) {
  const h1 = HSK12_SEED.filter((w) => w.hskLevel === 1).length;
  const h2 = HSK12_SEED.filter((w) => w.hskLevel === 2).length;
  if (h1 !== 150 || h2 !== 300) {
    // eslint-disable-next-line no-console
    console.warn(`HSK seed count mismatch: HSK1=${h1} (expected 150), HSK2=${h2} (expected 300)`);
  }
}

const pinyinIndex = buildHskPinyinIndex(HSK12_SEED);

export const vocabulary: VocabWord[] = HSK12_SEED.map((w, idx) => ({
  id: idx + 1,
  hanzi: w.hanzi,
  pinyin: w.pinyin,
  english: w.english,
  hskLevel: w.hskLevel,
  category: w.category,
  // Generate up to 3 HSK-style example sentences per word.
  examples: generateExamplesForWord(w, pinyinIndex),
}));
