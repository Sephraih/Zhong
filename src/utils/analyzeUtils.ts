import type { VocabWord } from "../data/vocabulary";
import type { Token } from "./segment";
import { extractPinyinForChar } from "./pinyinUtils";

export function buildDictionarySet(words: VocabWord[]): Set<string> {
  const set = new Set<string>();
  for (const w of words) set.add(w.hanzi);
  return set;
}

export function buildLookupMap(words: VocabWord[]): Map<string, VocabWord[]> {
  const map = new Map<string, VocabWord[]>();
  for (const w of words) {
    const existing = map.get(w.hanzi) ?? [];
    existing.push(w);
    map.set(w.hanzi, existing);
  }
  return map;
}

/**
 * Enrich tokens with pinyin from the lookup map.
 * Multi-char tokens use the VocabWord's full pinyin, split per character.
 * Single-char tokens look for a direct match first, then scan longer words
 * that contain the character to extract per-char pinyin.
 */
export function enrichTokens(
  tokens: Token[],
  lookupMap: Map<string, VocabWord[]>
): Token[] {
  return tokens.map((token) => {
    if (!token.isHanzi) return token;

    const matches = lookupMap.get(token.text);
    if (matches && matches.length > 0) {
      const word = matches[0];
      if (token.text.length === 1) {
        return { ...token, pinyin: word.pinyin };
      }
      // Multi-char: build per-char pinyin joined by spaces
      const perChar = token.text
        .split("")
        .map((_, i) => extractPinyinForChar(word.pinyin, i, token.text.length))
        .join(" ");
      return { ...token, pinyin: perChar };
    }

    // Fallback for single chars: search words containing this char
    if (token.text.length === 1) {
      for (const [hanzi, words] of lookupMap) {
        const idx = hanzi.indexOf(token.text);
        if (idx !== -1 && words.length > 0) {
          const pinyin = extractPinyinForChar(words[0].pinyin, idx, hanzi.length);
          if (pinyin) return { ...token, pinyin };
        }
      }
    }

    return token;
  });
}
