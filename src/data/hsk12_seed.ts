export type HskSeedWord = {
  hanzi: string;
  pinyin: string;
  english: string;
  hskLevel: 1 | 2;
  category: string;
};

// Seed list for building the in-app dataset.
// Note: This is intentionally concise in this repo template. In your full project,
// replace/extend this list to include the full 450 HSK 1–2 words.
export const HSK12_SEED: HskSeedWord[] = [
  { hanzi: "我", pinyin: "wǒ", english: "I; me", hskLevel: 1, category: "Pronouns" },
  { hanzi: "你", pinyin: "nǐ", english: "you", hskLevel: 1, category: "Pronouns" },
  { hanzi: "他", pinyin: "tā", english: "he; him", hskLevel: 1, category: "Pronouns" },
  { hanzi: "她", pinyin: "tā", english: "she; her", hskLevel: 1, category: "Pronouns" },
  { hanzi: "我们", pinyin: "wǒmen", english: "we; us", hskLevel: 1, category: "Pronouns" },
  { hanzi: "你好", pinyin: "nǐ hǎo", english: "hello", hskLevel: 1, category: "Phrases" },
  { hanzi: "谢谢", pinyin: "xièxie", english: "thank you", hskLevel: 1, category: "Phrases" },
  { hanzi: "不客气", pinyin: "bú kèqi", english: "you're welcome", hskLevel: 1, category: "Phrases" },
  { hanzi: "对不起", pinyin: "duìbuqǐ", english: "sorry", hskLevel: 1, category: "Phrases" },
  { hanzi: "是", pinyin: "shì", english: "to be", hskLevel: 1, category: "Verbs" },
  { hanzi: "有", pinyin: "yǒu", english: "to have; there is", hskLevel: 1, category: "Verbs" },
  { hanzi: "喜欢", pinyin: "xǐhuan", english: "to like", hskLevel: 1, category: "Verbs" },
  { hanzi: "吃", pinyin: "chī", english: "to eat", hskLevel: 1, category: "Verbs" },
  { hanzi: "喝", pinyin: "hē", english: "to drink", hskLevel: 1, category: "Verbs" },
  { hanzi: "看", pinyin: "kàn", english: "to look; to watch; to read", hskLevel: 1, category: "Verbs" },

  { hanzi: "学习", pinyin: "xuéxí", english: "to study; to learn", hskLevel: 2, category: "Verbs" },
  { hanzi: "开始", pinyin: "kāishǐ", english: "to start; to begin", hskLevel: 2, category: "Verbs" },
  { hanzi: "觉得", pinyin: "juéde", english: "to feel; to think", hskLevel: 2, category: "Verbs" },
  { hanzi: "因为", pinyin: "yīnwèi", english: "because", hskLevel: 2, category: "Grammar" },
  { hanzi: "但是", pinyin: "dànshì", english: "but; however", hskLevel: 2, category: "Grammar" },
];
