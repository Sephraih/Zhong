// ─── Shared Types ────────────────────────────────────────────────────────────

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

// ─── Fallback data ────────────────────────────────────────────────────────────
// Shown only if Supabase is unreachable. Same shape as a real Supabase row.
// Covers a handful of the most common HSK 1 words so the UI is never empty.

function pw(pairs: [string, string][]): { char: string; pinyin: string }[] {
  return pairs.map(([char, pinyin]) => ({ char, pinyin }));
}

export const FALLBACK_VOCABULARY: VocabWord[] = [
  {
    id: 1, hanzi: "你好", pinyin: "nǐ hǎo", english: "hello", hskLevel: 1, category: "Greetings",
    examples: [
      { chinese: "你好！", pinyinWords: pw([["你","nǐ"],["好","hǎo"],["！",""]]), english: "Hello!" },
      { chinese: "你好吗？", pinyinWords: pw([["你","nǐ"],["好","hǎo"],["吗","ma"],["？",""]]), english: "How are you?" },
    ],
  },
  {
    id: 2, hanzi: "谢谢", pinyin: "xiè xiè", english: "thank you", hskLevel: 1, category: "Greetings",
    examples: [
      { chinese: "谢谢你！", pinyinWords: pw([["谢","xiè"],["谢","xiè"],["你","nǐ"],["！",""]]), english: "Thank you!" },
      { chinese: "非常谢谢。", pinyinWords: pw([["非","fēi"],["常","cháng"],["谢","xiè"],["谢","xiè"],["。",""]]), english: "Thank you very much." },
    ],
  },
  {
    id: 3, hanzi: "再见", pinyin: "zài jiàn", english: "goodbye", hskLevel: 1, category: "Greetings",
    examples: [
      { chinese: "再见！", pinyinWords: pw([["再","zài"],["见","jiàn"],["！",""]]), english: "Goodbye!" },
      { chinese: "明天见，再见。", pinyinWords: pw([["明","míng"],["天","tiān"],["见","jiàn"],["，",""],["再","zài"],["见","jiàn"],["。",""]]), english: "See you tomorrow, goodbye." },
    ],
  },
  {
    id: 4, hanzi: "我", pinyin: "wǒ", english: "I, me", hskLevel: 1, category: "Pronouns",
    examples: [
      { chinese: "我是学生。", pinyinWords: pw([["我","wǒ"],["是","shì"],["学","xué"],["生","shēng"],["。",""]]), english: "I am a student." },
      { chinese: "我喜欢中文。", pinyinWords: pw([["我","wǒ"],["喜","xǐ"],["欢","huān"],["中","zhōng"],["文","wén"],["。",""]]), english: "I like Chinese." },
    ],
  },
  {
    id: 5, hanzi: "你", pinyin: "nǐ", english: "you", hskLevel: 1, category: "Pronouns",
    examples: [
      { chinese: "你叫什么名字？", pinyinWords: pw([["你","nǐ"],["叫","jiào"],["什","shén"],["么","me"],["名","míng"],["字","zì"],["？",""]]), english: "What is your name?" },
      { chinese: "你好吗？", pinyinWords: pw([["你","nǐ"],["好","hǎo"],["吗","ma"],["？",""]]), english: "How are you?" },
    ],
  },
  {
    id: 6, hanzi: "是", pinyin: "shì", english: "to be (am/is/are)", hskLevel: 1, category: "Verbs",
    examples: [
      { chinese: "我是中国人。", pinyinWords: pw([["我","wǒ"],["是","shì"],["中","zhōng"],["国","guó"],["人","rén"],["。",""]]), english: "I am Chinese." },
      { chinese: "他是老师。", pinyinWords: pw([["他","tā"],["是","shì"],["老","lǎo"],["师","shī"],["。",""]]), english: "He is a teacher." },
    ],
  },
  {
    id: 7, hanzi: "不", pinyin: "bù", english: "no, not", hskLevel: 1, category: "Adverbs",
    examples: [
      { chinese: "我不是老师。", pinyinWords: pw([["我","wǒ"],["不","bù"],["是","shì"],["老","lǎo"],["师","shī"],["。",""]]), english: "I am not a teacher." },
      { chinese: "今天不冷。", pinyinWords: pw([["今","jīn"],["天","tiān"],["不","bù"],["冷","lěng"],["。",""]]), english: "It's not cold today." },
    ],
  },
  {
    id: 8, hanzi: "好", pinyin: "hǎo", english: "good, well, fine", hskLevel: 1, category: "Adjectives",
    examples: [
      { chinese: "今天天气很好。", pinyinWords: pw([["今","jīn"],["天","tiān"],["天","tiān"],["气","qì"],["很","hěn"],["好","hǎo"],["。",""]]), english: "The weather is very good today." },
      { chinese: "这个主意很好。", pinyinWords: pw([["这","zhè"],["个","gè"],["主","zhǔ"],["意","yì"],["很","hěn"],["好","hǎo"],["。",""]]), english: "This idea is very good." },
    ],
  },
  {
    id: 9, hanzi: "吃", pinyin: "chī", english: "to eat", hskLevel: 1, category: "Verbs",
    examples: [
      { chinese: "我喜欢吃米饭。", pinyinWords: pw([["我","wǒ"],["喜","xǐ"],["欢","huān"],["吃","chī"],["米","mǐ"],["饭","fàn"],["。",""]]), english: "I like eating rice." },
      { chinese: "你吃饭了吗？", pinyinWords: pw([["你","nǐ"],["吃","chī"],["饭","fàn"],["了","le"],["吗","ma"],["？",""]]), english: "Have you eaten?" },
    ],
  },
  {
    id: 10, hanzi: "喝", pinyin: "hē", english: "to drink", hskLevel: 1, category: "Verbs",
    examples: [
      { chinese: "我想喝水。", pinyinWords: pw([["我","wǒ"],["想","xiǎng"],["喝","hē"],["水","shuǐ"],["。",""]]), english: "I want to drink water." },
      { chinese: "她喝茶。", pinyinWords: pw([["她","tā"],["喝","hē"],["茶","chá"],["。",""]]), english: "She drinks tea." },
    ],
  },
];

// ─── Re-export getEnrichedVocabulary for backward compat ─────────────────────
// App.tsx now loads from Supabase; this is only used as a last-resort fallback.
export function getEnrichedVocabulary(): VocabWord[] {
  return FALLBACK_VOCABULARY;
}
