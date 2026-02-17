import type { VocabWord } from "./vocabulary";

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

function isVerbEnglish(english: string) {
  const e = english.toLowerCase().trim();
  return e.startsWith("to ") || e.includes(" to ") || e.includes("(to ");
}

function isPersonWord(hanzi: string) {
  return ["我", "你", "他", "她", "我们", "他们", "她们", "您"].includes(hanzi);
}

function isParticle(hanzi: string) {
  return ["的", "吗", "呢", "了"].includes(hanzi);
}

function templatesForWord(w: SeedWord): Array<{ zh: string; en: string }> {
  const zh = w.hanzi;
  const en = w.english;
  const enLower = en.toLowerCase();

  // ---------- Function words / particles ----------
  if (isPersonWord(zh)) {
    return [
      { zh: "我是学生。", en: "I am a student." },
      { zh: "他是老师。", en: "He is a teacher." },
      { zh: "我们学习汉语。", en: "We study Chinese." },
    ];
  }

  if (isParticle(zh)) {
    if (zh === "吗") {
      return [
        { zh: "你好吗？", en: "How are you?" },
        { zh: "你喜欢茶吗？", en: "Do you like tea?" },
        { zh: "他是老师吗？", en: "Is he a teacher?" },
      ];
    }
    if (zh === "的") {
      return [
        { zh: "这是我的书。", en: "This is my book." },
        { zh: "那是他的电脑。", en: "That is his computer." },
        { zh: "这是你的杯子吗？", en: "Is this your cup?" },
      ];
    }
    if (zh === "了") {
      return [
        { zh: "我吃饭了。", en: "I ate." },
        { zh: "下雨了。", en: "It’s raining." },
        { zh: "我们到了。", en: "We arrived." },
      ];
    }
    if (zh === "呢") {
      return [
        { zh: "你呢？", en: "And you?" },
        { zh: "他在哪儿呢？", en: "Where is he?" },
        { zh: "我很好，你呢？", en: "I’m fine—how about you?" },
      ];
    }
  }

  // ---------- High-signal specific words ----------
  if (zh === "北京") {
    return [
      { zh: "我去北京。", en: "I’m going to Beijing." },
      { zh: "北京很大。", en: "Beijing is big." },
      { zh: "明天去北京。", en: "I’ll go to Beijing tomorrow." },
    ];
  }

  if (zh === "爸爸" || zh === "妈妈") {
    return [
      { zh: `我爱${zh}。`, en: `I love my ${enLower.includes("dad") ? "dad" : "mom"}.` },
      { zh: `${zh}很忙。`, en: `My ${enLower.includes("dad") ? "dad" : "mom"} is busy.` },
      { zh: `我和${zh}去商店。`, en: `I go to the shop with my ${enLower.includes("dad") ? "dad" : "mom"}.` },
    ];
  }

  if (zh === "老师") {
    return [
      { zh: "他是老师。", en: "He is a teacher." },
      { zh: "老师很忙。", en: "The teacher is busy." },
      { zh: "我认识老师。", en: "I know the teacher." },
    ];
  }

  if (zh === "学生") {
    return [
      { zh: "我是学生。", en: "I am a student." },
      { zh: "他是学生。", en: "He is a student." },
      { zh: "学生在学校。", en: "Students are at school." },
    ];
  }

  if (zh === "医生") {
    return [
      { zh: "他是医生。", en: "He is a doctor." },
      { zh: "我去医院找医生。", en: "I go to the hospital to see a doctor." },
      { zh: "医生很忙。", en: "Doctors are busy." },
    ];
  }

  if (zh === "苹果") {
    return [
      { zh: "我吃苹果。", en: "I eat apples." },
      { zh: "这个苹果很好。", en: "This apple is very good." },
      { zh: "我想买苹果。", en: "I want to buy apples." },
    ];
  }

  // Numbers (一二三…): keep simple, use book/people measure words
  if (["一","二","三","四","五","六","七","八","九","十"].includes(zh)) {
    return [
      { zh: `我有${zh}个朋友。`, en: `I have ${enLower} friends.` },
      { zh: `我买${zh}本书。`, en: `I buy ${enLower} books.` },
      { zh: `这儿有${zh}个苹果。`, en: `There are ${enLower} apples here.` },
    ];
  }

  // Time words
  if (["今天","明天","昨天","上午","下午","中午"].includes(zh)) {
    return [
      { zh: `${zh}我很忙。`, en: `${en} I’m very busy.` },
      { zh: `${zh}去学校。`, en: `${en} I go to school.` },
      { zh: `${zh}下雨了。`, en: `${en} it rained.` },
    ];
  }

  // Places
  if (["学校","医院","商店","饭馆","图书馆"].includes(zh)) {
    return [
      { zh: `我去${zh}。`, en: `I go to the ${en}.` },
      { zh: `${zh}在哪儿？`, en: `Where is the ${en}?` },
      { zh: `我们在${zh}。`, en: `We are at the ${en}.` },
    ];
  }

  // Weather-ish adjectives
  if (["冷","热","漂亮","高兴","忙"].includes(zh)) {
    return [
      { zh: `今天天气很${zh}。`, en: `Today’s weather is very ${en}.` },
      { zh: `我很${zh}。`, en: `I am very ${en}.` },
      { zh: `他不${zh}。`, en: `He is not ${en}.` },
    ];
  }

  // ---------- Generic templates ----------
  if (isVerbEnglish(en)) {
    const verb = en.replace(/^to\s+/i, "");
    return [
      { zh: `我想${zh}。`, en: `I want to ${verb}.` },
      { zh: `我会${zh}。`, en: `I can ${verb}.` },
      { zh: `我们一起${zh}。`, en: `We ${verb} together.` },
    ];
  }

  // Noun/adjective fallback (still varied)
  return [
    { zh: `这是${zh}。`, en: `This is ${en}.` },
    { zh: `我有${zh}。`, en: `I have ${en}.` },
    { zh: `我想买${zh}。`, en: `I want to buy ${en}.` },
  ];
}

export function generateExamplesForWord(word: SeedWord, index: ReturnType<typeof buildHskPinyinIndex>): Example[] {
  const templates = templatesForWord(word);

  // Up to 3 examples depending on availability.
  return templates.slice(0, 3).map((t) => ({
    chinese: t.zh,
    pinyinWords: toPinyinWords(t.zh, index),
    english: t.en,
  }));
}
