/**
 * Minimal fallback data for when Supabase is not configured.
 * This provides a small preview dataset so the app can function offline.
 */

export interface FallbackWord {
  hanzi: string;
  pinyin: string;
  english: string;
  hsk_level: number;
  examples: {
    chinese: string;
    pinyin: string;
    english: string;
  }[];
}

export const FALLBACK_DATA: FallbackWord[] = [
  {
    hanzi: "你好",
    pinyin: "nǐ hǎo",
    english: "hello",
    hsk_level: 1,
    examples: [
      { chinese: "你好，我是李明。", pinyin: "nǐ hǎo wǒ shì lǐ míng", english: "Hello, I am Li Ming." },
    ],
  },
  {
    hanzi: "谢谢",
    pinyin: "xiè xiè",
    english: "thank you, thanks",
    hsk_level: 1,
    examples: [
      { chinese: "谢谢你的帮助。", pinyin: "xiè xiè nǐ de bāng zhù", english: "Thank you for your help." },
    ],
  },
  {
    hanzi: "再见",
    pinyin: "zài jiàn",
    english: "goodbye",
    hsk_level: 1,
    examples: [
      { chinese: "明天见，再见！", pinyin: "míng tiān jiàn zài jiàn", english: "See you tomorrow, goodbye!" },
    ],
  },
  {
    hanzi: "我",
    pinyin: "wǒ",
    english: "I, me",
    hsk_level: 1,
    examples: [
      { chinese: "我是学生。", pinyin: "wǒ shì xué shēng", english: "I am a student." },
    ],
  },
  {
    hanzi: "你",
    pinyin: "nǐ",
    english: "you",
    hsk_level: 1,
    examples: [
      { chinese: "你叫什么名字？", pinyin: "nǐ jiào shén me míng zì", english: "What is your name?" },
    ],
  },
  {
    hanzi: "他",
    pinyin: "tā",
    english: "he, him",
    hsk_level: 1,
    examples: [
      { chinese: "他是我的朋友。", pinyin: "tā shì wǒ de péng yǒu", english: "He is my friend." },
    ],
  },
  {
    hanzi: "她",
    pinyin: "tā",
    english: "she, her",
    hsk_level: 1,
    examples: [
      { chinese: "她很漂亮。", pinyin: "tā hěn piào liàng", english: "She is very beautiful." },
    ],
  },
  {
    hanzi: "是",
    pinyin: "shì",
    english: "to be, is, am, are",
    hsk_level: 1,
    examples: [
      { chinese: "这是一本书。", pinyin: "zhè shì yī běn shū", english: "This is a book." },
    ],
  },
  {
    hanzi: "不",
    pinyin: "bù",
    english: "no, not",
    hsk_level: 1,
    examples: [
      { chinese: "我不知道。", pinyin: "wǒ bù zhī dào", english: "I don't know." },
    ],
  },
  {
    hanzi: "好",
    pinyin: "hǎo",
    english: "good, well, fine",
    hsk_level: 1,
    examples: [
      { chinese: "这个很好。", pinyin: "zhè gè hěn hǎo", english: "This is very good." },
    ],
  },
  {
    hanzi: "很",
    pinyin: "hěn",
    english: "very, quite",
    hsk_level: 1,
    examples: [
      { chinese: "今天很热。", pinyin: "jīn tiān hěn rè", english: "Today is very hot." },
    ],
  },
  {
    hanzi: "中国",
    pinyin: "zhōng guó",
    english: "China",
    hsk_level: 1,
    examples: [
      { chinese: "我在中国学习。", pinyin: "wǒ zài zhōng guó xué xí", english: "I study in China." },
    ],
  },
  {
    hanzi: "人",
    pinyin: "rén",
    english: "person, people",
    hsk_level: 1,
    examples: [
      { chinese: "他是一个好人。", pinyin: "tā shì yī gè hǎo rén", english: "He is a good person." },
    ],
  },
  {
    hanzi: "学生",
    pinyin: "xué shēng",
    english: "student",
    hsk_level: 1,
    examples: [
      { chinese: "我是大学生。", pinyin: "wǒ shì dà xué shēng", english: "I am a college student." },
    ],
  },
  {
    hanzi: "老师",
    pinyin: "lǎo shī",
    english: "teacher",
    hsk_level: 1,
    examples: [
      { chinese: "老师在教室里。", pinyin: "lǎo shī zài jiào shì lǐ", english: "The teacher is in the classroom." },
    ],
  },
  {
    hanzi: "朋友",
    pinyin: "péng yǒu",
    english: "friend",
    hsk_level: 1,
    examples: [
      { chinese: "他是我的好朋友。", pinyin: "tā shì wǒ de hǎo péng yǒu", english: "He is my good friend." },
    ],
  },
  {
    hanzi: "什么",
    pinyin: "shén me",
    english: "what",
    hsk_level: 1,
    examples: [
      { chinese: "你在做什么？", pinyin: "nǐ zài zuò shén me", english: "What are you doing?" },
    ],
  },
  {
    hanzi: "哪",
    pinyin: "nǎ",
    english: "which, where",
    hsk_level: 1,
    examples: [
      { chinese: "你在哪里？", pinyin: "nǐ zài nǎ lǐ", english: "Where are you?" },
    ],
  },
  {
    hanzi: "这",
    pinyin: "zhè",
    english: "this",
    hsk_level: 1,
    examples: [
      { chinese: "这是什么？", pinyin: "zhè shì shén me", english: "What is this?" },
    ],
  },
  {
    hanzi: "那",
    pinyin: "nà",
    english: "that",
    hsk_level: 1,
    examples: [
      { chinese: "那个人是谁？", pinyin: "nà gè rén shì shéi", english: "Who is that person?" },
    ],
  },
];
