import { HSK12_SEED } from "./hsk12_seed";

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

type Example = VocabWord["examples"][number];

type PinyinWord = { char: string; pinyin: string };

function splitPinyin(pinyin: string): string[] {
  // Accept pinyin with spaces or without tone marks; this is a best-effort splitter.
  const trimmed = (pinyin || "").trim();
  if (!trimmed) return [];
  if (trimmed.includes(" ")) {
    return trimmed.split(/\s+/).filter(Boolean);
  }

  // Heuristic splitter (adapted from UI code)
  const result: string[] = [];
  let current = "";
  const vowels = "aeiouüAEIOUÜ";

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    current += ch;

    const next = trimmed[i + 1];
    if (!next) continue;

    const isVowel = vowels.includes(ch);
    const nextIsVowel = vowels.includes(next);

    // Split at vowel->consonant boundary when next looks like a syllable start.
    if (isVowel && !nextIsVowel) {
      const remaining = trimmed.slice(i + 1);
      const nextSyllableMatch = remaining.match(/^(b|p|m|f|d|t|n|l|g|k|h|j|q|x|zh|ch|sh|r|z|c|s|y|w)/i);
      if (nextSyllableMatch) {
        result.push(current);
        current = "";
      }
    }
  }

  if (current) result.push(current);
  return result.length ? result : [trimmed];
}

function mapWordPinyinToChars(hanzi: string, pinyin: string): string[] {
  const chars = hanzi.split("");
  const syllables = splitPinyin(pinyin);

  if (chars.length === 1) return [pinyin];

  // Perfect match
  if (syllables.length === chars.length) return syllables;

  // If pinyin is one chunk (e.g. "xiexie"), fall back to whole pinyin for each char.
  if (syllables.length <= 1) return chars.map(() => pinyin);

  // Otherwise, best effort: pad with last syllable
  const out: string[] = [];
  for (let i = 0; i < chars.length; i++) {
    out.push(syllables[i] ?? syllables[syllables.length - 1] ?? pinyin);
  }
  return out;
}

function wordOnlyExample(w: { hanzi: string; pinyin: string; english: string }): Example {
  const chars = w.hanzi.split("");
  const syl = mapWordPinyinToChars(w.hanzi, w.pinyin);

  const pinyinWords: PinyinWord[] = chars.map((c, i) => ({ char: c, pinyin: syl[i] || "" }));
  pinyinWords.push({ char: "。", pinyin: "" });

  return {
    chinese: `${w.hanzi}。`,
    pinyinWords,
    english: w.english,
  };
}

function likeExample(w: { hanzi: string; pinyin: string; english: string }): Example {
  const chars = w.hanzi.split("");
  const syl = mapWordPinyinToChars(w.hanzi, w.pinyin);

  const prefix: PinyinWord[] = [
    { char: "我", pinyin: "wo" },
    { char: "喜", pinyin: "xi" },
    { char: "欢", pinyin: "huan" },
  ];
  const wordPart: PinyinWord[] = chars.map((c, i) => ({ char: c, pinyin: syl[i] || "" }));

  return {
    chinese: `我喜欢${w.hanzi}。`,
    pinyinWords: [...prefix, ...wordPart, { char: "。", pinyin: "" }],
    english: `I like ${w.english}.`,
  };
}

function autoExamples(w: { hanzi: string; pinyin: string; english: string }): Example[] {
  return [wordOnlyExample(w), likeExample(w)];
}

if (import.meta.env.DEV) {
  const h1 = HSK12_SEED.filter((w) => w.hskLevel === 1).length;
  const h2 = HSK12_SEED.filter((w) => w.hskLevel === 2).length;
  if (h1 !== 150 || h2 !== 300) {
    // eslint-disable-next-line no-console
    console.warn(`HSK seed count mismatch: HSK1=${h1} (expected 150), HSK2=${h2} (expected 300)`);
  }
}

export const vocabulary: VocabWord[] = HSK12_SEED.map((w, idx) => ({
  id: idx + 1,
  hanzi: w.hanzi,
  pinyin: w.pinyin,
  english: w.english,
  hskLevel: w.hskLevel,
  category: w.category,
  examples: autoExamples(w),
}));
