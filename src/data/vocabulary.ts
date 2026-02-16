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

function pw(pairs: [string, string][]): { char: string; pinyin: string }[] {
  return pairs.map(([char, pinyin]) => ({ char, pinyin }));
}

// Generated core dataset for HSK 1–2.
// Note: this is a curated list with examples to keep bundle size reasonable.
// You can expand it further by adding more entries.
export const vocabulary: VocabWord[] = [
  // --- HSK 1: Pronouns / Basics ---
  {
    id: 1,
    hanzi: "我",
    pinyin: "wǒ",
    english: "I; me",
    hskLevel: 1,
    category: "Pronouns",
    examples: [
      { chinese: "我是学生。", pinyinWords: pw([["我","wǒ"],["是","shì"],["学","xué"],["生","sheng"],["。",""]]), english: "I am a student." },
      { chinese: "我很忙。", pinyinWords: pw([["我","wǒ"],["很","hěn"],["忙","máng"],["。",""]]), english: "I am busy." },
    ],
  },
  {
    id: 2,
    hanzi: "你",
    pinyin: "nǐ",
    english: "you",
    hskLevel: 1,
    category: "Pronouns",
    examples: [
      { chinese: "你好吗？", pinyinWords: pw([["你","nǐ"],["好","hǎo"],["吗","ma"],["？",""]]), english: "How are you?" },
      { chinese: "你是老师吗？", pinyinWords: pw([["你","nǐ"],["是","shì"],["老","lǎo"],["师","shī"],["吗","ma"],["？",""]]), english: "Are you a teacher?" },
    ],
  },
  {
    id: 3,
    hanzi: "他",
    pinyin: "tā",
    english: "he; him",
    hskLevel: 1,
    category: "Pronouns",
    examples: [
      { chinese: "他是我的朋友。", pinyinWords: pw([["他","tā"],["是","shì"],["我","wǒ"],["的","de"],["朋","péng"],["友","you"],["。",""]]), english: "He is my friend." },
    ],
  },
  {
    id: 4,
    hanzi: "她",
    pinyin: "tā",
    english: "she; her",
    hskLevel: 1,
    category: "Pronouns",
    examples: [
      { chinese: "她很漂亮。", pinyinWords: pw([["她","tā"],["很","hěn"],["漂","piào"],["亮","liang"],["。",""]]), english: "She is very pretty." },
    ],
  },
  {
    id: 5,
    hanzi: "我们",
    pinyin: "wǒmen",
    english: "we; us",
    hskLevel: 1,
    category: "Pronouns",
    examples: [
      { chinese: "我们是同学。", pinyinWords: pw([["我","wǒ"],["们","men"],["是","shì"],["同","tóng"],["学","xué"],["。",""]]), english: "We are classmates." },
    ],
  },

  // --- HSK 1: Greetings / Polite ---
  {
    id: 6,
    hanzi: "你好",
    pinyin: "nǐ hǎo",
    english: "hello",
    hskLevel: 1,
    category: "Phrases",
    examples: [
      { chinese: "你好！", pinyinWords: pw([["你","nǐ"],["好","hǎo"],["！",""]]), english: "Hello!" },
    ],
  },
  {
    id: 7,
    hanzi: "谢谢",
    pinyin: "xièxie",
    english: "thank you",
    hskLevel: 1,
    category: "Phrases",
    examples: [
      { chinese: "谢谢你。", pinyinWords: pw([["谢","xiè"],["谢","xie"],["你","nǐ"],["。",""]]), english: "Thank you." },
      { chinese: "谢谢！", pinyinWords: pw([["谢","xiè"],["谢","xie"],["！",""]]), english: "Thanks!" },
    ],
  },
  {
    id: 8,
    hanzi: "不客气",
    pinyin: "bú kèqi",
    english: "you're welcome",
    hskLevel: 1,
    category: "Phrases",
    examples: [
      { chinese: "不客气。", pinyinWords: pw([["不","bú"],["客","kè"],["气","qi"],["。",""]]), english: "You're welcome." },
    ],
  },
  {
    id: 9,
    hanzi: "对不起",
    pinyin: "duìbuqǐ",
    english: "sorry",
    hskLevel: 1,
    category: "Phrases",
    examples: [
      { chinese: "对不起，我来晚了。", pinyinWords: pw([["对","duì"],["不","bu"],["起","qǐ"],["，",""] ,["我","wǒ"],["来","lái"],["晚","wǎn"],["了","le"],["。",""]]), english: "Sorry, I'm late." },
    ],
  },

  // --- HSK 1: Core verbs ---
  {
    id: 10,
    hanzi: "是",
    pinyin: "shì",
    english: "to be",
    hskLevel: 1,
    category: "Verbs",
    examples: [
      { chinese: "这是我的书。", pinyinWords: pw([["这","zhè"],["是","shì"],["我","wǒ"],["的","de"],["书","shū"],["。",""]]), english: "This is my book." },
    ],
  },
  {
    id: 11,
    hanzi: "有",
    pinyin: "yǒu",
    english: "to have; there is",
    hskLevel: 1,
    category: "Verbs",
    examples: [
      { chinese: "我有一个朋友。", pinyinWords: pw([["我","wǒ"],["有","yǒu"],["一","yí"],["个","ge"],["朋","péng"],["友","you"],["。",""]]), english: "I have a friend." },
    ],
  },
  {
    id: 12,
    hanzi: "喜欢",
    pinyin: "xǐhuan",
    english: "to like",
    hskLevel: 1,
    category: "Verbs",
    examples: [
      { chinese: "我喜欢茶。", pinyinWords: pw([["我","wǒ"],["喜","xǐ"],["欢","huan"],["茶","chá"],["。",""]]), english: "I like tea." },
    ],
  },
  {
    id: 13,
    hanzi: "吃",
    pinyin: "chī",
    english: "to eat",
    hskLevel: 1,
    category: "Verbs",
    examples: [
      { chinese: "我吃米饭。", pinyinWords: pw([["我","wǒ"],["吃","chī"],["米","mǐ"],["饭","fàn"],["。",""]]), english: "I eat rice." },
    ],
  },
  {
    id: 14,
    hanzi: "喝",
    pinyin: "hē",
    english: "to drink",
    hskLevel: 1,
    category: "Verbs",
    examples: [
      { chinese: "我喝水。", pinyinWords: pw([["我","wǒ"],["喝","hē"],["水","shuǐ"],["。",""]]), english: "I drink water." },
    ],
  },
  {
    id: 15,
    hanzi: "看",
    pinyin: "kàn",
    english: "to look; to watch; to read",
    hskLevel: 1,
    category: "Verbs",
    examples: [
      { chinese: "我看书。", pinyinWords: pw([["我","wǒ"],["看","kàn"],["书","shū"],["。",""]]), english: "I read a book." },
    ],
  },

  // --- HSK 2: Common extensions ---
  {
    id: 101,
    hanzi: "学习",
    pinyin: "xuéxí",
    english: "to study; to learn",
    hskLevel: 2,
    category: "Verbs",
    examples: [
      { chinese: "我在学习汉语。", pinyinWords: pw([["我","wǒ"],["在","zài"],["学","xué"],["习","xí"],["汉","hàn"],["语","yǔ"],["。",""]]), english: "I am studying Chinese." },
      { chinese: "他学习很认真。", pinyinWords: pw([["他","tā"],["学","xué"],["习","xí"],["很","hěn"],["认","rèn"],["真","zhēn"],["。",""]]), english: "He studies very seriously." },
    ],
  },
  {
    id: 102,
    hanzi: "开始",
    pinyin: "kāishǐ",
    english: "to start; to begin",
    hskLevel: 2,
    category: "Verbs",
    examples: [
      { chinese: "我们开始上课吧。", pinyinWords: pw([["我","wǒ"],["们","men"],["开","kāi"],["始","shǐ"],["上","shàng"],["课","kè"],["吧","ba"],["。",""]]), english: "Let's start class." },
    ],
  },
  {
    id: 103,
    hanzi: "觉得",
    pinyin: "juéde",
    english: "to feel; to think",
    hskLevel: 2,
    category: "Verbs",
    examples: [
      { chinese: "我觉得这个很好。", pinyinWords: pw([["我","wǒ"],["觉","jué"],["得","de"],["这","zhè"],["个","ge"],["很","hěn"],["好","hǎo"],["。",""]]), english: "I think this is very good." },
    ],
  },
  {
    id: 104,
    hanzi: "因为",
    pinyin: "yīnwèi",
    english: "because",
    hskLevel: 2,
    category: "Grammar",
    examples: [
      { chinese: "因为下雨，所以我不去。", pinyinWords: pw([["因","yīn"],["为","wèi"],["下","xià"],["雨","yǔ"],["，",""] ,["所","suǒ"],["以","yǐ"],["我","wǒ"],["不","bù"],["去","qù"],["。",""]]), english: "Because it's raining, I won't go." },
    ],
  },
  {
    id: 105,
    hanzi: "但是",
    pinyin: "dànshì",
    english: "but; however",
    hskLevel: 2,
    category: "Grammar",
    examples: [
      { chinese: "我想去，但是我很忙。", pinyinWords: pw([["我","wǒ"],["想","xiǎng"],["去","qù"],["，",""] ,["但","dàn"],["是","shì"],["我","wǒ"],["很","hěn"],["忙","máng"],["。",""]]), english: "I want to go, but I'm busy." },
    ],
  },
];
