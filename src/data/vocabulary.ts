// ─── Shared Types ─────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PUNCT_RE = /^[。，！？、；：""''（）《》…—\s.!?,;:'"()\-]$/;

function isPinyinPunct(token: string): boolean {
  return /^[。，！？、；：""''（）《》…—.!?,;:'"()\-]+$/.test(token);
}

function buildPinyinWords(
  hanzi: string,
  pinyin: string | null | undefined,
): { char: string; pinyin: string }[] {
  const chars = Array.from(hanzi);
  if (pinyin && pinyin.trim()) {
    const syllables = pinyin.trim().split(/\s+/).filter((t) => t.length > 0 && !isPinyinPunct(t));
    let si = 0;
    return chars.map((char) => {
      if (PUNCT_RE.test(char)) return { char, pinyin: "" };
      return { char, pinyin: syllables[si++] ?? "" };
    });
  }
  return chars.map((char) => ({ char, pinyin: "" }));
}

function inferCategory(english: string, _hskLevel: number): string {
  const e = english.toLowerCase();
  if (/\b(i|you|he|she|we|they|me|him|her|us|them|myself|yourself)\b/.test(e)) return "Pronouns";
  if (/\b(one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|zero|\d)\b/.test(e)) return "Numbers";
  if (/\b(father|mother|son|daughter|brother|sister|family|parent|child|husband|wife|grandpa|grandma|papa|daddy|dad)\b/.test(e)) return "Family";
  if (/\b(eat|drink|cook|buy|sell|give|take|bring|go|come|walk|run|sit|stand|sleep|wake|work|play|study|read|write|speak|listen|look|watch|learn|teach|help|want|need|use|open|close|start|finish|love|like|put|wear|send|receive|tell|ask|answer|think|know|feel|meet|live|die|fly|drive|ride|swim|sing|dance|draw|wash|clean|wait|carry|hold|pick|move|try|grow)\b/.test(e)) return "Verbs";
  if (/\b(big|small|good|bad|hot|cold|fast|slow|tall|short|long|happy|sad|angry|tired|busy|new|old|clean|beautiful|expensive|cheap|important|easy|difficult|simple|clear|comfortable|healthy|white|black|red|blue|green|yellow|bright|dark|smart|clever|thick|thin|fat|wrong|right|correct|polite|quiet|loud|rich|poor|full|empty|busy|free|safe|dangerous)\b/.test(e)) return "Adjectives";
  if (/\b(today|yesterday|tomorrow|now|morning|afternoon|evening|night|year|month|week|day|hour|minute|time|before|after|already|soon|always|often|sometimes|never|again|early|late|spring|summer|autumn|winter)\b/.test(e)) return "Time";
  if (/\b(china|beijing|school|hospital|airport|station|hotel|restaurant|shop|store|bank|company|park|library|home|house|room|office|city|country|place|supermarket|market)\b/.test(e)) return "Places";
  if (/\b(rice|noodle|bread|meat|fish|chicken|egg|vegetable|fruit|apple|water|tea|coffee|milk|beer|food|drink|cake|bun|dumpling)\b/.test(e)) return "Food & Drink";
  if (/\b(weather|rain|snow|wind|sun|cloud|warm|temperature|degree)\b/.test(e)) return "Weather";
  if (/\b(doctor|hospital|medicine|sick|health|body|head|eye|ear|mouth|hand|foot|leg|pain|face|nose)\b/.test(e)) return "Health & Body";
  if (/\b(airplane|train|bus|taxi|subway|car|bicycle|boat|ticket|passport|travel|road|street|drive|ride)\b/.test(e)) return "Transport";
  if (/\b(this|that|which|what|who|where|when|why|how|here|there)\b/.test(e)) return "Question Words";
  if (/\b(money|price|pay|cost|yuan|dollar|cheap|expensive)\b/.test(e)) return "Shopping";
  if (/\b(phone|computer|internet|television|radio|newspaper|book|movie|film)\b/.test(e)) return "Technology & Media";
  if (/\b(sport|exercise|swim|run|ball|game|hobby|basketball|football|soccer)\b/.test(e)) return "Sports & Hobbies";
  if (/\b(det\.|m\.\[|measure|particle|used to|modal)\b/.test(e)) return "Grammar";
  if (/\b(wrap|surround|include|contain)\b/.test(e)) return "Verbs";
  return "General";
}

function limitEnglish(english: string, max = 3): string {
  const parts = english.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  return parts.slice(0, max).join(", ");
}

// ─── Raw fallback data (from the same JSON used for Supabase import) ─────────
// This is a subset that provides a usable offline experience.

interface RawWord {
  hanzi: string;
  pinyin: string;
  english: string;
  hsk_level: number;
  examples: { chinese: string; english: string; pinyin: string }[];
}

const RAW_FALLBACK: RawWord[] = [
  // ── HSK 1 ──────────────────────────────────────────────────────────────────
  { hanzi: "爱", pinyin: "ài", english: "love, like, be fond of, be keen on, cherish, be apt to", hsk_level: 1, examples: [] },
  { hanzi: "爱好", pinyin: "àihào", english: "love, like, be fond of, be keen on", hsk_level: 1, examples: [
    { chinese: "我爱好翻译。", english: "I love translating.", pinyin: "wǒ ài hào fān yì 。" },
    { chinese: "那是我的爱好。", english: "That's my hobby.", pinyin: "nà shì wǒ de ài hào 。" },
    { chinese: "你的爱好是什么？", english: "What's your hobby?", pinyin: "nǐ de ài hào shì shén me ？" },
  ]},
  { hanzi: "八", pinyin: "bā", english: "det.: eight", hsk_level: 1, examples: [
    { chinese: "八十了。", english: "He is eighty years old.", pinyin: "bā shí le 。" },
    { chinese: "她八歲。", english: "She is eight.", pinyin: "tā bā suì 。" },
    { chinese: "胡說八道！", english: "Baloney!", pinyin: "hú shuō bā dào ！" },
  ]},
  { hanzi: "爸爸", pinyin: "bàbà", english: "father, papa, daddy, dad", hsk_level: 1, examples: [
    { chinese: "爸爸在哪？", english: "Where's Daddy?", pinyin: "bà ba zài nǎ ？" },
    { chinese: "你爸爸在哪？", english: "Where is your dad?", pinyin: "nǐ bà ba zài nǎ ？" },
    { chinese: "爸爸在哪里？", english: "Where is dad?", pinyin: "bà ba zài nǎ lǐ ？" },
  ]},
  { hanzi: "吧", pinyin: "ba", english: "particle: used to show mild imperative or uncertainty", hsk_level: 1, examples: [
    { chinese: "来吧！", english: "Come!", pinyin: "lái ba ！" },
    { chinese: "走吧！", english: "Action!", pinyin: "zǒu ba ！" },
    { chinese: "学吧！", english: "Study!", pinyin: "xué ba ！" },
  ]},
  { hanzi: "白", pinyin: "bái", english: "white, clear, pure, plain", hsk_level: 1, examples: [
    { chinese: "白癡！", english: "Idiot!", pinyin: "bái chī ！" },
    { chinese: "明白。", english: "I understand.", pinyin: "míng bái 。" },
  ]},
  { hanzi: "白天", pinyin: "bái tiān", english: "daytime, during the day", hsk_level: 1, examples: [
    { chinese: "那时是白天。", english: "It was daytime.", pinyin: "nà shí shì bái tiān 。" },
    { chinese: "白天越來越長了。", english: "The days are getting longer and longer.", pinyin: "bái tiān yuè lái yuè cháng le 。" },
  ]},
  { hanzi: "百", pinyin: "bǎi", english: "hundred, det.: hundred", hsk_level: 1, examples: [
    { chinese: "有一百個。", english: "There are a hundred.", pinyin: "yǒu yì bǎi gè 。" },
    { chinese: "百度一下。", english: "Google it.", pinyin: "bǎi dù yí xià 。" },
  ]},
  { hanzi: "班", pinyin: "bān", english: "class, shift, squad", hsk_level: 1, examples: [
    { chinese: "航班取消了", english: "The flight was cancelled.", pinyin: "háng bān qǔ xiāo le" },
    { chinese: "你几时下班？", english: "When do you finish work?", pinyin: "nǐ jǐ shí xià bān ？" },
  ]},
  { hanzi: "半", pinyin: "bàn", english: "det.: half", hsk_level: 1, examples: [
    { chinese: "现在半夜。", english: "It's midnight.", pinyin: "xiàn zài bàn yè 。" },
    { chinese: "3点半了。", english: "It's 3:30.", pinyin: "3 diǎn bàn le 。" },
  ]},
  { hanzi: "半年", pinyin: "bàn nián", english: "half a year", hsk_level: 1, examples: [
    { chinese: "她半年后就要出国了。", english: "In half a year she'll be going abroad.", pinyin: "tā bàn nián hòu jiù yào chū guó le 。" },
  ]},
  { hanzi: "半天", pinyin: "bàn tiān", english: "half of the day, a long time, quite a while", hsk_level: 1, examples: [
    { chinese: "他们看了那部电影半天了。", english: "They've been watching that film for ages.", pinyin: "tā men kàn le nà bù diàn yǐng bàn tiān le 。" },
  ]},
  { hanzi: "帮", pinyin: "bāng", english: "help", hsk_level: 1, examples: [
    { chinese: "请帮帮她！", english: "Please, help her!", pinyin: "qǐng bāng bāng tā ！" },
    { chinese: "帮我们做.", english: "Help us do it.", pinyin: "bāng wǒ men zuò ." },
    { chinese: "帮帮我们！", english: "Help us.", pinyin: "bāng bāng wǒ men ！" },
  ]},
  { hanzi: "帮忙", pinyin: "bāngmáng", english: "assist, lend a hand, help", hsk_level: 1, examples: [
    { chinese: "要我帮忙吗？", english: "Do you want me to help?", pinyin: "yào wǒ bāng máng ma ？" },
    { chinese: "我能帮忙吗？", english: "Can I help?", pinyin: "wǒ néng bāng máng ma ？" },
  ]},
  { hanzi: "包", pinyin: "bāo", english: "wrap, surround, include, contain", hsk_level: 1, examples: [
    { chinese: "我吃面包。", english: "I eat bread.", pinyin: "wǒ chī miàn bāo 。" },
    { chinese: "請包起來。", english: "Please wrap it up.", pinyin: "qǐng bāo qǐ lái 。" },
  ]},
  { hanzi: "包子", pinyin: "bāo zi", english: "steamed stuffed bun", hsk_level: 1, examples: [
    { chinese: "人生不是甜的包子。", english: "Life is no bed of roses.", pinyin: "rén shēng bú shì tián de bāo zǐ 。" },
    { chinese: "每天在便利店吃包子。", english: "I eat a meat bun every day at the convenience store.", pinyin: "měi tiān zài biàn lì diàn chī bāo zǐ 。" },
  ]},
  { hanzi: "杯", pinyin: "bēi", english: "cup, glass (measure word)", hsk_level: 1, examples: [
    { chinese: "干杯！", english: "Bottoms up!", pinyin: "gān bēi ！" },
    { chinese: "喝一杯水。", english: "Drink a cup of water.", pinyin: "hē yì bēi shuǐ 。" },
  ]},
  { hanzi: "杯子", pinyin: "bēizi", english: "cup, glass, tumbler", hsk_level: 1, examples: [
    { chinese: "杯子易碎。", english: "Glass breaks easily.", pinyin: "bēi zi yì suì 。" },
    { chinese: "杯子里有水。", english: "There is water in the glass.", pinyin: "bēi zi lǐ yǒu shuǐ 。" },
    { chinese: "杯子在桌上。", english: "The cup is on the table.", pinyin: "bēi zi zài zhuō shàng 。" },
  ]},
  { hanzi: "北京", pinyin: "Běijīng", english: "Beijing, capital of China", hsk_level: 1, examples: [
    { chinese: "我住在北京。", english: "I live in Beijing.", pinyin: "wǒ zhù zài běi jīng 。" },
    { chinese: "北京很大。", english: "Beijing is very big.", pinyin: "běi jīng hěn dà 。" },
  ]},
  { hanzi: "本", pinyin: "běn", english: "measure word for books", hsk_level: 1, examples: [
    { chinese: "这本书很好。", english: "This book is very good.", pinyin: "zhè běn shū hěn hǎo 。" },
  ]},
  { hanzi: "不", pinyin: "bù", english: "not, no", hsk_level: 1, examples: [
    { chinese: "不对！", english: "Wrong!", pinyin: "bú duì ！" },
    { chinese: "不行！", english: "No way!", pinyin: "bù xíng ！" },
    { chinese: "不客气。", english: "You're welcome.", pinyin: "bú kè qì 。" },
  ]},
  { hanzi: "不客气", pinyin: "bú kèqi", english: "you're welcome, don't mention it", hsk_level: 1, examples: [
    { chinese: "谢谢！不客气。", english: "Thanks! You're welcome.", pinyin: "xiè xie ！ bú kè qì 。" },
  ]},
  { hanzi: "菜", pinyin: "cài", english: "dish, vegetable, cuisine", hsk_level: 1, examples: [
    { chinese: "这个菜好吃。", english: "This dish is delicious.", pinyin: "zhè ge cài hǎo chī 。" },
    { chinese: "你喜欢吃什么菜？", english: "What dishes do you like to eat?", pinyin: "nǐ xǐ huān chī shén me cài ？" },
  ]},
  { hanzi: "茶", pinyin: "chá", english: "tea", hsk_level: 1, examples: [
    { chinese: "请喝茶。", english: "Please have some tea.", pinyin: "qǐng hē chá 。" },
    { chinese: "我喜欢喝茶。", english: "I like drinking tea.", pinyin: "wǒ xǐ huān hē chá 。" },
  ]},
  { hanzi: "吃", pinyin: "chī", english: "eat, have a meal", hsk_level: 1, examples: [
    { chinese: "你吃了吗？", english: "Have you eaten?", pinyin: "nǐ chī le ma ？" },
    { chinese: "我想吃面条。", english: "I want to eat noodles.", pinyin: "wǒ xiǎng chī miàn tiáo 。" },
  ]},
  { hanzi: "出", pinyin: "chū", english: "go out, come out, exit", hsk_level: 1, examples: [
    { chinese: "出去！", english: "Get out!", pinyin: "chū qù ！" },
    { chinese: "太阳出来了。", english: "The sun came out.", pinyin: "tài yáng chū lái le 。" },
  ]},
  { hanzi: "穿", pinyin: "chuān", english: "wear, put on, pierce through", hsk_level: 1, examples: [
    { chinese: "穿上.", english: "Put it on.", pinyin: "chuān shàng ." },
    { chinese: "她穿红衣服。", english: "She wears red clothes.", pinyin: "tā chuān hóng yī fú 。" },
  ]},
  { hanzi: "床", pinyin: "chuáng", english: "bed", hsk_level: 1, examples: [
    { chinese: "他起床。", english: "He stood up.", pinyin: "tā qǐ chuáng 。" },
    { chinese: "我想睡觉了，去床上吧。", english: "I'm sleepy, let's go to bed.", pinyin: "wǒ xiǎng shuì jiào le ， qù chuáng shàng ba 。" },
  ]},
  { hanzi: "大", pinyin: "dà", english: "big, large, great", hsk_level: 1, examples: [
    { chinese: "这个很大。", english: "This is very big.", pinyin: "zhè ge hěn dà 。" },
    { chinese: "他是大人。", english: "He is an adult.", pinyin: "tā shì dà rén 。" },
  ]},
  { hanzi: "打电话", pinyin: "dǎ diànhuà", english: "make a phone call", hsk_level: 1, examples: [
    { chinese: "我给你打电话。", english: "I'll call you.", pinyin: "wǒ gěi nǐ dǎ diàn huà 。" },
  ]},
  { hanzi: "的", pinyin: "de", english: "possessive/attributive particle", hsk_level: 1, examples: [
    { chinese: "我的书。", english: "My book.", pinyin: "wǒ de shū 。" },
    { chinese: "她的猫很可爱。", english: "Her cat is cute.", pinyin: "tā de māo hěn kě ài 。" },
  ]},
  { hanzi: "电脑", pinyin: "diànnǎo", english: "computer", hsk_level: 1, examples: [
    { chinese: "我用电脑工作。", english: "I work with a computer.", pinyin: "wǒ yòng diàn nǎo gōng zuò 。" },
    { chinese: "电脑坏了。", english: "The computer broke down.", pinyin: "diàn nǎo huài le 。" },
  ]},
  { hanzi: "电视", pinyin: "diànshì", english: "television, TV", hsk_level: 1, examples: [
    { chinese: "我在看电视。", english: "I'm watching TV.", pinyin: "wǒ zài kàn diàn shì 。" },
  ]},
  { hanzi: "电影", pinyin: "diànyǐng", english: "movie, film", hsk_level: 1, examples: [
    { chinese: "这部电影很好看。", english: "This movie is very good.", pinyin: "zhè bù diàn yǐng hěn hǎo kàn 。" },
    { chinese: "我们去看电影吧。", english: "Let's go watch a movie.", pinyin: "wǒ men qù kàn diàn yǐng ba 。" },
  ]},
  { hanzi: "东西", pinyin: "dōngxi", english: "thing, stuff", hsk_level: 1, examples: [
    { chinese: "你买了什么东西？", english: "What did you buy?", pinyin: "nǐ mǎi le shén me dōng xi ？" },
    { chinese: "这个东西很贵。", english: "This thing is very expensive.", pinyin: "zhè ge dōng xi hěn guì 。" },
  ]},
  { hanzi: "都", pinyin: "dōu", english: "all, both, already", hsk_level: 1, examples: [
    { chinese: "我们都是学生。", english: "We are all students.", pinyin: "wǒ men dōu shì xué shēng 。" },
    { chinese: "都知道了。", english: "Everyone knows.", pinyin: "dōu zhī dào le 。" },
  ]},
  { hanzi: "读", pinyin: "dú", english: "read, study", hsk_level: 1, examples: [
    { chinese: "她每天读书。", english: "She reads every day.", pinyin: "tā měi tiān dú shū 。" },
    { chinese: "读一读这个。", english: "Read this.", pinyin: "dú yí dú zhè ge 。" },
  ]},
  { hanzi: "对", pinyin: "duì", english: "correct, right, toward", hsk_level: 1, examples: [
    { chinese: "对！", english: "Correct!", pinyin: "duì ！" },
    { chinese: "你说得对。", english: "You're right.", pinyin: "nǐ shuō de duì 。" },
  ]},
  { hanzi: "对不起", pinyin: "duìbuqǐ", english: "sorry, excuse me", hsk_level: 1, examples: [
    { chinese: "对不起，我来晚了。", english: "Sorry, I'm late.", pinyin: "duì bù qǐ ， wǒ lái wǎn le 。" },
  ]},
  { hanzi: "多", pinyin: "duō", english: "many, much, more", hsk_level: 1, examples: [
    { chinese: "人很多。", english: "There are many people.", pinyin: "rén hěn duō 。" },
    { chinese: "多少钱？", english: "How much?", pinyin: "duō shǎo qián ？" },
  ]},
  { hanzi: "多少", pinyin: "duōshǎo", english: "how many, how much", hsk_level: 1, examples: [
    { chinese: "这个多少钱？", english: "How much is this?", pinyin: "zhè ge duō shǎo qián ？" },
  ]},
  { hanzi: "儿子", pinyin: "érzi", english: "son", hsk_level: 1, examples: [
    { chinese: "他的儿子很高。", english: "His son is very tall.", pinyin: "tā de ér zi hěn gāo 。" },
  ]},
  { hanzi: "二", pinyin: "èr", english: "two, det.: two", hsk_level: 1, examples: [
    { chinese: "我有二十块钱。", english: "I have twenty yuan.", pinyin: "wǒ yǒu èr shí kuài qián 。" },
  ]},
  { hanzi: "饭", pinyin: "fàn", english: "meal, cooked rice, food", hsk_level: 1, examples: [
    { chinese: "吃饭了！", english: "Time to eat!", pinyin: "chī fàn le ！" },
    { chinese: "你吃饭了吗？", english: "Have you eaten?", pinyin: "nǐ chī fàn le ma ？" },
  ]},
  { hanzi: "飞机", pinyin: "fēijī", english: "airplane, plane", hsk_level: 1, examples: [
    { chinese: "飞机到了。", english: "The plane has arrived.", pinyin: "fēi jī dào le 。" },
    { chinese: "我坐飞机去北京。", english: "I fly to Beijing.", pinyin: "wǒ zuò fēi jī qù běi jīng 。" },
  ]},
  { hanzi: "高兴", pinyin: "gāoxìng", english: "happy, glad, pleased", hsk_level: 1, examples: [
    { chinese: "我很高兴。", english: "I am very happy.", pinyin: "wǒ hěn gāo xìng 。" },
    { chinese: "认识你很高兴。", english: "Nice to meet you.", pinyin: "rèn shi nǐ hěn gāo xìng 。" },
  ]},
  { hanzi: "个", pinyin: "gè", english: "general measure word", hsk_level: 1, examples: [
    { chinese: "一个人。", english: "One person.", pinyin: "yí gè rén 。" },
    { chinese: "三个苹果。", english: "Three apples.", pinyin: "sān gè píng guǒ 。" },
  ]},
  { hanzi: "工作", pinyin: "gōngzuò", english: "work, job", hsk_level: 1, examples: [
    { chinese: "你在哪里工作？", english: "Where do you work?", pinyin: "nǐ zài nǎ lǐ gōng zuò ？" },
    { chinese: "工作很忙。", english: "Work is very busy.", pinyin: "gōng zuò hěn máng 。" },
  ]},
  { hanzi: "好", pinyin: "hǎo", english: "good, well, fine", hsk_level: 1, examples: [
    { chinese: "你好！", english: "Hello!", pinyin: "nǐ hǎo ！" },
    { chinese: "好的。", english: "OK.", pinyin: "hǎo de 。" },
    { chinese: "今天天气很好。", english: "The weather is nice today.", pinyin: "jīn tiān tiān qì hěn hǎo 。" },
  ]},
  { hanzi: "喝", pinyin: "hē", english: "drink", hsk_level: 1, examples: [
    { chinese: "喝水。", english: "Drink water.", pinyin: "hē shuǐ 。" },
    { chinese: "你想喝什么？", english: "What do you want to drink?", pinyin: "nǐ xiǎng hē shén me ？" },
  ]},
  { hanzi: "很", pinyin: "hěn", english: "very, quite", hsk_level: 1, examples: [
    { chinese: "很好。", english: "Very good.", pinyin: "hěn hǎo 。" },
    { chinese: "她很漂亮。", english: "She is very pretty.", pinyin: "tā hěn piào liàng 。" },
  ]},
  { hanzi: "回", pinyin: "huí", english: "return, go back, reply", hsk_level: 1, examples: [
    { chinese: "我要回家。", english: "I want to go home.", pinyin: "wǒ yào huí jiā 。" },
    { chinese: "回来！", english: "Come back!", pinyin: "huí lái ！" },
  ]},
  { hanzi: "会", pinyin: "huì", english: "can, be able to, will", hsk_level: 1, examples: [
    { chinese: "你会说中文吗？", english: "Can you speak Chinese?", pinyin: "nǐ huì shuō zhōng wén ma ？" },
    { chinese: "我会做饭。", english: "I can cook.", pinyin: "wǒ huì zuò fàn 。" },
  ]},
  { hanzi: "家", pinyin: "jiā", english: "home, family, house", hsk_level: 1, examples: [
    { chinese: "我要回家。", english: "I want to go home.", pinyin: "wǒ yào huí jiā 。" },
    { chinese: "你家在哪儿？", english: "Where is your home?", pinyin: "nǐ jiā zài nǎr ？" },
  ]},
  // ── HSK 2 (sample) ────────────────────────────────────────────────────────
  { hanzi: "把", pinyin: "bǎ", english: "to hold, handle (grammar particle)", hsk_level: 2, examples: [
    { chinese: "请把书给我。", english: "Please give me the book.", pinyin: "qǐng bǎ shū gěi wǒ 。" },
    { chinese: "我把作业做完了。", english: "I finished the homework.", pinyin: "wǒ bǎ zuò yè zuò wán le 。" },
  ]},
  { hanzi: "比", pinyin: "bǐ", english: "compare, than", hsk_level: 2, examples: [
    { chinese: "今天比昨天冷。", english: "Today is colder than yesterday.", pinyin: "jīn tiān bǐ zuó tiān lěng 。" },
    { chinese: "他比我高。", english: "He is taller than me.", pinyin: "tā bǐ wǒ gāo 。" },
  ]},
  { hanzi: "别", pinyin: "bié", english: "don't, other", hsk_level: 2, examples: [
    { chinese: "别说话！", english: "Don't talk!", pinyin: "bié shuō huà ！" },
    { chinese: "别担心。", english: "Don't worry.", pinyin: "bié dān xīn 。" },
  ]},
  { hanzi: "宾馆", pinyin: "bīnguǎn", english: "hotel, guesthouse", hsk_level: 2, examples: [
    { chinese: "我住在宾馆。", english: "I'm staying at a hotel.", pinyin: "wǒ zhù zài bīn guǎn 。" },
  ]},
  { hanzi: "冰箱", pinyin: "bīngxiāng", english: "refrigerator, fridge", hsk_level: 2, examples: [
    { chinese: "冰箱里有牛奶。", english: "There is milk in the fridge.", pinyin: "bīng xiāng lǐ yǒu niú nǎi 。" },
    { chinese: "把水果放进冰箱。", english: "Put the fruit in the fridge.", pinyin: "bǎ shuǐ guǒ fàng jìn bīng xiāng 。" },
  ]},
  { hanzi: "参加", pinyin: "cānjiā", english: "participate, attend, join", hsk_level: 2, examples: [
    { chinese: "你参加比赛了吗？", english: "Did you join the competition?", pinyin: "nǐ cān jiā bǐ sài le ma ？" },
    { chinese: "我想参加这个活动。", english: "I want to attend this event.", pinyin: "wǒ xiǎng cān jiā zhè ge huó dòng 。" },
  ]},
  { hanzi: "层", pinyin: "céng", english: "floor, layer, storey", hsk_level: 2, examples: [
    { chinese: "我住在五层。", english: "I live on the fifth floor.", pinyin: "wǒ zhù zài wǔ céng 。" },
    { chinese: "图书馆在三层。", english: "The library is on the third floor.", pinyin: "tú shū guǎn zài sān céng 。" },
  ]},
  { hanzi: "超市", pinyin: "chāoshì", english: "supermarket", hsk_level: 2, examples: [
    { chinese: "我去超市买东西。", english: "I go to the supermarket to buy things.", pinyin: "wǒ qù chāo shì mǎi dōng xi 。" },
  ]},
  { hanzi: "迟到", pinyin: "chídào", english: "be late, late arrival", hsk_level: 2, examples: [
    { chinese: "对不起，我迟到了。", english: "Sorry, I'm late.", pinyin: "duì bù qǐ ， wǒ chí dào le 。" },
    { chinese: "上课不能迟到。", english: "You can't be late for class.", pinyin: "shàng kè bù néng chí dào 。" },
  ]},
  { hanzi: "聪明", pinyin: "cōngmíng", english: "smart, clever, intelligent", hsk_level: 2, examples: [
    { chinese: "她的孩子很聪明。", english: "Her child is very smart.", pinyin: "tā de hái zi hěn cōng míng 。" },
    { chinese: "你真聪明！", english: "You're so clever!", pinyin: "nǐ zhēn cōng míng ！" },
  ]},
  { hanzi: "从", pinyin: "cóng", english: "from, since", hsk_level: 2, examples: [
    { chinese: "我从北京来。", english: "I come from Beijing.", pinyin: "wǒ cóng běi jīng lái 。" },
  ]},
  { hanzi: "担心", pinyin: "dānxīn", english: "worry, be concerned", hsk_level: 2, examples: [
    { chinese: "别担心，没问题。", english: "Don't worry, no problem.", pinyin: "bié dān xīn ， méi wèn tí 。" },
    { chinese: "我很担心他。", english: "I'm very worried about him.", pinyin: "wǒ hěn dān xīn tā 。" },
  ]},
  { hanzi: "蛋糕", pinyin: "dàngāo", english: "cake", hsk_level: 2, examples: [
    { chinese: "生日快乐！这是蛋糕。", english: "Happy birthday! Here's the cake.", pinyin: "shēng rì kuài lè ！ zhè shì dàn gāo 。" },
    { chinese: "她做的蛋糕很好吃。", english: "The cake she made is delicious.", pinyin: "tā zuò de dàn gāo hěn hǎo chī 。" },
  ]},
  { hanzi: "帮助", pinyin: "bāngzhù", english: "help, assist, assistance", hsk_level: 2, examples: [
    { chinese: "谢谢你的帮助。", english: "Thank you for your help.", pinyin: "xiè xiè nǐ de bāng zhù 。" },
    { chinese: "我可以帮助你吗？", english: "Can I help you?", pinyin: "wǒ kě yǐ bāng zhù nǐ ma ？" },
  ]},
  { hanzi: "城市", pinyin: "chéngshì", english: "city", hsk_level: 2, examples: [
    { chinese: "上海是一个大城市。", english: "Shanghai is a big city.", pinyin: "shàng hǎi shì yí gè dà chéng shì 。" },
  ]},
  { hanzi: "成绩", pinyin: "chéngjì", english: "grade, result, score", hsk_level: 2, examples: [
    { chinese: "他的成绩很好。", english: "His grades are very good.", pinyin: "tā de chéng jì hěn hǎo 。" },
  ]},
  { hanzi: "船", pinyin: "chuán", english: "boat, ship", hsk_level: 2, examples: [
    { chinese: "我坐船去岛上。", english: "I go to the island by boat.", pinyin: "wǒ zuò chuán qù dǎo shàng 。" },
  ]},
  { hanzi: "春", pinyin: "chūn", english: "spring (season)", hsk_level: 2, examples: [
    { chinese: "春天花都开了。", english: "Flowers bloom in spring.", pinyin: "chūn tiān huā dōu kāi le 。" },
    { chinese: "我最喜欢春天。", english: "Spring is my favorite season.", pinyin: "wǒ zuì xǐ huān chūn tiān 。" },
  ]},
  { hanzi: "打篮球", pinyin: "dǎ lánqiú", english: "play basketball", hsk_level: 2, examples: [
    { chinese: "他每天打篮球。", english: "He plays basketball every day.", pinyin: "tā měi tiān dǎ lán qiú 。" },
  ]},
  { hanzi: "搬", pinyin: "bān", english: "move (objects), carry", hsk_level: 2, examples: [
    { chinese: "帮我搬一下这个箱子。", english: "Help me move this box.", pinyin: "bāng wǒ bān yí xià zhè ge xiāng zi 。" },
  ]},
  { hanzi: "草", pinyin: "cǎo", english: "grass", hsk_level: 2, examples: [
    { chinese: "公园里有很多草。", english: "There is a lot of grass in the park.", pinyin: "gōng yuán lǐ yǒu hěn duō cǎo 。" },
  ]},
  { hanzi: "差", pinyin: "chà", english: "bad, poor, differ from", hsk_level: 2, examples: [
    { chinese: "他的汉语说得很差。", english: "His Chinese is very poor.", pinyin: "tā de hàn yǔ shuō de hěn chà 。" },
  ]},
];

// ─── Build the fallback VocabWord array ──────────────────────────────────────

export const FALLBACK_VOCABULARY: VocabWord[] = RAW_FALLBACK.map((raw, index) => ({
  id: index + 1,
  hanzi: raw.hanzi,
  pinyin: raw.pinyin,
  english: limitEnglish(raw.english, 3),
  hskLevel: (raw.hsk_level === 1 ? 1 : 2) as 1 | 2,
  category: inferCategory(raw.english, raw.hsk_level),
  examples: raw.examples.slice(0, 3).map((ex) => ({
    chinese: ex.chinese,
    pinyinWords: buildPinyinWords(ex.chinese, ex.pinyin),
    english: ex.english,
  })),
}));

// ─── Re-export for backward compat ───────────────────────────────────────────
export function getEnrichedVocabulary(): VocabWord[] {
  return FALLBACK_VOCABULARY;
}
