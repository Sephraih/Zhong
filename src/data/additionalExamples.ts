export interface Example {
  chinese: string;
  pinyinWords: { char: string; pinyin: string }[];
  english: string;
}

// Optional enrichment layer.
// Kept empty by default to avoid mismatched IDs when the base vocabulary list changes.
export const additionalExamples: Record<number, Example[]> = {};
