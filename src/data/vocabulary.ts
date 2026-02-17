import { supabase } from "../supabaseClient";

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

type DbHskWord = {
  id: number;
  hanzi: string;
  pinyin: string;
  english: string;
  hsk_level: number;
};

type DbExampleSentence = {
  id: number;
  word_id: number;
  hanzi: string;
  pinyin: string | null;
  english: string;
  source: string | null;
};

type PinyinIndex = {
  wordToSyllables: Map<string, string[]>;
  maxLen: number;
};

const PUNCT_RE = /^[。，！？、；：\s.!?,;:'"()\-]$/;

function splitPinyin(pinyin: string): string[] {
  const result: string[] = [];
  let current = "";

  const trimmed = (pinyin || "").trim();
  if (!trimmed) return [];
  if (trimmed.includes(" ")) return trimmed.split(/\s+/).filter(Boolean);

  // Heuristic splitter for pinyin without spaces (handles tone marks).
  const vowels = "aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ";

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === " ") {
      if (current) result.push(current);
      current = "";
      continue;
    }
    current += ch;

    if (i < trimmed.length - 1) {
      const next = trimmed[i + 1];
      if (next === " ") continue;
      const isCurrentVowel = vowels.includes(ch.toLowerCase());
      const isNextConsonant = !vowels.includes(next.toLowerCase());

      if (isCurrentVowel && isNextConsonant) {
        const remaining = trimmed.slice(i + 1);
        const nextSyllableMatch = remaining.match(/^(b|p|m|f|d|t|n|l|g|k|h|j|q|x|zh|ch|sh|r|z|c|s|y|w)/i);
        if (nextSyllableMatch) {
          if (ch === "n" || (ch === "g" && current.endsWith("ng"))) {
            continue;
          }
          result.push(current);
          current = "";
        }
      }
    }
  }

  if (current) result.push(current);
  return result.length === 0 ? [trimmed] : result;
}

function mapWordPinyinToChars(hanzi: string, pinyin: string): string[] {
  const chars = hanzi.split("");
  const syllables = splitPinyin(pinyin);

  if (chars.length === 1) return [pinyin];
  if (syllables.length === chars.length) return syllables;
  if (syllables.length <= 1) return chars.map(() => pinyin);

  const out: string[] = [];
  for (let i = 0; i < chars.length; i++) {
    out.push(syllables[i] ?? syllables[syllables.length - 1] ?? pinyin);
  }
  return out;
}

function buildPinyinIndex(words: Array<{ hanzi: string; pinyin: string }>): PinyinIndex {
  const wordToSyllables = new Map<string, string[]>();
  let maxLen = 1;

  for (const w of words) {
    wordToSyllables.set(w.hanzi, mapWordPinyinToChars(w.hanzi, w.pinyin));
    maxLen = Math.max(maxLen, w.hanzi.length);
  }

  return { wordToSyllables, maxLen };
}

function toPinyinWords(sentence: string, index: PinyinIndex): { char: string; pinyin: string }[] {
  const { wordToSyllables, maxLen } = index;
  const chars = Array.from(sentence);

  const out: { char: string; pinyin: string }[] = [];
  let i = 0;

  while (i < chars.length) {
    const ch = chars[i];
    if (PUNCT_RE.test(ch)) {
      out.push({ char: ch, pinyin: "" });
      i += 1;
      continue;
    }

    // Greedy match longest known vocab word starting at i.
    let matched: { hanzi: string; syl: string[] } | null = null;
    for (let len = Math.min(maxLen, chars.length - i); len >= 1; len--) {
      const slice = chars.slice(i, i + len).join("");
      const syl = wordToSyllables.get(slice);
      if (syl) {
        matched = { hanzi: slice, syl };
        break;
      }
    }

    if (matched) {
      const wChars = matched.hanzi.split("");
      for (let k = 0; k < wChars.length; k++) {
        out.push({ char: wChars[k], pinyin: matched.syl[k] ?? "" });
      }
      i += wChars.length;
      continue;
    }

    out.push({ char: ch, pinyin: "" });
    i += 1;
  }

  return out;
}

function limitEnglish(english: string, maxParts = 3): string {
  const parts = english
    .split(/[,;/]/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length <= maxParts) return parts.join(", ");
  return parts.slice(0, maxParts).join(", ");
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export async function fetchVocabularyFromSupabase(): Promise<VocabWord[]> {
  const { data: wordsData, error: wordsError } = await supabase
    .from("hsk_words")
    .select("id, hanzi, pinyin, english, hsk_level")
    .in("hsk_level", [1, 2])
    .order("id", { ascending: true });

  if (wordsError) {
    throw new Error(`Failed to load hsk_words: ${wordsError.message}`);
  }

  const words = (wordsData ?? []) as DbHskWord[];
  if (words.length === 0) return [];

  const pinyinIndex = buildPinyinIndex(words);

  // Load example sentences (chunked)
  const wordIds = words.map((w) => w.id);
  const examples: DbExampleSentence[] = [];

  for (const ids of chunk(wordIds, 120)) {
    const { data: exData, error: exError } = await supabase
      .from("example_sentences")
      .select("id, word_id, hanzi, pinyin, english, source")
      .in("word_id", ids)
      .order("id", { ascending: true });

    if (exError) {
      throw new Error(`Failed to load example_sentences: ${exError.message}`);
    }

    if (exData?.length) examples.push(...(exData as DbExampleSentence[]));
  }

  const examplesByWord = new Map<number, DbExampleSentence[]>();
  for (const ex of examples) {
    const arr = examplesByWord.get(ex.word_id) ?? [];
    arr.push(ex);
    examplesByWord.set(ex.word_id, arr);
  }

  return words.map((w) => {
    const exList = (examplesByWord.get(w.id) ?? []).slice(0, 3);

    return {
      id: w.id,
      hanzi: w.hanzi,
      pinyin: w.pinyin,
      english: limitEnglish(w.english, 3),
      hskLevel: (w.hsk_level === 1 ? 1 : 2) as 1 | 2,
      category: `HSK ${w.hsk_level}`,
      examples: exList.map((ex) => ({
        chinese: ex.hanzi,
        pinyinWords: toPinyinWords(ex.hanzi, pinyinIndex),
        english: ex.english,
      })),
    } satisfies VocabWord;
  });
}
