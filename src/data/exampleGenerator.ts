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

    out.push({ char: ch, pinyin: "" });
    i += 1;
  }

  return out;
}

// ============================================================
// Curated HSK example sentences
// Each entry maps a hanzi → up to 3 example sentences
// ============================================================
const CURATED_EXAMPLES: Record<string, Array<{ zh: string; en: string }>> = {
  // ── HSK 1 ──
  "我": [
    { zh: "我是中国人。", en: "I am Chinese." },
    { zh: "我喜欢学习汉语。", en: "I like studying Chinese." },
  ],
  "你": [
    { zh: "你叫什么名字？", en: "What is your name?" },
    { zh: "你在哪儿工作？", en: "Where do you work?" },
  ],
  "他": [
    { zh: "他是我的朋友。", en: "He is my friend." },
    { zh: "他在学校学习。", en: "He studies at school." },
  ],
  "她": [
    { zh: "她很漂亮。", en: "She is very pretty." },
    { zh: "她是我的老师。", en: "She is my teacher." },
  ],
  "我们": [
    { zh: "我们都是学生。", en: "We are all students." },
    { zh: "我们一起去吧。", en: "Let's go together." },
  ],
  "爱": [
    { zh: "我爱我的家人。", en: "I love my family." },
    { zh: "他们很相爱。", en: "They love each other." },
  ],
  "八": [
    { zh: "我有八本书。", en: "I have eight books." },
    { zh: "他八岁了。", en: "He is eight years old." },
  ],
  "爸爸": [
    { zh: "爸爸在家工作。", en: "Dad works at home." },
    { zh: "我爸爸是医生。", en: "My dad is a doctor." },
  ],
  "北京": [
    { zh: "我住在北京。", en: "I live in Beijing." },
    { zh: "北京的天气很冷。", en: "Beijing's weather is very cold." },
  ],
  "杯子": [
    { zh: "这个杯子是我的。", en: "This cup is mine." },
    { zh: "请给我一个杯子。", en: "Please give me a cup." },
  ],
  "本": [
    { zh: "我买了三本书。", en: "I bought three books." },
    { zh: "这本书很好看。", en: "This book is very good." },
  ],
  "不": [
    { zh: "我不喝咖啡。", en: "I don't drink coffee." },
    { zh: "他不是老师。", en: "He is not a teacher." },
  ],
  "不客气": [
    { zh: "不客气，很高兴帮忙。", en: "You're welcome, glad to help." },
  ],
  "菜": [
    { zh: "这个菜很好吃。", en: "This dish is delicious." },
    { zh: "妈妈做了很多菜。", en: "Mom made many dishes." },
  ],
  "茶": [
    { zh: "你想喝茶吗？", en: "Do you want to drink tea?" },
    { zh: "中国人喜欢喝茶。", en: "Chinese people like to drink tea." },
  ],
  "吃": [
    { zh: "我们去吃饭吧。", en: "Let's go eat." },
    { zh: "你吃早饭了吗？", en: "Have you eaten breakfast?" },
  ],
  "出租车": [
    { zh: "我坐出租车去机场。", en: "I take a taxi to the airport." },
    { zh: "出租车来了。", en: "The taxi is here." },
  ],
  "打电话": [
    { zh: "我给你打电话。", en: "I'll call you." },
    { zh: "他在打电话。", en: "He is making a phone call." },
  ],
  "大": [
    { zh: "这个房间很大。", en: "This room is very big." },
    { zh: "他比我大三岁。", en: "He is three years older than me." },
  ],
  "的": [
    { zh: "这是我的书。", en: "This is my book." },
    { zh: "红色的衣服很漂亮。", en: "The red clothes are pretty." },
  ],
  "点": [
    { zh: "现在几点了？", en: "What time is it now?" },
    { zh: "我们八点上课。", en: "We start class at eight o'clock." },
  ],
  "电脑": [
    { zh: "我用电脑工作。", en: "I use a computer for work." },
    { zh: "这个电脑是新的。", en: "This computer is new." },
  ],
  "电视": [
    { zh: "晚上我看电视。", en: "I watch TV in the evening." },
    { zh: "别看电视了。", en: "Stop watching TV." },
  ],
  "电影": [
    { zh: "这个电影很好看。", en: "This movie is great." },
    { zh: "我们去看电影吧。", en: "Let's go see a movie." },
  ],
  "东西": [
    { zh: "你买了什么东西？", en: "What did you buy?" },
    { zh: "这个东西多少钱？", en: "How much does this thing cost?" },
  ],
  "都": [
    { zh: "我们都喜欢吃水果。", en: "We all like to eat fruit." },
    { zh: "他什么都知道。", en: "He knows everything." },
  ],
  "读": [
    { zh: "我喜欢读书。", en: "I like to read." },
    { zh: "请读一下这个字。", en: "Please read this character." },
  ],
  "对不起": [
    { zh: "对不起，我来晚了。", en: "Sorry, I came late." },
  ],
  "多": [
    { zh: "他的朋友很多。", en: "He has many friends." },
    { zh: "多吃水果对身体好。", en: "Eating more fruit is good for health." },
  ],
  "多少": [
    { zh: "这个多少钱？", en: "How much is this?" },
    { zh: "你们班有多少人？", en: "How many people are in your class?" },
  ],
  "儿子": [
    { zh: "他的儿子很聪明。", en: "His son is very smart." },
    { zh: "我儿子今年五岁。", en: "My son is five years old this year." },
  ],
  "二": [
    { zh: "我有二十块钱。", en: "I have twenty yuan." },
  ],
  "饭馆": [
    { zh: "我们去饭馆吃饭吧。", en: "Let's go eat at a restaurant." },
    { zh: "这家饭馆的菜很好吃。", en: "This restaurant's food is delicious." },
  ],
  "飞机": [
    { zh: "我坐飞机去北京。", en: "I take a plane to Beijing." },
    { zh: "飞机几点起飞？", en: "What time does the plane take off?" },
  ],
  "分钟": [
    { zh: "请等我五分钟。", en: "Please wait for me five minutes." },
    { zh: "走路十分钟就到了。", en: "It's a ten-minute walk." },
  ],
  "高兴": [
    { zh: "认识你很高兴。", en: "Nice to meet you." },
    { zh: "他今天很高兴。", en: "He is very happy today." },
  ],
  "个": [
    { zh: "我要两个苹果。", en: "I want two apples." },
  ],
  "工作": [
    { zh: "你在哪儿工作？", en: "Where do you work?" },
    { zh: "他的工作很忙。", en: "His work is very busy." },
  ],
  "狗": [
    { zh: "我家有一只狗。", en: "My family has a dog." },
    { zh: "这只狗很可爱。", en: "This dog is very cute." },
  ],
  "汉语": [
    { zh: "我在学习汉语。", en: "I am studying Chinese." },
    { zh: "汉语很有意思。", en: "Chinese is very interesting." },
  ],
  "好": [
    { zh: "你好！", en: "Hello!" },
    { zh: "今天天气很好。", en: "The weather is nice today." },
    { zh: "这本书很好。", en: "This book is very good." },
  ],
  "号": [
    { zh: "今天几号？", en: "What date is today?" },
    { zh: "你的电话号码是多少？", en: "What is your phone number?" },
  ],
  "喝": [
    { zh: "你想喝什么？", en: "What do you want to drink?" },
    { zh: "我每天喝水。", en: "I drink water every day." },
  ],
  "和": [
    { zh: "我和他是朋友。", en: "He and I are friends." },
    { zh: "爸爸和妈妈都在家。", en: "Dad and mom are both at home." },
  ],
  "很": [
    { zh: "她很高兴。", en: "She is very happy." },
    { zh: "今天很热。", en: "Today is very hot." },
  ],
  "后面": [
    { zh: "学校在医院后面。", en: "The school is behind the hospital." },
  ],
  "回": [
    { zh: "我要回家了。", en: "I'm going home now." },
    { zh: "他回中国了。", en: "He went back to China." },
  ],
  "会": [
    { zh: "你会说汉语吗？", en: "Can you speak Chinese?" },
    { zh: "我会做饭。", en: "I can cook." },
  ],
  "几": [
    { zh: "你有几个孩子？", en: "How many children do you have?" },
    { zh: "现在几点？", en: "What time is it?" },
  ],
  "家": [
    { zh: "我想回家。", en: "I want to go home." },
    { zh: "你家在哪儿？", en: "Where is your home?" },
  ],
  "叫": [
    { zh: "你叫什么名字？", en: "What is your name?" },
    { zh: "我叫李明。", en: "My name is Li Ming." },
  ],
  "今天": [
    { zh: "今天星期几？", en: "What day is today?" },
    { zh: "今天天气很好。", en: "The weather is nice today." },
  ],
  "九": [
    { zh: "现在九点了。", en: "It's nine o'clock now." },
  ],
  "开": [
    { zh: "请开门。", en: "Please open the door." },
    { zh: "他会开车。", en: "He can drive." },
  ],
  "看": [
    { zh: "我在看书。", en: "I am reading a book." },
    { zh: "我们去看电影吧。", en: "Let's go watch a movie." },
  ],
  "看见": [
    { zh: "我看见他了。", en: "I saw him." },
    { zh: "你看见我的书了吗？", en: "Did you see my book?" },
  ],
  "块": [
    { zh: "这个十块钱。", en: "This is ten yuan." },
  ],
  "来": [
    { zh: "他从北京来。", en: "He comes from Beijing." },
    { zh: "请进来坐。", en: "Please come in and sit." },
  ],
  "老师": [
    { zh: "王老师教我们汉语。", en: "Teacher Wang teaches us Chinese." },
    { zh: "老师，您好！", en: "Hello, teacher!" },
  ],
  "了": [
    { zh: "我吃饭了。", en: "I have eaten." },
    { zh: "下雨了。", en: "It's raining." },
  ],
  "冷": [
    { zh: "今天很冷。", en: "It's cold today." },
    { zh: "北京的冬天很冷。", en: "Beijing's winter is very cold." },
  ],
  "里": [
    { zh: "书在桌子里。", en: "The book is in the desk." },
  ],
  "六": [
    { zh: "我们六点吃饭。", en: "We eat at six o'clock." },
  ],
  "妈妈": [
    { zh: "妈妈在做饭。", en: "Mom is cooking." },
    { zh: "我妈妈是老师。", en: "My mom is a teacher." },
  ],
  "吗": [
    { zh: "你好吗？", en: "How are you?" },
    { zh: "你是学生吗？", en: "Are you a student?" },
  ],
  "买": [
    { zh: "我去商店买东西。", en: "I go to the store to buy things." },
    { zh: "他买了一本书。", en: "He bought a book." },
  ],
  "猫": [
    { zh: "她有一只猫。", en: "She has a cat." },
    { zh: "这只猫很漂亮。", en: "This cat is very pretty." },
  ],
  "没": [
    { zh: "我没有钱。", en: "I don't have money." },
    { zh: "他没来上课。", en: "He didn't come to class." },
  ],
  "没关系": [
    { zh: "没关系，不要担心。", en: "It doesn't matter, don't worry." },
  ],
  "米饭": [
    { zh: "中国人喜欢吃米饭。", en: "Chinese people like to eat rice." },
  ],
  "名字": [
    { zh: "你的名字真好听。", en: "Your name sounds nice." },
    { zh: "请写你的名字。", en: "Please write your name." },
  ],
  "明天": [
    { zh: "明天你有空吗？", en: "Are you free tomorrow?" },
    { zh: "明天见！", en: "See you tomorrow!" },
  ],
  "哪": [
    { zh: "你是哪国人？", en: "What country are you from?" },
  ],
  "哪儿": [
    { zh: "你去哪儿？", en: "Where are you going?" },
    { zh: "你住在哪儿？", en: "Where do you live?" },
  ],
  "那": [
    { zh: "那个人是谁？", en: "Who is that person?" },
    { zh: "那本书是他的。", en: "That book is his." },
  ],
  "呢": [
    { zh: "我很好，你呢？", en: "I'm fine, and you?" },
  ],
  "能": [
    { zh: "你能帮我吗？", en: "Can you help me?" },
    { zh: "我能说一点儿汉语。", en: "I can speak a little Chinese." },
  ],
  "年": [
    { zh: "今年是2024年。", en: "This year is 2024." },
    { zh: "新年快乐！", en: "Happy New Year!" },
  ],
  "女儿": [
    { zh: "我女儿很漂亮。", en: "My daughter is very pretty." },
    { zh: "她的女儿在上学。", en: "Her daughter is in school." },
  ],
  "朋友": [
    { zh: "他是我最好的朋友。", en: "He is my best friend." },
    { zh: "我有很多中国朋友。", en: "I have many Chinese friends." },
  ],
  "漂亮": [
    { zh: "这条裙子很漂亮。", en: "This dress is very pretty." },
    { zh: "她长得很漂亮。", en: "She is very pretty." },
  ],
  "苹果": [
    { zh: "我每天吃一个苹果。", en: "I eat an apple every day." },
    { zh: "这个苹果很甜。", en: "This apple is very sweet." },
  ],
  "七": [
    { zh: "他七点上班。", en: "He goes to work at seven." },
  ],
  "钱": [
    { zh: "你有多少钱？", en: "How much money do you have?" },
    { zh: "这个不贵，不用很多钱。", en: "This isn't expensive, doesn't need much money." },
  ],
  "前面": [
    { zh: "学校在前面。", en: "The school is ahead." },
  ],
  "请": [
    { zh: "请坐。", en: "Please sit down." },
    { zh: "请问，这是什么？", en: "Excuse me, what is this?" },
  ],
  "去": [
    { zh: "我去学校上课。", en: "I go to school for class." },
    { zh: "你想去哪儿？", en: "Where do you want to go?" },
  ],
  "热": [
    { zh: "今天太热了。", en: "It's too hot today." },
    { zh: "夏天很热。", en: "Summer is very hot." },
  ],
  "人": [
    { zh: "这儿有很多人。", en: "There are many people here." },
    { zh: "中国人很友好。", en: "Chinese people are very friendly." },
  ],
  "认识": [
    { zh: "认识你很高兴。", en: "Nice to meet you." },
    { zh: "我不认识他。", en: "I don't know him." },
  ],
  "三": [
    { zh: "我有三个姐姐。", en: "I have three older sisters." },
  ],
  "商店": [
    { zh: "我去商店买东西。", en: "I go to the store to buy things." },
  ],
  "上午": [
    { zh: "上午我在学校。", en: "In the morning, I'm at school." },
  ],
  "少": [
    { zh: "这里人很少。", en: "There are few people here." },
  ],
  "谁": [
    { zh: "他是谁？", en: "Who is he?" },
    { zh: "谁的书在这儿？", en: "Whose book is here?" },
  ],
  "什么": [
    { zh: "你在做什么？", en: "What are you doing?" },
    { zh: "这是什么？", en: "What is this?" },
  ],
  "十": [
    { zh: "我们班有十个人。", en: "There are ten people in our class." },
  ],
  "时候": [
    { zh: "你什么时候来？", en: "When are you coming?" },
    { zh: "小时候我住在北京。", en: "When I was young, I lived in Beijing." },
  ],
  "是": [
    { zh: "我是学生。", en: "I am a student." },
    { zh: "这是中国茶。", en: "This is Chinese tea." },
  ],
  "书": [
    { zh: "这本书很有意思。", en: "This book is very interesting." },
    { zh: "我在图书馆看书。", en: "I read books at the library." },
  ],
  "水": [
    { zh: "请给我一杯水。", en: "Please give me a glass of water." },
  ],
  "水果": [
    { zh: "多吃水果对身体好。", en: "Eating more fruit is good for your health." },
  ],
  "睡觉": [
    { zh: "我十点睡觉。", en: "I go to sleep at ten." },
    { zh: "昨天晚上我没睡好。", en: "I didn't sleep well last night." },
  ],
  "说": [
    { zh: "你说什么？", en: "What did you say?" },
    { zh: "请慢一点儿说。", en: "Please speak a bit slower." },
  ],
  "四": [
    { zh: "一年有四个季节。", en: "A year has four seasons." },
  ],
  "岁": [
    { zh: "你今年多大岁数？", en: "How old are you this year?" },
    { zh: "我今年二十岁。", en: "I am twenty years old this year." },
  ],
  "太": [
    { zh: "今天太冷了。", en: "It's too cold today." },
    { zh: "太好了！", en: "That's great!" },
  ],
  "天气": [
    { zh: "今天天气很好。", en: "The weather is nice today." },
    { zh: "明天天气怎么样？", en: "How will the weather be tomorrow?" },
  ],
  "听": [
    { zh: "我喜欢听音乐。", en: "I like to listen to music." },
    { zh: "请听老师说。", en: "Please listen to the teacher." },
  ],
  "同学": [
    { zh: "他是我的同学。", en: "He is my classmate." },
  ],
  "喂": [
    { zh: "喂，你好！", en: "Hello! (on the phone)" },
  ],
  "五": [
    { zh: "我每天工作五个小时。", en: "I work five hours every day." },
  ],
  "喜欢": [
    { zh: "我喜欢学习汉语。", en: "I like studying Chinese." },
    { zh: "你喜欢什么运动？", en: "What sport do you like?" },
  ],
  "下午": [
    { zh: "下午我去图书馆。", en: "In the afternoon, I go to the library." },
  ],
  "下雨": [
    { zh: "今天下雨了。", en: "It rained today." },
    { zh: "明天可能下雨。", en: "It might rain tomorrow." },
  ],
  "先生": [
    { zh: "王先生，您好！", en: "Mr. Wang, hello!" },
  ],
  "现在": [
    { zh: "你现在在哪儿？", en: "Where are you now?" },
    { zh: "现在几点了？", en: "What time is it now?" },
  ],
  "想": [
    { zh: "我想去中国。", en: "I want to go to China." },
    { zh: "你在想什么？", en: "What are you thinking about?" },
  ],
  "小": [
    { zh: "这个房间太小了。", en: "This room is too small." },
    { zh: "她有一个小狗。", en: "She has a small dog." },
  ],
  "些": [
    { zh: "我买了一些水果。", en: "I bought some fruit." },
  ],
  "写": [
    { zh: "请写你的名字。", en: "Please write your name." },
    { zh: "我在写作业。", en: "I am doing homework." },
  ],
  "谢谢": [
    { zh: "谢谢你的帮助。", en: "Thank you for your help." },
  ],
  "星期": [
    { zh: "今天星期几？", en: "What day of the week is it?" },
    { zh: "一个星期有七天。", en: "A week has seven days." },
  ],
  "学生": [
    { zh: "我是大学生。", en: "I am a university student." },
    { zh: "他是一个好学生。", en: "He is a good student." },
  ],
  "学习": [
    { zh: "我每天学习汉语。", en: "I study Chinese every day." },
    { zh: "学习要努力。", en: "Studying requires effort." },
  ],
  "学校": [
    { zh: "我在学校上课。", en: "I attend class at school." },
    { zh: "学校离我家很近。", en: "The school is close to my home." },
  ],
  "一": [
    { zh: "我有一个问题。", en: "I have a question." },
  ],
  "衣服": [
    { zh: "这件衣服很漂亮。", en: "This piece of clothing is pretty." },
    { zh: "我要买新衣服。", en: "I want to buy new clothes." },
  ],
  "医生": [
    { zh: "他是医生。", en: "He is a doctor." },
    { zh: "我去看医生。", en: "I go to see the doctor." },
  ],
  "医院": [
    { zh: "医院在学校旁边。", en: "The hospital is next to the school." },
  ],
  "椅子": [
    { zh: "请坐这把椅子。", en: "Please sit in this chair." },
  ],
  "有": [
    { zh: "我有两个孩子。", en: "I have two children." },
    { zh: "这儿有一个饭馆。", en: "There is a restaurant here." },
  ],
  "月": [
    { zh: "一月是一年的第一个月。", en: "January is the first month of the year." },
  ],
  "再见": [
    { zh: "再见，明天见！", en: "Goodbye, see you tomorrow!" },
  ],
  "在": [
    { zh: "他在家。", en: "He is at home." },
    { zh: "我在学校学习。", en: "I study at school." },
  ],
  "怎么": [
    { zh: "这个字怎么读？", en: "How do you read this character?" },
    { zh: "你怎么来的？", en: "How did you come?" },
  ],
  "怎么样": [
    { zh: "你觉得怎么样？", en: "What do you think?" },
    { zh: "北京怎么样？", en: "How is Beijing?" },
  ],
  "这": [
    { zh: "这是我的书。", en: "This is my book." },
  ],
  "中国": [
    { zh: "中国很大。", en: "China is very big." },
    { zh: "我想去中国旅游。", en: "I want to travel to China." },
  ],
  "中午": [
    { zh: "中午我们吃饭。", en: "We eat at noon." },
  ],
  "住": [
    { zh: "你住在哪儿？", en: "Where do you live?" },
    { zh: "我住在北京。", en: "I live in Beijing." },
  ],
  "桌子": [
    { zh: "书在桌子上。", en: "The book is on the table." },
  ],
  "字": [
    { zh: "这个字怎么写？", en: "How do you write this character?" },
    { zh: "你写的字很好看。", en: "The characters you write look nice." },
  ],
  "昨天": [
    { zh: "昨天下雨了。", en: "It rained yesterday." },
    { zh: "昨天我去了商店。", en: "I went to the store yesterday." },
  ],
  "做": [
    { zh: "你在做什么？", en: "What are you doing?" },
    { zh: "妈妈在做饭。", en: "Mom is cooking." },
  ],
  "坐": [
    { zh: "请坐。", en: "Please sit down." },
    { zh: "我坐公共汽车去学校。", en: "I take the bus to school." },
  ],

  // ── HSK 2 ──
  "爱好": [
    { zh: "你的爱好是什么？", en: "What is your hobby?" },
    { zh: "我的爱好是看书。", en: "My hobby is reading." },
  ],
  "安静": [
    { zh: "图书馆很安静。", en: "The library is very quiet." },
    { zh: "请安静！", en: "Please be quiet!" },
  ],
  "把": [
    { zh: "请把门关上。", en: "Please close the door." },
  ],
  "班": [
    { zh: "我们班有二十个学生。", en: "Our class has twenty students." },
  ],
  "搬": [
    { zh: "他搬到新家了。", en: "He moved to a new home." },
  ],
  "半": [
    { zh: "现在三点半。", en: "It's half past three now." },
  ],
  "办法": [
    { zh: "你有什么好办法？", en: "Do you have any good ideas?" },
    { zh: "没有别的办法了。", en: "There's no other way." },
  ],
  "办公室": [
    { zh: "他在办公室工作。", en: "He works in the office." },
  ],
  "帮忙": [
    { zh: "你能帮忙吗？", en: "Can you help?" },
  ],
  "帮助": [
    { zh: "谢谢你帮助我。", en: "Thank you for helping me." },
    { zh: "他经常帮助别人。", en: "He often helps others." },
  ],
  "包": [
    { zh: "你的包很好看。", en: "Your bag looks nice." },
  ],
  "报纸": [
    { zh: "爷爷喜欢看报纸。", en: "Grandpa likes to read the newspaper." },
  ],
  "比": [
    { zh: "他比我高。", en: "He is taller than me." },
    { zh: "今天比昨天冷。", en: "Today is colder than yesterday." },
  ],
  "比较": [
    { zh: "这个比较贵。", en: "This one is relatively expensive." },
    { zh: "他的汉语比较好。", en: "His Chinese is relatively good." },
  ],
  "别": [
    { zh: "别担心。", en: "Don't worry." },
    { zh: "别忘了带伞。", en: "Don't forget to bring an umbrella." },
  ],
  "别人": [
    { zh: "别人都回家了。", en: "Everyone else has gone home." },
  ],
  "宾馆": [
    { zh: "我们住在宾馆。", en: "We are staying at a hotel." },
  ],
  "冰箱": [
    { zh: "水果在冰箱里。", en: "The fruit is in the fridge." },
  ],
  "长": [
    { zh: "这条路很长。", en: "This road is very long." },
    { zh: "她的头发很长。", en: "Her hair is very long." },
  ],
  "唱歌": [
    { zh: "她喜欢唱歌。", en: "She likes to sing." },
    { zh: "我们一起唱歌吧。", en: "Let's sing together." },
  ],
  "出": [
    { zh: "请出去。", en: "Please go out." },
  ],
  "厨房": [
    { zh: "妈妈在厨房做饭。", en: "Mom is cooking in the kitchen." },
  ],
  "词典": [
    { zh: "我用词典查生词。", en: "I use a dictionary to look up new words." },
  ],
  "聪明": [
    { zh: "这个孩子很聪明。", en: "This child is very smart." },
  ],
  "从": [
    { zh: "我从北京来。", en: "I come from Beijing." },
    { zh: "从这儿到学校要十分钟。", en: "It takes ten minutes from here to school." },
  ],
  "错": [
    { zh: "这个答案是错的。", en: "This answer is wrong." },
    { zh: "你说得没错。", en: "What you said is correct." },
  ],
  "打扫": [
    { zh: "我要打扫房间。", en: "I need to clean the room." },
  ],
  "打算": [
    { zh: "你打算做什么？", en: "What do you plan to do?" },
    { zh: "我打算明天去。", en: "I plan to go tomorrow." },
  ],
  "带": [
    { zh: "别忘了带书。", en: "Don't forget to bring books." },
    { zh: "我带你去。", en: "I'll take you there." },
  ],
  "担心": [
    { zh: "别担心，没问题。", en: "Don't worry, no problem." },
    { zh: "妈妈很担心我。", en: "Mom is very worried about me." },
  ],
  "蛋糕": [
    { zh: "这个蛋糕很好吃。", en: "This cake is delicious." },
  ],
  "当然": [
    { zh: "当然可以！", en: "Of course!" },
    { zh: "你当然应该去。", en: "You should go, of course." },
  ],
  "到": [
    { zh: "我到学校了。", en: "I've arrived at school." },
    { zh: "飞机几点到？", en: "What time does the plane arrive?" },
  ],
  "灯": [
    { zh: "请开灯。", en: "Please turn on the light." },
  ],
  "等": [
    { zh: "请等一下。", en: "Please wait a moment." },
    { zh: "我在这儿等你。", en: "I'll wait for you here." },
  ],
  "弟弟": [
    { zh: "我弟弟今年十岁。", en: "My younger brother is ten this year." },
  ],
  "地方": [
    { zh: "这个地方很漂亮。", en: "This place is very beautiful." },
    { zh: "你知道什么好地方？", en: "Do you know any good places?" },
  ],
  "地铁": [
    { zh: "我坐地铁上班。", en: "I take the subway to work." },
  ],
  "地图": [
    { zh: "你有地图吗？", en: "Do you have a map?" },
  ],
  "电梯": [
    { zh: "我们坐电梯上去。", en: "Let's take the elevator up." },
  ],
  "电子邮件": [
    { zh: "我给你发电子邮件。", en: "I'll send you an email." },
  ],
  "东": [
    { zh: "太阳从东边出来。", en: "The sun rises from the east." },
  ],
  "冬天": [
    { zh: "北京的冬天很冷。", en: "Beijing's winter is very cold." },
    { zh: "冬天会下雪。", en: "It snows in winter." },
  ],
  "动物": [
    { zh: "你喜欢什么动物？", en: "What animals do you like?" },
    { zh: "我们去动物园吧。", en: "Let's go to the zoo." },
  ],
  "锻炼": [
    { zh: "他每天锻炼身体。", en: "He exercises every day." },
  ],
  "饿": [
    { zh: "我饿了，我们吃饭吧。", en: "I'm hungry, let's eat." },
  ],
  "耳朵": [
    { zh: "他的耳朵很大。", en: "His ears are big." },
  ],
  "而且": [
    { zh: "他聪明，而且很努力。", en: "He is smart and also works hard." },
  ],
  "发烧": [
    { zh: "他发烧了，去医院了。", en: "He has a fever and went to the hospital." },
  ],
  "发现": [
    { zh: "我发现了一个好饭馆。", en: "I discovered a good restaurant." },
  ],
  "方便": [
    { zh: "坐地铁很方便。", en: "Taking the subway is convenient." },
  ],
  "房间": [
    { zh: "你的房间很干净。", en: "Your room is very clean." },
    { zh: "我要一个大房间。", en: "I want a big room." },
  ],
  "放": [
    { zh: "请把书放在桌子上。", en: "Please put the book on the table." },
  ],
  "放心": [
    { zh: "你放心，没问题。", en: "Relax, no problem." },
  ],
  "复习": [
    { zh: "考试前要复习。", en: "You should review before the exam." },
  ],
  "干净": [
    { zh: "这个房间很干净。", en: "This room is very clean." },
  ],
  "感冒": [
    { zh: "我感冒了。", en: "I have a cold." },
  ],
  "刚才": [
    { zh: "他刚才在这儿。", en: "He was just here." },
  ],
  "给": [
    { zh: "请给我一杯水。", en: "Please give me a glass of water." },
    { zh: "他给我打电话了。", en: "He called me." },
  ],
  "跟": [
    { zh: "我跟他一起去。", en: "I go with him." },
  ],
  "更": [
    { zh: "今天更冷了。", en: "Today is even colder." },
  ],
  "公共汽车": [
    { zh: "我坐公共汽车上学。", en: "I take the bus to school." },
  ],
  "公司": [
    { zh: "他在一家大公司工作。", en: "He works at a big company." },
  ],
  "公园": [
    { zh: "周末我去公园。", en: "I go to the park on weekends." },
    { zh: "公园里有很多人。", en: "There are many people in the park." },
  ],
  "故事": [
    { zh: "妈妈给我讲故事。", en: "Mom tells me stories." },
  ],
  "贵": [
    { zh: "这个太贵了。", en: "This is too expensive." },
  ],
  "过": [
    { zh: "你去过中国吗？", en: "Have you been to China?" },
    { zh: "生日过得怎么样？", en: "How was your birthday?" },
  ],
  "还是": [
    { zh: "你喝茶还是咖啡？", en: "Do you drink tea or coffee?" },
  ],
  "孩子": [
    { zh: "他们有两个孩子。", en: "They have two children." },
  ],
  "好吃": [
    { zh: "这个菜很好吃。", en: "This dish is delicious." },
  ],
  "黑": [
    { zh: "天黑了。", en: "It's getting dark." },
  ],
  "红": [
    { zh: "她穿了一件红色的衣服。", en: "She wears a red piece of clothing." },
  ],
  "护照": [
    { zh: "请给我看你的护照。", en: "Please show me your passport." },
  ],
  "花": [
    { zh: "这些花真漂亮。", en: "These flowers are really pretty." },
  ],
  "坏": [
    { zh: "我的电脑坏了。", en: "My computer is broken." },
  ],
  "欢迎": [
    { zh: "欢迎来到中国！", en: "Welcome to China!" },
  ],
  "换": [
    { zh: "我想换一个房间。", en: "I'd like to change rooms." },
  ],
  "回答": [
    { zh: "请回答这个问题。", en: "Please answer this question." },
  ],
  "或者": [
    { zh: "你喝水或者茶？", en: "Do you drink water or tea?" },
  ],
  "机场": [
    { zh: "我去机场接朋友。", en: "I go to the airport to pick up a friend." },
  ],
  "几乎": [
    { zh: "他几乎每天都来。", en: "He comes almost every day." },
  ],
  "记得": [
    { zh: "你还记得我吗？", en: "Do you still remember me?" },
  ],
  "季节": [
    { zh: "你最喜欢哪个季节？", en: "Which season do you like the most?" },
  ],
  "简单": [
    { zh: "这个问题很简单。", en: "This question is very simple." },
  ],
  "见面": [
    { zh: "我们明天见面吧。", en: "Let's meet tomorrow." },
  ],
  "健康": [
    { zh: "身体健康很重要。", en: "Health is very important." },
  ],
  "教": [
    { zh: "谁教你汉语？", en: "Who teaches you Chinese?" },
  ],
  "结婚": [
    { zh: "他们去年结婚了。", en: "They got married last year." },
  ],
  "节日": [
    { zh: "春节是中国最重要的节日。", en: "Spring Festival is China's most important holiday." },
  ],
  "介绍": [
    { zh: "让我介绍一下。", en: "Let me introduce..." },
    { zh: "请你自我介绍。", en: "Please introduce yourself." },
  ],
  "经常": [
    { zh: "我经常去图书馆。", en: "I often go to the library." },
  ],
  "久": [
    { zh: "好久不见！", en: "Long time no see!" },
  ],
  "旧": [
    { zh: "这件衣服很旧了。", en: "This piece of clothing is old." },
  ],
  "决定": [
    { zh: "你决定了吗？", en: "Have you decided?" },
  ],
  "可爱": [
    { zh: "这个孩子很可爱。", en: "This child is very cute." },
  ],
  "可能": [
    { zh: "明天可能下雨。", en: "It might rain tomorrow." },
  ],
  "客人": [
    { zh: "家里来了客人。", en: "We have guests at home." },
  ],
  "空调": [
    { zh: "请开空调。", en: "Please turn on the air conditioner." },
  ],
  "哭": [
    { zh: "小孩在哭。", en: "The child is crying." },
  ],
  "快": [
    { zh: "他跑得很快。", en: "He runs very fast." },
    { zh: "快点儿！", en: "Hurry up!" },
  ],
  "快乐": [
    { zh: "生日快乐！", en: "Happy birthday!" },
  ],
  "筷子": [
    { zh: "你会用筷子吗？", en: "Can you use chopsticks?" },
  ],
  "离": [
    { zh: "学校离我家很近。", en: "The school is close to my home." },
  ],
  "礼物": [
    { zh: "这是给你的礼物。", en: "This is a gift for you." },
  ],
  "历史": [
    { zh: "中国历史很长。", en: "China's history is very long." },
  ],
  "练习": [
    { zh: "你要多练习说汉语。", en: "You should practice speaking Chinese more." },
  ],
  "了解": [
    { zh: "我不太了解这个地方。", en: "I don't know this place very well." },
  ],
  "邻居": [
    { zh: "我的邻居很友好。", en: "My neighbors are very friendly." },
  ],
  "留学": [
    { zh: "她在中国留学。", en: "She studies abroad in China." },
  ],
  "马上": [
    { zh: "我马上来。", en: "I'll be right there." },
  ],
  "满意": [
    { zh: "你满意吗？", en: "Are you satisfied?" },
  ],
  "慢": [
    { zh: "请说慢一点。", en: "Please speak slower." },
  ],
  "忙": [
    { zh: "最近我很忙。", en: "I've been very busy recently." },
  ],
  "每": [
    { zh: "我每天六点起床。", en: "I get up at six every day." },
  ],
  "妹妹": [
    { zh: "我妹妹在上大学。", en: "My younger sister is in college." },
  ],
  "门": [
    { zh: "请关门。", en: "Please close the door." },
  ],
  "面包": [
    { zh: "早上我吃面包。", en: "I eat bread in the morning." },
  ],
  "面条": [
    { zh: "他最喜欢吃面条。", en: "He likes to eat noodles the most." },
  ],
  "明白": [
    { zh: "你明白了吗？", en: "Do you understand?" },
    { zh: "我不太明白。", en: "I don't quite understand." },
  ],
  "拿": [
    { zh: "请拿好你的东西。", en: "Please hold onto your things." },
  ],
  "奶奶": [
    { zh: "奶奶今年八十岁了。", en: "Grandma is eighty years old this year." },
  ],
  "难": [
    { zh: "这个考试很难。", en: "This exam is very difficult." },
  ],
  "难过": [
    { zh: "他很难过。", en: "He is very sad." },
  ],
  "年轻": [
    { zh: "她很年轻。", en: "She is very young." },
  ],
  "鸟": [
    { zh: "树上有很多鸟。", en: "There are many birds in the tree." },
  ],
  "努力": [
    { zh: "他学习很努力。", en: "He studies very hard." },
  ],
  "爬山": [
    { zh: "周末我们去爬山吧。", en: "Let's go hiking this weekend." },
  ],
  "旁边": [
    { zh: "银行在学校旁边。", en: "The bank is next to the school." },
  ],
  "跑步": [
    { zh: "我每天早上跑步。", en: "I run every morning." },
  ],
  "便宜": [
    { zh: "这个比较便宜。", en: "This one is relatively cheap." },
  ],
  "票": [
    { zh: "你买票了吗？", en: "Did you buy a ticket?" },
  ],
  "起床": [
    { zh: "我每天早上六点起床。", en: "I get up at six every morning." },
  ],
  "清楚": [
    { zh: "请说清楚一点。", en: "Please speak more clearly." },
  ],
  "然后": [
    { zh: "先吃饭，然后去学校。", en: "First eat, then go to school." },
  ],
  "让": [
    { zh: "妈妈让我早点睡觉。", en: "Mom told me to sleep early." },
  ],
  "认真": [
    { zh: "他学习很认真。", en: "He studies very seriously." },
  ],
  "容易": [
    { zh: "这个问题很容易。", en: "This question is very easy." },
  ],
  "如果": [
    { zh: "如果明天下雨，我们就不去了。", en: "If it rains tomorrow, we won't go." },
  ],
  "伞": [
    { zh: "你带伞了吗？", en: "Did you bring an umbrella?" },
  ],
  "上班": [
    { zh: "他每天八点上班。", en: "He goes to work at eight every day." },
  ],
  "上网": [
    { zh: "他喜欢上网。", en: "He likes to go online." },
  ],
  "生气": [
    { zh: "别生气了。", en: "Don't be angry." },
  ],
  "世界": [
    { zh: "世界很大。", en: "The world is big." },
  ],
  "舒服": [
    { zh: "这把椅子很舒服。", en: "This chair is very comfortable." },
  ],
  "树": [
    { zh: "公园里有很多树。", en: "There are many trees in the park." },
  ],
  "数学": [
    { zh: "他数学很好。", en: "He is good at math." },
  ],
  "双": [
    { zh: "我买了一双鞋。", en: "I bought a pair of shoes." },
  ],
  "送": [
    { zh: "我送你回家。", en: "I'll take you home." },
  ],
  "虽然": [
    { zh: "虽然很难，但是我要努力。", en: "Although it's difficult, I'll work hard." },
  ],
  "所以": [
    { zh: "因为下雨了，所以我没去。", en: "Because it rained, I didn't go." },
  ],
  "特别": [
    { zh: "今天特别冷。", en: "Today is especially cold." },
  ],
  "疼": [
    { zh: "我头疼。", en: "I have a headache." },
  ],
  "踢足球": [
    { zh: "他喜欢踢足球。", en: "He likes to play soccer." },
  ],
  "提高": [
    { zh: "我想提高我的汉语水平。", en: "I want to improve my Chinese level." },
  ],
  "体育": [
    { zh: "他喜欢体育运动。", en: "He likes sports." },
  ],
  "甜": [
    { zh: "这个蛋糕很甜。", en: "This cake is very sweet." },
  ],
  "同意": [
    { zh: "我同意你的看法。", en: "I agree with your view." },
  ],
  "头发": [
    { zh: "她的头发很长。", en: "Her hair is very long." },
  ],
  "突然": [
    { zh: "突然下雨了。", en: "It suddenly rained." },
  ],
  "图书馆": [
    { zh: "我在图书馆看书。", en: "I read at the library." },
  ],
  "腿": [
    { zh: "他的腿很长。", en: "His legs are very long." },
  ],
  "完成": [
    { zh: "我完成了作业。", en: "I finished the homework." },
  ],
  "玩": [
    { zh: "孩子们在外面玩。", en: "The children are playing outside." },
  ],
  "忘记": [
    { zh: "我忘记带书了。", en: "I forgot to bring my book." },
  ],
  "为什么": [
    { zh: "你为什么不去？", en: "Why didn't you go?" },
  ],
  "问题": [
    { zh: "你有什么问题？", en: "Do you have any questions?" },
    { zh: "这个问题很难。", en: "This question is very difficult." },
  ],
  "希望": [
    { zh: "我希望明天不下雨。", en: "I hope it doesn't rain tomorrow." },
  ],
  "洗": [
    { zh: "我去洗手。", en: "I'm going to wash my hands." },
  ],
  "习惯": [
    { zh: "你习惯了吗？", en: "Have you gotten used to it?" },
  ],
  "相信": [
    { zh: "我相信你。", en: "I believe you." },
  ],
  "小心": [
    { zh: "小心！", en: "Be careful!" },
    { zh: "开车要小心。", en: "Be careful when driving." },
  ],
  "新闻": [
    { zh: "你看新闻了吗？", en: "Did you watch the news?" },
  ],
  "需要": [
    { zh: "你需要帮助吗？", en: "Do you need help?" },
  ],
  "选择": [
    { zh: "这是一个很难的选择。", en: "This is a difficult choice." },
  ],
  "眼睛": [
    { zh: "她的眼睛很大。", en: "Her eyes are big." },
  ],
  "要求": [
    { zh: "老师的要求很高。", en: "The teacher's requirements are high." },
  ],
  "一定": [
    { zh: "你一定要来。", en: "You must come." },
  ],
  "一起": [
    { zh: "我们一起去吧。", en: "Let's go together." },
  ],
  "已经": [
    { zh: "他已经回家了。", en: "He has already gone home." },
  ],
  "以前": [
    { zh: "以前我住在上海。", en: "I used to live in Shanghai." },
  ],
  "以后": [
    { zh: "以后我们再见吧。", en: "Let's meet again in the future." },
  ],
  "因为": [
    { zh: "因为下雨，所以我没去。", en: "Because it rained, I didn't go." },
  ],
  "音乐": [
    { zh: "我喜欢听音乐。", en: "I like to listen to music." },
  ],
  "银行": [
    { zh: "银行在哪儿？", en: "Where is the bank?" },
  ],
  "应该": [
    { zh: "你应该多休息。", en: "You should rest more." },
  ],
  "游泳": [
    { zh: "我喜欢游泳。", en: "I like to swim." },
  ],
  "有名": [
    { zh: "这个地方很有名。", en: "This place is very famous." },
  ],
  "右边": [
    { zh: "银行在右边。", en: "The bank is on the right." },
  ],
  "远": [
    { zh: "学校离我家很远。", en: "The school is far from my home." },
  ],
  "运动": [
    { zh: "你喜欢什么运动？", en: "What sports do you like?" },
  ],
  "站": [
    { zh: "请不要站在这儿。", en: "Please don't stand here." },
  ],
  "着急": [
    { zh: "别着急，慢慢来。", en: "Don't worry, take your time." },
  ],
  "照顾": [
    { zh: "谢谢你照顾我。", en: "Thank you for taking care of me." },
  ],
  "照片": [
    { zh: "我们一起照一张照片吧。", en: "Let's take a photo together." },
  ],
  "真": [
    { zh: "你真厉害！", en: "You're really amazing!" },
    { zh: "今天真冷。", en: "It's really cold today." },
  ],
  "正在": [
    { zh: "他正在吃饭。", en: "He is eating right now." },
  ],
  "知道": [
    { zh: "你知道吗？", en: "Do you know?" },
    { zh: "我不知道他在哪儿。", en: "I don't know where he is." },
  ],
  "只": [
    { zh: "我只有一本书。", en: "I only have one book." },
  ],
  "重要": [
    { zh: "学习很重要。", en: "Studying is important." },
  ],
  "准备": [
    { zh: "你准备好了吗？", en: "Are you ready?" },
  ],
  "自己": [
    { zh: "这是我自己做的。", en: "I made this myself." },
  ],
  "总是": [
    { zh: "他总是迟到。", en: "He is always late." },
  ],
  "走": [
    { zh: "我们走吧。", en: "Let's go." },
    { zh: "我走路去学校。", en: "I walk to school." },
  ],
  "最": [
    { zh: "你最喜欢什么颜色？", en: "What color do you like the most?" },
  ],
  "左边": [
    { zh: "学校在左边。", en: "The school is on the left." },
  ],
  "作业": [
    { zh: "我还没写完作业。", en: "I haven't finished my homework yet." },
  ],
  "考试": [
    { zh: "明天有考试。", en: "There's an exam tomorrow." },
  ],
  "城市": [
    { zh: "北京是一个大城市。", en: "Beijing is a big city." },
  ],
  "非常": [
    { zh: "我非常喜欢这儿。", en: "I really like it here." },
  ],
  "咖啡": [
    { zh: "你想喝咖啡吗？", en: "Do you want coffee?" },
  ],
  "牛奶": [
    { zh: "我每天喝牛奶。", en: "I drink milk every day." },
  ],
  "身体": [
    { zh: "他身体很好。", en: "He is in good health." },
  ],
  "开始": [
    { zh: "上课开始了。", en: "Class has started." },
  ],
  "周末": [
    { zh: "周末你有空吗？", en: "Are you free this weekend?" },
  ],
  "注意": [
    { zh: "请注意安全。", en: "Please pay attention to safety." },
  ],
  "颜色": [
    { zh: "你喜欢什么颜色？", en: "What color do you like?" },
  ],
};

