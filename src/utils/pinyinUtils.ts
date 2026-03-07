
// ─── Pinyin Helper Utilities ──────────────────────────────────────────────────

/**
 * Split pinyin into syllables.
 *
 * Strategy:
 * 1. If the string contains spaces, split on spaces (e.g. "nǐ hǎo").
 * 2. If no spaces, use a heuristic algorithm to split by syllables (fallback).
 */
export function splitPinyin(pinyin: string): string[] {
  if (!pinyin) return [];

  // STRATEGY 1: Trust explicit spacing (preferred)
  if (pinyin.includes(" ")) {
    return pinyin.split(" ").filter((s) => s.length > 0);
  }

  // STRATEGY 2: Algorithmic split (fallback for legacy data without spaces)
  // This handles standard pinyin rules roughly (Vowel -> Consonant transition)
  const result: string[] = [];
  let current = "";
  const vowels = "aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜAEIOUÜĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛ";

  for (let i = 0; i < pinyin.length; i++) {
    const ch = pinyin[i];
    
    // Punctuation check - force split
    if (/^[。，！？、；：""''（）《》…—.!?,;:'"()\-]$/.test(ch)) {
        if (current) result.push(current);
        result.push(ch);
        current = "";
        continue;
    }

    current += ch;

    // Look ahead to see if we should split here
    if (i < pinyin.length - 1) {
      const next = pinyin[i + 1];
      const isCurrentVowel = vowels.includes(ch);
      const isNextConsonant = !vowels.includes(next);

      // Simple syllable boundary detection: Vowel -> Consonant (usually)
      if (isCurrentVowel && isNextConsonant) {
        // Special case: 'n' or 'ng' often end a syllable
        // 'g' is handled by being a consonant, but we need to check if 'ng' is the end
        // This simple heuristic is imperfect for complex cases like 'xian', 'guang'
        // but 'split(" ")' is the primary method now.
        
        const remaining = pinyin.slice(i + 1);
        // Check if next char starts a known initial consonant cluster
        const nextSyllableMatch = remaining.match(/^[bpmfdtnlgkhjqxzhchshrzcsyw]/i);
        
        if (nextSyllableMatch) {
          // Exception: don't split if current is 'n' or 'g' (part of 'an', 'en', 'in', 'un', 'ang', 'eng', 'ing', 'ong')
          // unless the next letter clearly starts a new syllable (like 'g' in 'fangan' -> fan gan)
          // This logic is complex, so we rely on spacing. 
          // For now, minimal logic: if we see V->C, check common constraints.
          
          if (ch === 'n' && !['g'].includes(next)) {
             // likely end of 'an', 'en', 'in', 'un'
             // split!
             result.push(current);
             current = "";
          } else if (ch !== 'n' && ch !== 'g' && ch !== 'r') { 
             // ending with a vowel (ma, ba, etc) -> next is consonant -> split
             result.push(current);
             current = "";
          }
        }
      }
    }
  }
  if (current) result.push(current);
  return result;
}

/**
 * Get the pinyin syllable for a specific character index.
 * Handles mapping "nǐ hǎo" -> [0]: "nǐ", [1]: "hǎo"
 */
export function extractPinyinForChar(fullPinyin: string, charIndex: number, totalChars: number): string {
  // Edge case: single char, just return the whole thing
  if (totalChars === 1) return fullPinyin;

  const syllables = splitPinyin(fullPinyin);

  // Safety check: if index is out of bounds, return full pinyin to avoid empty string
  // (This happens if pinyin is "omg" but hanzi is 3 chars, etc)
  if (charIndex >= syllables.length) {
    // Fallback: if we are at the last char, giving the rest of the string might be better?
    // For now, safety -> return full string so user sees something.
    // Or return empty string? returning full pinyin makes it obvious something is wrong but readable.
    return fullPinyin;
  }

  return syllables[charIndex];
}
