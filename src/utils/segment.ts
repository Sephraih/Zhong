export interface Token {
  text: string;
  pinyin: string;
  isHanzi: boolean;
}

const MAX_WORD_LEN = 6;
const HANZI_RE = /[一-鿿㐀-䶿豈-﫿]/;

/**
 * Segment a Chinese text string into word-level tokens using Maximum Forward
 * Matching against a pre-loaded dictionary Set.
 *
 * Non-Chinese characters (punctuation, latin, numbers, whitespace) are emitted
 * as individual tokens with isHanzi=false.
 */
export function segmentText(text: string, dictionary: Set<string>): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (!HANZI_RE.test(char)) {
      tokens.push({ text: char, pinyin: '', isHanzi: false });
      i++;
      continue;
    }

    let matched = false;
    for (let len = Math.min(MAX_WORD_LEN, text.length - i); len >= 1; len--) {
      const candidate = text.slice(i, i + len);
      if (dictionary.has(candidate)) {
        tokens.push({ text: candidate, pinyin: '', isHanzi: true });
        i += len;
        matched = true;
        break;
      }
    }

    if (!matched) {
      tokens.push({ text: char, pinyin: '', isHanzi: true });
      i++;
    }
  }

  return tokens;
}