export function generateExamplesForWord(word: SeedWord, index: ReturnType<typeof buildHskPinyinIndex>): Example[] {
  const curated = CURATED_EXAMPLES[word.hanzi];

  if (curated && curated.length > 0) {
    return curated.slice(0, 3).map((t) => ({
      chinese: t.zh,
      pinyinWords: toPinyinWords(t.zh, index),
      english: t.en,
    }));
  }

  // Fallback: generate 1 contextual sentence
  const fallback = generateFallbackExample(word);
  return fallback.slice(0, 2).map((t) => ({
    chinese: t.zh,
    pinyinWords: toPinyinWords(t.zh, index),
    english: t.en,
  }));
}

function generateFallbackExample(w: SeedWord): Array<{ zh: string; en: string }> {
  const en = w.english;
  const zh = w.hanzi;
  const enLower = en.toLowerCase().trim();
  const isVerb = enLower.startsWith("to ") || enLower.includes("(to ");

  if (isVerb) {
    const verb = en.replace(/^to\s+/i, "").replace(/\s*\(.*\)\s*/g, "");
    return [
      { zh: `我想${zh}。`, en: `I want to ${verb}.` },
      { zh: `你会${zh}吗？`, en: `Can you ${verb}?` },
    ];
  }

  // Adjective-like
  if (["short", "long", "big", "small", "fast", "slow", "clean", "dirty", "easy", "hard", "quiet", "loud"].some(a => enLower.includes(a))) {
    return [
      { zh: `这个很${zh}。`, en: `This is very ${en}.` },
    ];
  }

  // Default noun
  return [
    { zh: `这是${zh}。`, en: `This is ${en}.` },
  ];
}
