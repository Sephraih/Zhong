import type { VocabWord } from "./vocabulary";
import { HSK_SENTENCE_CATALOGUE } from "./hskSentenceCatalogue";

export type Example = VocabWord["examples"][number];

type PinyinWord = { char: string; pinyin: string };

type SeedWord = {
  hanzi: string;
  pinyin: string;
  english: string;
};

const PUNCT_RE = /^[。，！？、；：\s.!?,;:'"()\-]$/;

function splitPinyin(pinyin: string): string[] {
  const trimmed = (pinyin || "").trim();
  if (!trimmed) return [];
  if (trimmed.includes(" ")) {
    return trimmed.split(/\s+/).filter(Boolean);
  }

  // Best-effort heuristic split.
  const result: string[] = [];
  let current = "";
  const vowels = "aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜAEIOUÜ";

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    current += ch;

    const next = trimmed[i + 1];
    if (!next) continue;

    const isVowel = vowels.includes(ch);
    const nextIsVowel = vowels.includes(next);

    if (isVowel && !nextIsVowel) {
      const remaining = trimmed.slice(i + 1);
      const nextSyllableMatch = remaining.match(
        /^(b|p|m|f|d|t|n|l|g|k|h|j|q|x|zh|ch|sh|r|z|c|s|y|w)/i
      );
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
  if (syllables.length === chars.length) return syllables;
  if (syllables.length <= 1) return chars.map(() => pinyin);

  const out: string[] = [];
  for (let i = 0; i < chars.length; i++) {
    out.push(syllables[i] ?? syllables[syllables.length - 1] ?? pinyin);
  }
  return out;
}

export function buildHskPinyinIndex(seed: SeedWord[]) {
  const wordToSyllables = new Map<string, string[]>();
  let maxLen = 1;

  for (const w of seed) {
    const syl = mapWordPinyinToChars(w.hanzi, w.pinyin);
    wordToSyllables.set(w.hanzi, syl);
    maxLen = Math.max(maxLen, w.hanzi.length);
  }

  return { wordToSyllables, maxLen };
}

function toPinyinWords(sentence: string, index: ReturnType<typeof buildHskPinyinIndex>): PinyinWord[] {
  const { wordToSyllables, maxLen } = index;
  const chars = Array.from(sentence);

  const out: PinyinWord[] = [];

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

    // Unknown char fallback
    out.push({ char: ch, pinyin: "" });
    i += 1;
  }

  return out;
}

function findCatalogueSentencesForWord(hanzi: string) {
  // Prefer catalogue sentences only; no runtime templates.
  // We dedupe by chinese text and then sort by length (shorter tends to be more HSK-friendly).
  const matches = HSK_SENTENCE_CATALOGUE.filter((s) => s.chinese.includes(hanzi));
  const uniq = new Map<string, (typeof matches)[number]>();
  for (const m of matches) {
    if (!uniq.has(m.chinese)) uniq.set(m.chinese, m);
  }
  return Array.from(uniq.values()).sort((a, b) => a.chinese.length - b.chinese.length);
}

export function generateExamplesForWord(
  word: SeedWord,
  index: ReturnType<typeof buildHskPinyinIndex>
): Example[] {
  const selected = findCatalogueSentencesForWord(word.hanzi).slice(0, 3);

  return selected.map((s) => ({
    chinese: s.chinese,
    pinyinWords: toPinyinWords(s.chinese, index),
    english: s.english,
  }));
}
