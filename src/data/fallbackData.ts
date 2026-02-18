/**
 * Offline fallback vocabulary — mirrors the exact JSON structure
 * exported from the Supabase database (hsk_words + example_sentences joined).
 *
 * Used when Supabase is unreachable (sandbox / no internet / missing env vars).
 * Add more words here by copying rows from the DB export JSON.
 */

export interface FallbackWord {
  hanzi: string;
  pinyin: string;
  english: string;
  hsk_level: number;
  examples: {
    chinese: string;
    english: string;
    pinyin: string | null;
  }[];
}

export const FALLBACK_DATA: FallbackWord[] = [
  {
    hanzi: "爱",
    pinyin: "ài",
    english: "love, like, be fond of, be keen on, cherish, be apt to",
    hsk_level: 1,
    examples: [],
  },
  {
    hanzi: "爱好",
    pinyin: "àihào",
    english: "love, like, be fond of, be keen on",
    hsk_level: 1,
    examples: [
      { chinese: "我爱好翻译。", english: "I love translating.", pinyin: "wǒ ài hào fān yì 。" },
      { chinese: "那是我的爱好。", english: "That's my hobby.", pinyin: "nà shì wǒ de ài hào 。" },
      { chinese: "你的爱好是什么？", english: "What's your hobby?", pinyin: "nǐ de ài hào shì shén me ？" },
    ],
  },
  {
    hanzi: "八",
    pinyin: "bā",
    english: "eight",
    hsk_level: 1,
    examples: [
      { chinese: "八十了。", english: "He is eighty years old.", pinyin: "bā shí le 。" },
      { chinese: "她八岁。", english: "She is eight.", pinyin: "tā bā suì 。" },
    ],
  },
  {
    hanzi: "爸爸",
    pinyin: "bàba",
    english: "father, papa, dad",
    hsk_level: 1,
    examples: [
      { chinese: "爸爸在哪？", english: "Where's Daddy?", pinyin: "bà ba zài nǎ ？" },
      { chinese: "你爸爸在哪？", english: "Where is your dad?", pinyin: "nǐ bà ba zài nǎ ？" },
      { chinese: "爸爸在哪里？", english: "Where is dad?", pinyin: "bà ba zài nǎ lǐ ？" },
    ],
  },
  {
    hanzi: "吧",
    pinyin: "ba",
    english: "particle: used to show mild imperative or uncertainty",
    hsk_level: 1,
    examples: [
      { chinese: "来吧！", english: "Come!", pinyin: "lái ba ！" },
      { chinese: "走吧！", english: "Let's go!", pinyin: "zǒu ba ！" },
      { chinese: "学吧！", english: "Study!", pinyin: "xué ba ！" },
    ],
  },
  {
    hanzi: "白",
    pinyin: "bái",
    english: "white, clear, pure, plain",
    hsk_level: 1,
    examples: [
      { chinese: "明白。", english: "I understand.", pinyin: "míng bái 。" },
      { chinese: "雪是白的。", english: "Snow is white.", pinyin: "xuě shì bái de 。" },
    ],
  },
  {
    hanzi: "白天",
    pinyin: "bái tiān",
    english: "daytime, during the day",
    hsk_level: 1,
    examples: [
      { chinese: "那时是白天。", english: "It was daytime.", pinyin: "nà shí shì bái tiān 。" },
      { chinese: "白天越来越长了。", english: "The days are getting longer and longer.", pinyin: "bái tiān yuè lái yuè cháng le 。" },
    ],
  },
  {
    hanzi: "百",
    pinyin: "bǎi",
    english: "hundred",
    hsk_level: 1,
    examples: [
      { chinese: "有一百个。", english: "There are a hundred.", pinyin: "yǒu yì bǎi gè 。" },
      { chinese: "百度一下。", english: "Google it.", pinyin: "bǎi dù yí xià 。" },
    ],
  },
  {
    hanzi: "帮",
    pinyin: "bāng",
    english: "help",
    hsk_level: 1,
    examples: [
      { chinese: "请帮帮她！", english: "Please, help her!", pinyin: "qǐng bāng bāng tā ！" },
      { chinese: "帮帮我们！", english: "Help us.", pinyin: "bāng bāng wǒ men ！" },
    ],
  },
  {
    hanzi: "帮忙",
    pinyin: "bāngmáng",
    english: "assist, help, lend a hand",
    hsk_level: 1,
    examples: [
      { chinese: "要我帮忙吗？", english: "Do you want me to help?", pinyin: "yào wǒ bāng máng ma ？" },
      { chinese: "我能帮忙吗？", english: "Can I help?", pinyin: "wǒ néng bāng máng ma ？" },
    ],
  },
  {
    hanzi: "杯子",
    pinyin: "bēizi",
    english: "cup, glass, tumbler",
    hsk_level: 1,
    examples: [
      { chinese: "杯子里有水。", english: "There is water in the glass.", pinyin: "bēi zi lǐ yǒu shuǐ 。" },
      { chinese: "杯子在桌上。", english: "The cup is on the table.", pinyin: "bēi zi zài zhuō shàng 。" },
      { chinese: "杯子易碎。", english: "Glass breaks easily.", pinyin: "bēi zi yì suì 。" },
    ],
  },
  {
    hanzi: "北京",
    pinyin: "Běi jīng",
    english: "Beijing",
    hsk_level: 1,
    examples: [
      { chinese: "我在北京工作。", english: "I work in Beijing.", pinyin: "wǒ zài Běi jīng gōng zuò 。" },
      { chinese: "北京是中国的首都。", english: "Beijing is the capital of China.", pinyin: "Běi jīng shì zhōng guó de shǒu dū 。" },
    ],
  },
  {
    hanzi: "不",
    pinyin: "bù",
    english: "no, not",
    hsk_level: 1,
    examples: [
      { chinese: "我不是老师。", english: "I am not a teacher.", pinyin: "wǒ bù shì lǎo shī 。" },
      { chinese: "今天不冷。", english: "It's not cold today.", pinyin: "jīn tiān bù lěng 。" },
      { chinese: "我不知道。", english: "I don't know.", pinyin: "wǒ bù zhī dào 。" },
    ],
  },
  {
    hanzi: "不客气",
    pinyin: "bú kèqi",
    english: "you're welcome, don't mention it",
    hsk_level: 1,
    examples: [
      { chinese: "谢谢！不客气。", english: "Thank you! You're welcome.", pinyin: "xiè xiè ！ bú kè qi 。" },
    ],
  },
  {
    hanzi: "菜",
    pinyin: "cài",
    english: "dish, vegetable, food",
    hsk_level: 1,
    examples: [
      { chinese: "这个菜很好吃。", english: "This dish is delicious.", pinyin: "zhè ge cài hěn hǎo chī 。" },
      { chinese: "今天吃什么菜？", english: "What dishes are we having today?", pinyin: "jīn tiān chī shén me cài ？" },
    ],
  },
  {
    hanzi: "茶",
    pinyin: "chá",
    english: "tea",
    hsk_level: 1,
    examples: [
      { chinese: "我喜欢喝茶。", english: "I like drinking tea.", pinyin: "wǒ xǐ huān hē chá 。" },
      { chinese: "请喝茶。", english: "Please have some tea.", pinyin: "qǐng hē chá 。" },
    ],
  },
  {
    hanzi: "吃",
    pinyin: "chī",
    english: "to eat",
    hsk_level: 1,
    examples: [
      { chinese: "我喜欢吃米饭。", english: "I like eating rice.", pinyin: "wǒ xǐ huān chī mǐ fàn 。" },
      { chinese: "你吃饭了吗？", english: "Have you eaten?", pinyin: "nǐ chī fàn le ma ？" },
      { chinese: "我们一起吃饭吧。", english: "Let's eat together.", pinyin: "wǒ men yī qǐ chī fàn ba 。" },
    ],
  },
  {
    hanzi: "出租车",
    pinyin: "chū zū chē",
    english: "taxi, cab",
    hsk_level: 1,
    examples: [
      { chinese: "我坐出租车去机场。", english: "I take a taxi to the airport.", pinyin: "wǒ zuò chū zū chē qù jī chǎng 。" },
      { chinese: "打出租车很方便。", english: "Taking a taxi is very convenient.", pinyin: "dǎ chū zū chē hěn fāng biàn 。" },
    ],
  },
  {
    hanzi: "打电话",
    pinyin: "dǎ diàn huà",
    english: "to make a phone call",
    hsk_level: 1,
    examples: [
      { chinese: "我给她打电话。", english: "I call her on the phone.", pinyin: "wǒ gěi tā dǎ diàn huà 。" },
      { chinese: "请打电话给我。", english: "Please call me.", pinyin: "qǐng dǎ diàn huà gěi wǒ 。" },
    ],
  },
  {
    hanzi: "大",
    pinyin: "dà",
    english: "big, large, great",
    hsk_level: 1,
    examples: [
      { chinese: "这个房间很大。", english: "This room is very big.", pinyin: "zhè ge fáng jiān hěn dà 。" },
      { chinese: "中国很大。", english: "China is very large.", pinyin: "zhōng guó hěn dà 。" },
    ],
  },
  {
    hanzi: "的",
    pinyin: "de",
    english: "possessive particle, of",
    hsk_level: 1,
    examples: [
      { chinese: "这是我的书。", english: "This is my book.", pinyin: "zhè shì wǒ de shū 。" },
      { chinese: "她是我的朋友。", english: "She is my friend.", pinyin: "tā shì wǒ de péng yǒu 。" },
    ],
  },
  {
    hanzi: "电脑",
    pinyin: "diàn nǎo",
    english: "computer",
    hsk_level: 1,
    examples: [
      { chinese: "我用电脑工作。", english: "I work with a computer.", pinyin: "wǒ yòng diàn nǎo gōng zuò 。" },
      { chinese: "电脑坏了。", english: "The computer broke down.", pinyin: "diàn nǎo huài le 。" },
    ],
  },
  {
    hanzi: "电视",
    pinyin: "diàn shì",
    english: "television, TV",
    hsk_level: 1,
    examples: [
      { chinese: "我晚上看电视。", english: "I watch TV in the evening.", pinyin: "wǒ wǎn shàng kàn diàn shì 。" },
      { chinese: "电视上在播什么？", english: "What's on TV?", pinyin: "diàn shì shàng zài bō shén me ？" },
    ],
  },
  {
    hanzi: "电影",
    pinyin: "diàn yǐng",
    english: "movie, film",
    hsk_level: 1,
    examples: [
      { chinese: "我们去看电影吧。", english: "Let's go watch a movie.", pinyin: "wǒ men qù kàn diàn yǐng ba 。" },
      { chinese: "这部电影很好看。", english: "This movie is very good.", pinyin: "zhè bù diàn yǐng hěn hǎo kàn 。" },
    ],
  },
  {
    hanzi: "东西",
    pinyin: "dōng xi",
    english: "thing, stuff, object",
    hsk_level: 1,
    examples: [
      { chinese: "你买了什么东西？", english: "What did you buy?", pinyin: "nǐ mǎi le shén me dōng xi ？" },
      { chinese: "这个东西很贵。", english: "This thing is very expensive.", pinyin: "zhè ge dōng xi hěn guì 。" },
    ],
  },
  {
    hanzi: "都",
    pinyin: "dōu",
    english: "all, both, already",
    hsk_level: 1,
    examples: [
      { chinese: "他们都是学生。", english: "They are all students.", pinyin: "tā men dōu shì xué shēng 。" },
      { chinese: "我都知道了。", english: "I know it all.", pinyin: "wǒ dōu zhī dào le 。" },
    ],
  },
  {
    hanzi: "读",
    pinyin: "dú",
    english: "to read, to study",
    hsk_level: 1,
    examples: [
      { chinese: "她每天读书。", english: "She reads every day.", pinyin: "tā měi tiān dú shū 。" },
      { chinese: "请大声读。", english: "Please read aloud.", pinyin: "qǐng dà shēng dú 。" },
    ],
  },
  {
    hanzi: "对不起",
    pinyin: "duì bu qǐ",
    english: "sorry, I beg your pardon",
    hsk_level: 1,
    examples: [
      { chinese: "对不起，我来晚了。", english: "Sorry, I'm late.", pinyin: "duì bu qǐ ， wǒ lái wǎn le 。" },
      { chinese: "对不起，我不知道。", english: "Sorry, I don't know.", pinyin: "duì bu qǐ ， wǒ bù zhī dào 。" },
    ],
  },
  {
    hanzi: "多少",
    pinyin: "duō shǎo",
    english: "how many, how much",
    hsk_level: 1,
    examples: [
      { chinese: "这个多少钱？", english: "How much is this?", pinyin: "zhè ge duō shǎo qián ？" },
      { chinese: "你有多少本书？", english: "How many books do you have?", pinyin: "nǐ yǒu duō shǎo běn shū ？" },
    ],
  },
  {
    hanzi: "儿子",
    pinyin: "érzi",
    english: "son",
    hsk_level: 1,
    examples: [
      { chinese: "她的儿子很聪明。", english: "Her son is very smart.", pinyin: "tā de ér zi hěn cōng míng 。" },
      { chinese: "他是我的儿子。", english: "He is my son.", pinyin: "tā shì wǒ de ér zi 。" },
    ],
  },
  {
    hanzi: "二",
    pinyin: "èr",
    english: "two",
    hsk_level: 1,
    examples: [
      { chinese: "我有两个孩子。", english: "I have two children.", pinyin: "wǒ yǒu liǎng gè hái zi 。" },
      { chinese: "二楼在哪里？", english: "Where is the second floor?", pinyin: "èr lóu zài nǎ lǐ ？" },
    ],
  },
  {
    hanzi: "饭馆",
    pinyin: "fànguǎn",
    english: "restaurant",
    hsk_level: 1,
    examples: [
      { chinese: "我们去饭馆吃饭。", english: "Let's go to the restaurant to eat.", pinyin: "wǒ men qù fàn guǎn chī fàn 。" },
      { chinese: "这家饭馆的菜很好吃。", english: "The food at this restaurant is delicious.", pinyin: "zhè jiā fàn guǎn de cài hěn hǎo chī 。" },
    ],
  },
  {
    hanzi: "非常",
    pinyin: "fēicháng",
    english: "very, extremely, extraordinarily",
    hsk_level: 1,
    examples: [
      { chinese: "今天非常热。", english: "It's extremely hot today.", pinyin: "jīn tiān fēi cháng rè 。" },
      { chinese: "我非常喜欢中国菜。", english: "I like Chinese food very much.", pinyin: "wǒ fēi cháng xǐ huān zhōng guó cài 。" },
    ],
  },
  {
    hanzi: "高兴",
    pinyin: "gāoxìng",
    english: "happy, glad, pleased",
    hsk_level: 1,
    examples: [
      { chinese: "见到你很高兴。", english: "Nice to meet you.", pinyin: "jiàn dào nǐ hěn gāo xìng 。" },
      { chinese: "他今天很高兴。", english: "He is very happy today.", pinyin: "tā jīn tiān hěn gāo xìng 。" },
    ],
  },
  {
    hanzi: "个",
    pinyin: "gè",
    english: "measure word (general)",
    hsk_level: 1,
    examples: [
      { chinese: "我有一个苹果。", english: "I have one apple.", pinyin: "wǒ yǒu yī gè píng guǒ 。" },
      { chinese: "三个人。", english: "Three people.", pinyin: "sān gè rén 。" },
    ],
  },
  {
    hanzi: "工作",
    pinyin: "gōngzuò",
    english: "work, job, to work",
    hsk_level: 1,
    examples: [
      { chinese: "他在公司工作。", english: "He works at a company.", pinyin: "tā zài gōng sī gōng zuò 。" },
      { chinese: "你的工作怎么样？", english: "How is your work?", pinyin: "nǐ de gōng zuò zěn me yàng ？" },
      { chinese: "我找到工作了。", english: "I found a job.", pinyin: "wǒ zhǎo dào gōng zuò le 。" },
    ],
  },
  {
    hanzi: "狗",
    pinyin: "gǒu",
    english: "dog",
    hsk_level: 1,
    examples: [
      { chinese: "我有一只狗。", english: "I have a dog.", pinyin: "wǒ yǒu yī zhī gǒu 。" },
      { chinese: "那只狗很大。", english: "That dog is very big.", pinyin: "nà zhī gǒu hěn dà 。" },
    ],
  },
  {
    hanzi: "汉语",
    pinyin: "Hànyǔ",
    english: "Chinese language, Mandarin",
    hsk_level: 1,
    examples: [
      { chinese: "我在学汉语。", english: "I am learning Chinese.", pinyin: "wǒ zài xué Hàn yǔ 。" },
      { chinese: "汉语很有意思。", english: "Chinese is very interesting.", pinyin: "Hàn yǔ hěn yǒu yì si 。" },
      { chinese: "你的汉语说得很好。", english: "Your Chinese is very good.", pinyin: "nǐ de Hàn yǔ shuō de hěn hǎo 。" },
    ],
  },
  {
    hanzi: "好",
    pinyin: "hǎo",
    english: "good, well, fine",
    hsk_level: 1,
    examples: [
      { chinese: "你好！", english: "Hello!", pinyin: "nǐ hǎo ！" },
      { chinese: "今天天气很好。", english: "The weather is nice today.", pinyin: "jīn tiān tiān qì hěn hǎo 。" },
      { chinese: "这本书很好。", english: "This book is very good.", pinyin: "zhè běn shū hěn hǎo 。" },
    ],
  },
  {
    hanzi: "喝",
    pinyin: "hē",
    english: "to drink",
    hsk_level: 1,
    examples: [
      { chinese: "我喜欢喝咖啡。", english: "I like to drink coffee.", pinyin: "wǒ xǐ huān hē kā fēi 。" },
      { chinese: "请喝水。", english: "Please drink some water.", pinyin: "qǐng hē shuǐ 。" },
    ],
  },
  {
    hanzi: "和",
    pinyin: "hé",
    english: "and, with, together with",
    hsk_level: 1,
    examples: [
      { chinese: "我和他是朋友。", english: "He and I are friends.", pinyin: "wǒ hé tā shì péng yǒu 。" },
      { chinese: "她和我一起去。", english: "She is going with me.", pinyin: "tā hé wǒ yī qǐ qù 。" },
    ],
  },
  {
    hanzi: "很",
    pinyin: "hěn",
    english: "very, quite",
    hsk_level: 1,
    examples: [
      { chinese: "我很好。", english: "I am very well.", pinyin: "wǒ hěn hǎo 。" },
      { chinese: "今天很冷。", english: "It is very cold today.", pinyin: "jīn tiān hěn lěng 。" },
    ],
  },
  {
    hanzi: "后面",
    pinyin: "hòumiàn",
    english: "behind, at the back",
    hsk_level: 1,
    examples: [
      { chinese: "他在我后面。", english: "He is behind me.", pinyin: "tā zài wǒ hòu miàn 。" },
      { chinese: "书在椅子后面。", english: "The book is behind the chair.", pinyin: "shū zài yǐ zi hòu miàn 。" },
    ],
  },
  {
    hanzi: "回",
    pinyin: "huí",
    english: "to return, to go back",
    hsk_level: 1,
    examples: [
      { chinese: "我要回家了。", english: "I'm going home.", pinyin: "wǒ yào huí jiā le 。" },
      { chinese: "他回来了。", english: "He came back.", pinyin: "tā huí lái le 。" },
    ],
  },
  {
    hanzi: "会",
    pinyin: "huì",
    english: "can, be able to, will",
    hsk_level: 1,
    examples: [
      { chinese: "我会说汉语。", english: "I can speak Chinese.", pinyin: "wǒ huì shuō Hàn yǔ 。" },
      { chinese: "他会游泳。", english: "He can swim.", pinyin: "tā huì yóu yǒng 。" },
      { chinese: "你会开车吗？", english: "Can you drive?", pinyin: "nǐ huì kāi chē ma ？" },
    ],
  },
  {
    hanzi: "机场",
    pinyin: "jīchǎng",
    english: "airport",
    hsk_level: 1,
    examples: [
      { chinese: "我去机场接她。", english: "I go to the airport to pick her up.", pinyin: "wǒ qù jī chǎng jiē tā 。" },
      { chinese: "机场离这里很远。", english: "The airport is far from here.", pinyin: "jī chǎng lí zhè lǐ hěn yuǎn 。" },
    ],
  },
  {
    hanzi: "鸡蛋",
    pinyin: "jīdàn",
    english: "egg (hen's egg)",
    hsk_level: 1,
    examples: [
      { chinese: "早上我吃鸡蛋。", english: "I eat eggs in the morning.", pinyin: "zǎo shàng wǒ chī jī dàn 。" },
      { chinese: "鸡蛋很有营养。", english: "Eggs are very nutritious.", pinyin: "jī dàn hěn yǒu yíng yǎng 。" },
    ],
  },
  {
    hanzi: "几",
    pinyin: "jǐ",
    english: "how many, several, a few",
    hsk_level: 1,
    examples: [
      { chinese: "你有几个孩子？", english: "How many children do you have?", pinyin: "nǐ yǒu jǐ gè hái zi ？" },
      { chinese: "现在几点？", english: "What time is it?", pinyin: "xiàn zài jǐ diǎn ？" },
    ],
  },
  {
    hanzi: "家",
    pinyin: "jiā",
    english: "home, family, house",
    hsk_level: 1,
    examples: [
      { chinese: "我在家。", english: "I am at home.", pinyin: "wǒ zài jiā 。" },
      { chinese: "你家在哪里？", english: "Where is your home?", pinyin: "nǐ jiā zài nǎ lǐ ？" },
      { chinese: "我们去他家吧。", english: "Let's go to his house.", pinyin: "wǒ men qù tā jiā ba 。" },
    ],
  },
  {
    hanzi: "今天",
    pinyin: "jīntiān",
    english: "today",
    hsk_level: 1,
    examples: [
      { chinese: "今天天气怎么样？", english: "How's the weather today?", pinyin: "jīn tiān tiān qì zěn me yàng ？" },
      { chinese: "今天是星期几？", english: "What day is it today?", pinyin: "jīn tiān shì xīng qī jǐ ？" },
      { chinese: "今天我很忙。", english: "I'm very busy today.", pinyin: "jīn tiān wǒ hěn máng 。" },
    ],
  },
  {
    hanzi: "看",
    pinyin: "kàn",
    english: "to look, to see, to watch, to read",
    hsk_level: 1,
    examples: [
      { chinese: "你看！", english: "Look!", pinyin: "nǐ kàn ！" },
      { chinese: "我看书。", english: "I read books.", pinyin: "wǒ kàn shū 。" },
      { chinese: "你看见他了吗？", english: "Did you see him?", pinyin: "nǐ kàn jiàn tā le ma ？" },
    ],
  },
  {
    hanzi: "来",
    pinyin: "lái",
    english: "to come",
    hsk_level: 1,
    examples: [
      { chinese: "他来了！", english: "He's here!", pinyin: "tā lái le ！" },
      { chinese: "请你来我家。", english: "Please come to my house.", pinyin: "qǐng nǐ lái wǒ jiā 。" },
      { chinese: "你从哪里来？", english: "Where are you from?", pinyin: "nǐ cóng nǎ lǐ lái ？" },
    ],
  },
  {
    hanzi: "老师",
    pinyin: "lǎoshī",
    english: "teacher",
    hsk_level: 1,
    examples: [
      { chinese: "她是我的老师。", english: "She is my teacher.", pinyin: "tā shì wǒ de lǎo shī 。" },
      { chinese: "老师好！", english: "Good morning, teacher!", pinyin: "lǎo shī hǎo ！" },
      { chinese: "老师让我们写作业。", english: "The teacher asked us to do homework.", pinyin: "lǎo shī ràng wǒ men xiě zuò yè 。" },
    ],
  },
  {
    hanzi: "了",
    pinyin: "le",
    english: "particle: completed action or new situation",
    hsk_level: 1,
    examples: [
      { chinese: "他走了。", english: "He left.", pinyin: "tā zǒu le 。" },
      { chinese: "我吃完了。", english: "I finished eating.", pinyin: "wǒ chī wán le 。" },
    ],
  },
  {
    hanzi: "冷",
    pinyin: "lěng",
    english: "cold",
    hsk_level: 1,
    examples: [
      { chinese: "今天很冷。", english: "It's very cold today.", pinyin: "jīn tiān hěn lěng 。" },
      { chinese: "冬天很冷。", english: "It's cold in winter.", pinyin: "dōng tiān hěn lěng 。" },
    ],
  },
  {
    hanzi: "里",
    pinyin: "lǐ",
    english: "inside, in, within",
    hsk_level: 1,
    examples: [
      { chinese: "书在包里。", english: "The book is in the bag.", pinyin: "shū zài bāo lǐ 。" },
      { chinese: "他在房间里。", english: "He is in the room.", pinyin: "tā zài fáng jiān lǐ 。" },
    ],
  },
  {
    hanzi: "六",
    pinyin: "liù",
    english: "six",
    hsk_level: 1,
    examples: [
      { chinese: "我六点起床。", english: "I get up at six o'clock.", pinyin: "wǒ liù diǎn qǐ chuáng 。" },
    ],
  },
  {
    hanzi: "妈妈",
    pinyin: "māma",
    english: "mother, mom",
    hsk_level: 1,
    examples: [
      { chinese: "妈妈在家吗？", english: "Is mom at home?", pinyin: "māo māo zài jiā ma ？" },
      { chinese: "妈妈做的菜最好吃。", english: "Mom's cooking is the most delicious.", pinyin: "māo māo zuò de cài zuì hǎo chī 。" },
      { chinese: "我爱我的妈妈。", english: "I love my mother.", pinyin: "wǒ ài wǒ de māo māo 。" },
    ],
  },
  {
    hanzi: "吗",
    pinyin: "ma",
    english: "question particle",
    hsk_level: 1,
    examples: [
      { chinese: "你是学生吗？", english: "Are you a student?", pinyin: "nǐ shì xué shēng ma ？" },
      { chinese: "你好吗？", english: "How are you?", pinyin: "nǐ hǎo ma ？" },
    ],
  },
  {
    hanzi: "猫",
    pinyin: "māo",
    english: "cat",
    hsk_level: 1,
    examples: [
      { chinese: "我有一只猫。", english: "I have a cat.", pinyin: "wǒ yǒu yī zhī māo 。" },
      { chinese: "猫在睡觉。", english: "The cat is sleeping.", pinyin: "māo zài shuì jiào 。" },
    ],
  },
  {
    hanzi: "没关系",
    pinyin: "méi guānxi",
    english: "it doesn't matter, never mind",
    hsk_level: 1,
    examples: [
      { chinese: "没关系，不用担心。", english: "Never mind, don't worry.", pinyin: "méi guān xi ， bú yòng dān xīn 。" },
      { chinese: "没关系，我来帮你。", english: "No worries, let me help you.", pinyin: "méi guān xi ， wǒ lái bāng nǐ 。" },
    ],
  },
  {
    hanzi: "没有",
    pinyin: "méiyǒu",
    english: "don't have, there is not",
    hsk_level: 1,
    examples: [
      { chinese: "我没有钱。", english: "I don't have money.", pinyin: "wǒ méi yǒu qián 。" },
      { chinese: "他没有来。", english: "He didn't come.", pinyin: "tā méi yǒu lái 。" },
    ],
  },
  {
    hanzi: "米饭",
    pinyin: "mǐfàn",
    english: "cooked rice",
    hsk_level: 1,
    examples: [
      { chinese: "我喜欢吃米饭。", english: "I like to eat rice.", pinyin: "wǒ xǐ huān chī mǐ fàn 。" },
      { chinese: "今天有米饭吗？", english: "Is there rice today?", pinyin: "jīn tiān yǒu mǐ fàn ma ？" },
    ],
  },
  {
    hanzi: "明天",
    pinyin: "míngtiān",
    english: "tomorrow",
    hsk_level: 1,
    examples: [
      { chinese: "明天见！", english: "See you tomorrow!", pinyin: "míng tiān jiàn ！" },
      { chinese: "明天你有空吗？", english: "Are you free tomorrow?", pinyin: "míng tiān nǐ yǒu kòng ma ？" },
      { chinese: "明天天气会好吗？", english: "Will the weather be good tomorrow?", pinyin: "míng tiān tiān qì huì hǎo ma ？" },
    ],
  },
  {
    hanzi: "名字",
    pinyin: "míngzi",
    english: "name",
    hsk_level: 1,
    examples: [
      { chinese: "你叫什么名字？", english: "What is your name?", pinyin: "nǐ jiào shén me míng zi ？" },
      { chinese: "我的名字是李明。", english: "My name is Li Ming.", pinyin: "wǒ de míng zi shì lǐ míng 。" },
    ],
  },
  {
    hanzi: "哪",
    pinyin: "nǎ",
    english: "which",
    hsk_level: 1,
    examples: [
      { chinese: "你是哪国人？", english: "What nationality are you?", pinyin: "nǐ shì nǎ guó rén ？" },
      { chinese: "哪个是你的？", english: "Which one is yours?", pinyin: "nǎ ge shì nǐ de ？" },
    ],
  },
  {
    hanzi: "哪儿",
    pinyin: "nǎr",
    english: "where",
    hsk_level: 1,
    examples: [
      { chinese: "你去哪儿？", english: "Where are you going?", pinyin: "nǐ qù nǎr ？" },
      { chinese: "厕所在哪儿？", english: "Where is the bathroom?", pinyin: "cè suǒ zài nǎr ？" },
    ],
  },
  {
    hanzi: "那",
    pinyin: "nà",
    english: "that",
    hsk_level: 1,
    examples: [
      { chinese: "那是什么？", english: "What is that?", pinyin: "nà shì shén me ？" },
      { chinese: "那个人是谁？", english: "Who is that person?", pinyin: "nà ge rén shì shuí ？" },
    ],
  },
  {
    hanzi: "呢",
    pinyin: "ne",
    english: "question particle (continuation)",
    hsk_level: 1,
    examples: [
      { chinese: "你好，你呢？", english: "I'm fine, and you?", pinyin: "nǐ hǎo ， nǐ ne ？" },
      { chinese: "我在这里，你呢？", english: "I'm here, where are you?", pinyin: "wǒ zài zhè lǐ ， nǐ ne ？" },
    ],
  },
  {
    hanzi: "能",
    pinyin: "néng",
    english: "can, to be able to",
    hsk_level: 1,
    examples: [
      { chinese: "我能帮你吗？", english: "Can I help you?", pinyin: "wǒ néng bāng nǐ ma ？" },
      { chinese: "你能来吗？", english: "Can you come?", pinyin: "nǐ néng lái ma ？" },
    ],
  },
  {
    hanzi: "你",
    pinyin: "nǐ",
    english: "you (singular)",
    hsk_level: 1,
    examples: [
      { chinese: "你好！", english: "Hello!", pinyin: "nǐ hǎo ！" },
      { chinese: "你叫什么名字？", english: "What is your name?", pinyin: "nǐ jiào shén me míng zi ？" },
      { chinese: "你是哪里人？", english: "Where are you from?", pinyin: "nǐ shì nǎ lǐ rén ？" },
    ],
  },
  {
    hanzi: "年",
    pinyin: "nián",
    english: "year",
    hsk_level: 1,
    examples: [
      { chinese: "今年是哪年？", english: "What year is it this year?", pinyin: "jīn nián shì nǎ nián ？" },
      { chinese: "我学了两年汉语。", english: "I have studied Chinese for two years.", pinyin: "wǒ xué le liǎng nián Hàn yǔ 。" },
    ],
  },
  {
    hanzi: "女儿",
    pinyin: "nǚér",
    english: "daughter",
    hsk_level: 1,
    examples: [
      { chinese: "她的女儿很漂亮。", english: "Her daughter is very pretty.", pinyin: "tā de nǚ ér hěn piào liàng 。" },
      { chinese: "我有一个女儿。", english: "I have a daughter.", pinyin: "wǒ yǒu yī gè nǚ ér 。" },
    ],
  },
  {
    hanzi: "朋友",
    pinyin: "péngyou",
    english: "friend",
    hsk_level: 1,
    examples: [
      { chinese: "他是我最好的朋友。", english: "He is my best friend.", pinyin: "tā shì wǒ zuì hǎo de péng yǒu 。" },
      { chinese: "我和朋友去看电影。", english: "I go to the movies with friends.", pinyin: "wǒ hé péng yǒu qù kàn diàn yǐng 。" },
      { chinese: "你有很多朋友吗？", english: "Do you have many friends?", pinyin: "nǐ yǒu hěn duō péng yǒu ma ？" },
    ],
  },
  {
    hanzi: "漂亮",
    pinyin: "piàoliang",
    english: "beautiful, pretty",
    hsk_level: 1,
    examples: [
      { chinese: "她很漂亮。", english: "She is very beautiful.", pinyin: "tā hěn piào liàng 。" },
      { chinese: "这件衣服很漂亮。", english: "This dress is very pretty.", pinyin: "zhè jiàn yī fú hěn piào liàng 。" },
    ],
  },
  {
    hanzi: "苹果",
    pinyin: "píngguǒ",
    english: "apple",
    hsk_level: 1,
    examples: [
      { chinese: "我喜欢吃苹果。", english: "I like to eat apples.", pinyin: "wǒ xǐ huān chī píng guǒ 。" },
      { chinese: "这个苹果很甜。", english: "This apple is very sweet.", pinyin: "zhè ge píng guǒ hěn tián 。" },
    ],
  },
  {
    hanzi: "七",
    pinyin: "qī",
    english: "seven",
    hsk_level: 1,
    examples: [
      { chinese: "我七点起床。", english: "I get up at seven o'clock.", pinyin: "wǒ qī diǎn qǐ chuáng 。" },
      { chinese: "一周有七天。", english: "There are seven days in a week.", pinyin: "yī zhōu yǒu qī tiān 。" },
    ],
  },
  {
    hanzi: "钱",
    pinyin: "qián",
    english: "money",
    hsk_level: 1,
    examples: [
      { chinese: "这个多少钱？", english: "How much does this cost?", pinyin: "zhè ge duō shǎo qián ？" },
      { chinese: "我没有钱了。", english: "I have no money left.", pinyin: "wǒ méi yǒu qián le 。" },
    ],
  },
  {
    hanzi: "去",
    pinyin: "qù",
    english: "to go",
    hsk_level: 1,
    examples: [
      { chinese: "我去学校。", english: "I go to school.", pinyin: "wǒ qù xué xiào 。" },
      { chinese: "你去哪儿？", english: "Where are you going?", pinyin: "nǐ qù nǎr ？" },
      { chinese: "我们去吃饭吧。", english: "Let's go eat.", pinyin: "wǒ men qù chī fàn ba 。" },
    ],
  },
  {
    hanzi: "热",
    pinyin: "rè",
    english: "hot",
    hsk_level: 1,
    examples: [
      { chinese: "今天很热。", english: "It's very hot today.", pinyin: "jīn tiān hěn rè 。" },
      { chinese: "这汤太热了。", english: "This soup is too hot.", pinyin: "zhè tāng tài rè le 。" },
    ],
  },
  {
    hanzi: "人",
    pinyin: "rén",
    english: "person, people",
    hsk_level: 1,
    examples: [
      { chinese: "那个人是谁？", english: "Who is that person?", pinyin: "nà ge rén shì shuí ？" },
      { chinese: "这里有很多人。", english: "There are many people here.", pinyin: "zhè lǐ yǒu hěn duō rén 。" },
    ],
  },
  {
    hanzi: "认识",
    pinyin: "rènshi",
    english: "to know (a person), to recognize",
    hsk_level: 1,
    examples: [
      { chinese: "认识你很高兴。", english: "Nice to meet you.", pinyin: "rèn shi nǐ hěn gāo xìng 。" },
      { chinese: "你认识他吗？", english: "Do you know him?", pinyin: "nǐ rèn shi tā ma ？" },
    ],
  },
  {
    hanzi: "日",
    pinyin: "rì",
    english: "day, date, sun",
    hsk_level: 1,
    examples: [
      { chinese: "今天几月几日？", english: "What's today's date?", pinyin: "jīn tiān jǐ yuè jǐ rì ？" },
    ],
  },
  {
    hanzi: "三",
    pinyin: "sān",
    english: "three",
    hsk_level: 1,
    examples: [
      { chinese: "我有三个孩子。", english: "I have three children.", pinyin: "wǒ yǒu sān gè hái zi 。" },
      { chinese: "三点见。", english: "See you at three o'clock.", pinyin: "sān diǎn jiàn 。" },
    ],
  },
  {
    hanzi: "商店",
    pinyin: "shāngdiàn",
    english: "shop, store",
    hsk_level: 1,
    examples: [
      { chinese: "商店几点开门？", english: "What time does the store open?", pinyin: "shāng diàn jǐ diǎn kāi mén ？" },
      { chinese: "我去商店买东西。", english: "I go to the store to buy things.", pinyin: "wǒ qù shāng diàn mǎi dōng xi 。" },
    ],
  },
  {
    hanzi: "上",
    pinyin: "shàng",
    english: "on top of, upper, to go up",
    hsk_level: 1,
    examples: [
      { chinese: "书在桌子上。", english: "The book is on the desk.", pinyin: "shū zài zhuō zi shàng 。" },
      { chinese: "我上楼了。", english: "I went upstairs.", pinyin: "wǒ shàng lóu le 。" },
    ],
  },
  {
    hanzi: "上午",
    pinyin: "shàngwǔ",
    english: "morning, before noon",
    hsk_level: 1,
    examples: [
      { chinese: "我上午有课。", english: "I have class in the morning.", pinyin: "wǒ shàng wǔ yǒu kè 。" },
      { chinese: "上午好！", english: "Good morning!", pinyin: "shàng wǔ hǎo ！" },
    ],
  },
  {
    hanzi: "少",
    pinyin: "shǎo",
    english: "few, little, less",
    hsk_level: 1,
    examples: [
      { chinese: "这里的人很少。", english: "There are very few people here.", pinyin: "zhè lǐ de rén hěn shǎo 。" },
      { chinese: "请少放盐。", english: "Please add less salt.", pinyin: "qǐng shǎo fàng yán 。" },
    ],
  },
  {
    hanzi: "谁",
    pinyin: "shuí",
    english: "who, whom",
    hsk_level: 1,
    examples: [
      { chinese: "那个人是谁？", english: "Who is that person?", pinyin: "nà ge rén shì shuí ？" },
      { chinese: "你找谁？", english: "Who are you looking for?", pinyin: "nǐ zhǎo shuí ？" },
    ],
  },
  {
    hanzi: "说",
    pinyin: "shuō",
    english: "to say, to speak",
    hsk_level: 1,
    examples: [
      { chinese: "他说汉语。", english: "He speaks Chinese.", pinyin: "tā shuō Hàn yǔ 。" },
      { chinese: "你说什么？", english: "What did you say?", pinyin: "nǐ shuō shén me ？" },
      { chinese: "请慢慢说。", english: "Please speak slowly.", pinyin: "qǐng màn màn shuō 。" },
    ],
  },
  {
    hanzi: "水",
    pinyin: "shuǐ",
    english: "water",
    hsk_level: 1,
    examples: [
      { chinese: "请给我一杯水。", english: "Please give me a glass of water.", pinyin: "qǐng gěi wǒ yī bēi shuǐ 。" },
      { chinese: "我想喝水。", english: "I want to drink water.", pinyin: "wǒ xiǎng hē shuǐ 。" },
    ],
  },
  {
    hanzi: "水果",
    pinyin: "shuǐguǒ",
    english: "fruit",
    hsk_level: 1,
    examples: [
      { chinese: "我喜欢吃水果。", english: "I like to eat fruit.", pinyin: "wǒ xǐ huān chī shuǐ guǒ 。" },
      { chinese: "你喜欢什么水果？", english: "What fruit do you like?", pinyin: "nǐ xǐ huān shén me shuǐ guǒ ？" },
    ],
  },
  {
    hanzi: "睡觉",
    pinyin: "shuì jiào",
    english: "to sleep, to go to bed",
    hsk_level: 1,
    examples: [
      { chinese: "我要睡觉了。", english: "I'm going to sleep.", pinyin: "wǒ yào shuì jiào le 。" },
      { chinese: "你几点睡觉？", english: "What time do you go to bed?", pinyin: "nǐ jǐ diǎn shuì jiào ？" },
    ],
  },
  {
    hanzi: "四",
    pinyin: "sì",
    english: "four",
    hsk_level: 1,
    examples: [
      { chinese: "我家有四口人。", english: "There are four people in my family.", pinyin: "wǒ jiā yǒu sì kǒu rén 。" },
    ],
  },
  {
    hanzi: "岁",
    pinyin: "suì",
    english: "years old (age)",
    hsk_level: 1,
    examples: [
      { chinese: "我二十五岁。", english: "I am twenty-five years old.", pinyin: "wǒ èr shí wǔ suì 。" },
      { chinese: "你多大了？", english: "How old are you?", pinyin: "nǐ duō dà le ？" },
    ],
  },
  {
    hanzi: "他",
    pinyin: "tā",
    english: "he, him",
    hsk_level: 1,
    examples: [
      { chinese: "他是我的朋友。", english: "He is my friend.", pinyin: "tā shì wǒ de péng yǒu 。" },
      { chinese: "他从哪里来？", english: "Where does he come from?", pinyin: "tā cóng nǎ lǐ lái ？" },
    ],
  },
  {
    hanzi: "她",
    pinyin: "tā",
    english: "she, her",
    hsk_level: 1,
    examples: [
      { chinese: "她是我的老师。", english: "She is my teacher.", pinyin: "tā shì wǒ de lǎo shī 。" },
      { chinese: "她叫什么名字？", english: "What is her name?", pinyin: "tā jiào shén me míng zi ？" },
    ],
  },
  {
    hanzi: "太",
    pinyin: "tài",
    english: "too, excessively",
    hsk_level: 1,
    examples: [
      { chinese: "今天太热了！", english: "It's too hot today!", pinyin: "jīn tiān tài rè le ！" },
      { chinese: "这个太贵了。", english: "This is too expensive.", pinyin: "zhè ge tài guì le 。" },
    ],
  },
  {
    hanzi: "天气",
    pinyin: "tiānqì",
    english: "weather",
    hsk_level: 1,
    examples: [
      { chinese: "今天天气怎么样？", english: "How's the weather today?", pinyin: "jīn tiān tiān qì zěn me yàng ？" },
      { chinese: "今天天气很好。", english: "The weather is great today.", pinyin: "jīn tiān tiān qì hěn hǎo 。" },
    ],
  },
  {
    hanzi: "听",
    pinyin: "tīng",
    english: "to listen, to hear",
    hsk_level: 1,
    examples: [
      { chinese: "请听我说。", english: "Please listen to me.", pinyin: "qǐng tīng wǒ shuō 。" },
      { chinese: "我喜欢听音乐。", english: "I like to listen to music.", pinyin: "wǒ xǐ huān tīng yīn yuè 。" },
    ],
  },
  {
    hanzi: "同学",
    pinyin: "tóngxué",
    english: "classmate, schoolmate",
    hsk_level: 1,
    examples: [
      { chinese: "他是我的同学。", english: "He is my classmate.", pinyin: "tā shì wǒ de tóng xué 。" },
      { chinese: "我和同学一起学习。", english: "I study with my classmates.", pinyin: "wǒ hé tóng xué yī qǐ xué xí 。" },
    ],
  },
  {
    hanzi: "喂",
    pinyin: "wèi",
    english: "hello (on phone), hey",
    hsk_level: 1,
    examples: [
      { chinese: "喂，你好！", english: "Hello!", pinyin: "wèi ， nǐ hǎo ！" },
      { chinese: "喂，请问李先生在吗？", english: "Hello, is Mr. Li there?", pinyin: "wèi ， qǐng wèn lǐ xiān shēng zài ma ？" },
    ],
  },
  {
    hanzi: "我",
    pinyin: "wǒ",
    english: "I, me",
    hsk_level: 1,
    examples: [
      { chinese: "我是学生。", english: "I am a student.", pinyin: "wǒ shì xué shēng 。" },
      { chinese: "我喜欢学汉语。", english: "I like to learn Chinese.", pinyin: "wǒ xǐ huān xué Hàn yǔ 。" },
      { chinese: "我叫李明。", english: "My name is Li Ming.", pinyin: "wǒ jiào lǐ míng 。" },
    ],
  },
  {
    hanzi: "我们",
    pinyin: "wǒmen",
    english: "we, us",
    hsk_level: 1,
    examples: [
      { chinese: "我们是朋友。", english: "We are friends.", pinyin: "wǒ men shì péng yǒu 。" },
      { chinese: "我们一起去吧。", english: "Let's go together.", pinyin: "wǒ men yī qǐ qù ba 。" },
    ],
  },
  {
    hanzi: "五",
    pinyin: "wǔ",
    english: "five",
    hsk_level: 1,
    examples: [
      { chinese: "我家有五口人。", english: "There are five people in my family.", pinyin: "wǒ jiā yǒu wǔ kǒu rén 。" },
    ],
  },
  {
    hanzi: "下午",
    pinyin: "xiàwǔ",
    english: "afternoon",
    hsk_level: 1,
    examples: [
      { chinese: "下午好！", english: "Good afternoon!", pinyin: "xià wǔ hǎo ！" },
      { chinese: "我下午有课。", english: "I have class in the afternoon.", pinyin: "wǒ xià wǔ yǒu kè 。" },
    ],
  },
  {
    hanzi: "下雨",
    pinyin: "xià yǔ",
    english: "to rain",
    hsk_level: 1,
    examples: [
      { chinese: "今天下雨了。", english: "It's raining today.", pinyin: "jīn tiān xià yǔ le 。" },
      { chinese: "明天会下雨吗？", english: "Will it rain tomorrow?", pinyin: "míng tiān huì xià yǔ ma ？" },
    ],
  },
  {
    hanzi: "先生",
    pinyin: "xiānshēng",
    english: "Mr., husband, teacher, sir",
    hsk_level: 1,
    examples: [
      { chinese: "李先生是我的老师。", english: "Mr. Li is my teacher.", pinyin: "lǐ xiān shēng shì wǒ de lǎo shī 。" },
      { chinese: "请问，您是李先生吗？", english: "Excuse me, are you Mr. Li?", pinyin: "qǐng wèn ， nín shì lǐ xiān shēng ma ？" },
    ],
  },
  {
    hanzi: "现在",
    pinyin: "xiànzài",
    english: "now, at present",
    hsk_level: 1,
    examples: [
      { chinese: "现在几点了？", english: "What time is it now?", pinyin: "xiàn zài jǐ diǎn le ？" },
      { chinese: "我现在很忙。", english: "I'm very busy now.", pinyin: "wǒ xiàn zài hěn máng 。" },
      { chinese: "现在天气怎么样？", english: "What's the weather like now?", pinyin: "xiàn zài tiān qì zěn me yàng ？" },
    ],
  },
  {
    hanzi: "想",
    pinyin: "xiǎng",
    english: "to want to, to think, to miss",
    hsk_level: 1,
    examples: [
      { chinese: "我想喝水。", english: "I want to drink water.", pinyin: "wǒ xiǎng hē shuǐ 。" },
      { chinese: "我想家了。", english: "I miss home.", pinyin: "wǒ xiǎng jiā le 。" },
      { chinese: "你想吃什么？", english: "What do you want to eat?", pinyin: "nǐ xiǎng chī shén me ？" },
    ],
  },
  {
    hanzi: "小",
    pinyin: "xiǎo",
    english: "small, little, young",
    hsk_level: 1,
    examples: [
      { chinese: "这只猫很小。", english: "This cat is very small.", pinyin: "zhè zhī māo hěn xiǎo 。" },
      { chinese: "这个房间太小了。", english: "This room is too small.", pinyin: "zhè ge fáng jiān tài xiǎo le 。" },
    ],
  },
  {
    hanzi: "小姐",
    pinyin: "xiǎojiě",
    english: "Miss, young lady",
    hsk_level: 1,
    examples: [
      { chinese: "请问，小姐，厕所在哪里？", english: "Excuse me, miss, where is the restroom?", pinyin: "qǐng wèn ， xiǎo jiě ， cè suǒ zài nǎ lǐ ？" },
    ],
  },
  {
    hanzi: "些",
    pinyin: "xiē",
    english: "some, a few (measure word)",
    hsk_level: 1,
    examples: [
      { chinese: "我想买些水果。", english: "I want to buy some fruit.", pinyin: "wǒ xiǎng mǎi xiē shuǐ guǒ 。" },
      { chinese: "请给我一些水。", english: "Please give me some water.", pinyin: "qǐng gěi wǒ yī xiē shuǐ 。" },
    ],
  },
  {
    hanzi: "谢谢",
    pinyin: "xièxiè",
    english: "thank you",
    hsk_level: 1,
    examples: [
      { chinese: "谢谢你！", english: "Thank you!", pinyin: "xiè xiè nǐ ！" },
      { chinese: "非常感谢！", english: "Many thanks!", pinyin: "fēi cháng gǎn xiè ！" },
      { chinese: "谢谢你的帮助。", english: "Thank you for your help.", pinyin: "xiè xiè nǐ de bāng zhù 。" },
    ],
  },
  {
    hanzi: "星期",
    pinyin: "xīngqī",
    english: "week, day of the week",
    hsk_level: 1,
    examples: [
      { chinese: "今天星期几？", english: "What day of the week is it?", pinyin: "jīn tiān xīng qī jǐ ？" },
      { chinese: "我星期一有课。", english: "I have class on Monday.", pinyin: "wǒ xīng qī yī yǒu kè 。" },
    ],
  },
  {
    hanzi: "学生",
    pinyin: "xuéshēng",
    english: "student",
    hsk_level: 1,
    examples: [
      { chinese: "我是大学生。", english: "I am a university student.", pinyin: "wǒ shì dà xué shēng 。" },
      { chinese: "他们都是学生。", english: "They are all students.", pinyin: "tā men dōu shì xué shēng 。" },
    ],
  },
  {
    hanzi: "学习",
    pinyin: "xuéxí",
    english: "to study, to learn",
    hsk_level: 1,
    examples: [
      { chinese: "我每天学习汉语。", english: "I study Chinese every day.", pinyin: "wǒ měi tiān xué xí Hàn yǔ 。" },
      { chinese: "学习很重要。", english: "Studying is very important.", pinyin: "xué xí hěn zhòng yào 。" },
    ],
  },
  {
    hanzi: "学校",
    pinyin: "xuéxiào",
    english: "school",
    hsk_level: 1,
    examples: [
      { chinese: "我去学校上课。", english: "I go to school for class.", pinyin: "wǒ qù xué xiào shàng kè 。" },
      { chinese: "学校在哪里？", english: "Where is the school?", pinyin: "xué xiào zài nǎ lǐ ？" },
    ],
  },
  {
    hanzi: "一",
    pinyin: "yī",
    english: "one",
    hsk_level: 1,
    examples: [
      { chinese: "我有一个苹果。", english: "I have one apple.", pinyin: "wǒ yǒu yī gè píng guǒ 。" },
      { chinese: "一加一等于二。", english: "One plus one equals two.", pinyin: "yī jiā yī děng yú èr 。" },
    ],
  },
  {
    hanzi: "一起",
    pinyin: "yīqǐ",
    english: "together",
    hsk_level: 1,
    examples: [
      { chinese: "我们一起去吧！", english: "Let's go together!", pinyin: "wǒ men yī qǐ qù ba ！" },
      { chinese: "一起学习吧。", english: "Let's study together.", pinyin: "yī qǐ xué xí ba 。" },
    ],
  },
  {
    hanzi: "医生",
    pinyin: "yīshēng",
    english: "doctor, physician",
    hsk_level: 1,
    examples: [
      { chinese: "我爸爸是医生。", english: "My father is a doctor.", pinyin: "wǒ bà ba shì yī shēng 。" },
      { chinese: "你要去看医生。", english: "You should see a doctor.", pinyin: "nǐ yào qù kàn yī shēng 。" },
    ],
  },
  {
    hanzi: "医院",
    pinyin: "yīyuàn",
    english: "hospital",
    hsk_level: 1,
    examples: [
      { chinese: "我去医院看病。", english: "I go to the hospital to see a doctor.", pinyin: "wǒ qù yī yuàn kàn bìng 。" },
      { chinese: "医院在哪里？", english: "Where is the hospital?", pinyin: "yī yuàn zài nǎ lǐ ？" },
    ],
  },
  {
    hanzi: "椅子",
    pinyin: "yǐzi",
    english: "chair",
    hsk_level: 1,
    examples: [
      { chinese: "请坐椅子。", english: "Please sit on the chair.", pinyin: "qǐng zuò yǐ zi 。" },
      { chinese: "这把椅子很舒服。", english: "This chair is very comfortable.", pinyin: "zhè bǎ yǐ zi hěn shū fú 。" },
    ],
  },
  {
    hanzi: "有",
    pinyin: "yǒu",
    english: "to have, there is/are",
    hsk_level: 1,
    examples: [
      { chinese: "我有一个弟弟。", english: "I have a younger brother.", pinyin: "wǒ yǒu yī gè dì di 。" },
      { chinese: "这里有书店吗？", english: "Is there a bookstore here?", pinyin: "zhè lǐ yǒu shū diàn ma ？" },
      { chinese: "你有问题吗？", english: "Do you have any questions?", pinyin: "nǐ yǒu wèn tí ma ？" },
    ],
  },
  {
    hanzi: "月",
    pinyin: "yuè",
    english: "month, moon",
    hsk_level: 1,
    examples: [
      { chinese: "一年有十二个月。", english: "There are twelve months in a year.", pinyin: "yī nián yǒu shí èr gè yuè 。" },
      { chinese: "今天几月几日？", english: "What's today's date?", pinyin: "jīn tiān jǐ yuè jǐ rì ？" },
    ],
  },
  {
    hanzi: "再见",
    pinyin: "zàijiàn",
    english: "goodbye, see you again",
    hsk_level: 1,
    examples: [
      { chinese: "再见！", english: "Goodbye!", pinyin: "zài jiàn ！" },
      { chinese: "明天再见！", english: "See you tomorrow!", pinyin: "míng tiān zài jiàn ！" },
    ],
  },
  {
    hanzi: "在",
    pinyin: "zài",
    english: "at, in, on (location), to be at",
    hsk_level: 1,
    examples: [
      { chinese: "我在学校。", english: "I am at school.", pinyin: "wǒ zài xué xiào 。" },
      { chinese: "书在桌子上。", english: "The book is on the desk.", pinyin: "shū zài zhuō zi shàng 。" },
      { chinese: "他在家吗？", english: "Is he at home?", pinyin: "tā zài jiā ma ？" },
    ],
  },
  {
    hanzi: "怎么",
    pinyin: "zěnme",
    english: "how, why",
    hsk_level: 1,
    examples: [
      { chinese: "这个怎么说？", english: "How do you say this?", pinyin: "zhè ge zěn me shuō ？" },
      { chinese: "怎么去机场？", english: "How do I get to the airport?", pinyin: "zěn me qù jī chǎng ？" },
    ],
  },
  {
    hanzi: "怎么样",
    pinyin: "zěnmeyàng",
    english: "how is it, what do you think",
    hsk_level: 1,
    examples: [
      { chinese: "你身体怎么样？", english: "How is your health?", pinyin: "nǐ shēn tǐ zěn me yàng ？" },
      { chinese: "今天天气怎么样？", english: "How's the weather today?", pinyin: "jīn tiān tiān qì zěn me yàng ？" },
    ],
  },
  {
    hanzi: "这",
    pinyin: "zhè",
    english: "this",
    hsk_level: 1,
    examples: [
      { chinese: "这是什么？", english: "What is this?", pinyin: "zhè shì shén me ？" },
      { chinese: "这是我的书。", english: "This is my book.", pinyin: "zhè shì wǒ de shū 。" },
    ],
  },
  {
    hanzi: "中国",
    pinyin: "Zhōngguó",
    english: "China",
    hsk_level: 1,
    examples: [
      { chinese: "我在中国学习汉语。", english: "I study Chinese in China.", pinyin: "wǒ zài zhōng guó xué xí Hàn yǔ 。" },
      { chinese: "中国有很多美丽的地方。", english: "China has many beautiful places.", pinyin: "zhōng guó yǒu hěn duō měi lì de dì fāng 。" },
    ],
  },
  {
    hanzi: "住",
    pinyin: "zhù",
    english: "to live, to reside, to stay",
    hsk_level: 1,
    examples: [
      { chinese: "你住在哪里？", english: "Where do you live?", pinyin: "nǐ zhù zài nǎ lǐ ？" },
      { chinese: "我住在北京。", english: "I live in Beijing.", pinyin: "wǒ zhù zài Běi jīng 。" },
    ],
  },
  {
    hanzi: "字",
    pinyin: "zì",
    english: "character, word, letter",
    hsk_level: 1,
    examples: [
      { chinese: "这个字怎么写？", english: "How do you write this character?", pinyin: "zhè ge zì zěn me xiě ？" },
      { chinese: "我不认识这个字。", english: "I don't know this character.", pinyin: "wǒ bù rèn shi zhè ge zì 。" },
    ],
  },
  {
    hanzi: "昨天",
    pinyin: "zuótiān",
    english: "yesterday",
    hsk_level: 1,
    examples: [
      { chinese: "昨天天气很好。", english: "The weather was nice yesterday.", pinyin: "zuó tiān tiān qì hěn hǎo 。" },
      { chinese: "昨天我去看电影了。", english: "Yesterday I went to see a movie.", pinyin: "zuó tiān wǒ qù kàn diàn yǐng le 。" },
    ],
  },
  // ── HSK 2 samples ────────────────────────────────────────────────────────────
  {
    hanzi: "把",
    pinyin: "bǎ",
    english: "to hold, handle (disposal verb marker)",
    hsk_level: 2,
    examples: [
      { chinese: "请把书给我。", english: "Please give me the book.", pinyin: "qǐng bǎ shū gěi wǒ 。" },
      { chinese: "我把作业做完了。", english: "I finished the homework.", pinyin: "wǒ bǎ zuò yè zuò wán le 。" },
    ],
  },
  {
    hanzi: "比",
    pinyin: "bǐ",
    english: "to compare, than",
    hsk_level: 2,
    examples: [
      { chinese: "今天比昨天冷。", english: "Today is colder than yesterday.", pinyin: "jīn tiān bǐ zuó tiān lěng 。" },
      { chinese: "他比我高。", english: "He is taller than me.", pinyin: "tā bǐ wǒ gāo 。" },
    ],
  },
  {
    hanzi: "别",
    pinyin: "bié",
    english: "don't, other",
    hsk_level: 2,
    examples: [
      { chinese: "别担心！", english: "Don't worry!", pinyin: "bié dān xīn ！" },
      { chinese: "别说话！", english: "Don't talk!", pinyin: "bié shuō huà ！" },
    ],
  },
  {
    hanzi: "宾馆",
    pinyin: "bīnguǎn",
    english: "hotel, guesthouse",
    hsk_level: 2,
    examples: [
      { chinese: "我住在宾馆。", english: "I'm staying at a hotel.", pinyin: "wǒ zhù zài bīn guǎn 。" },
      { chinese: "这家宾馆很贵。", english: "This hotel is very expensive.", pinyin: "zhè jiā bīn guǎn hěn guì 。" },
    ],
  },
  {
    hanzi: "长",
    pinyin: "cháng",
    english: "long",
    hsk_level: 2,
    examples: [
      { chinese: "这条路很长。", english: "This road is very long.", pinyin: "zhè tiáo lù hěn cháng 。" },
      { chinese: "她的头发很长。", english: "Her hair is very long.", pinyin: "tā de tóu fā hěn cháng 。" },
    ],
  },
  {
    hanzi: "超市",
    pinyin: "chāoshì",
    english: "supermarket",
    hsk_level: 2,
    examples: [
      { chinese: "我去超市买东西。", english: "I go to the supermarket to buy things.", pinyin: "wǒ qù chāo shì mǎi dōng xi 。" },
      { chinese: "超市在哪里？", english: "Where is the supermarket?", pinyin: "chāo shì zài nǎ lǐ ？" },
    ],
  },
  {
    hanzi: "聪明",
    pinyin: "cōngmíng",
    english: "smart, clever, intelligent",
    hsk_level: 2,
    examples: [
      { chinese: "你真聪明！", english: "You're so clever!", pinyin: "nǐ zhēn cōng míng ！" },
      { chinese: "她的孩子很聪明。", english: "Her child is very smart.", pinyin: "tā de hái zi hěn cōng míng 。" },
    ],
  },
  {
    hanzi: "从",
    pinyin: "cóng",
    english: "from, since",
    hsk_level: 2,
    examples: [
      { chinese: "我从北京来。", english: "I come from Beijing.", pinyin: "wǒ cóng Běi jīng lái 。" },
      { chinese: "从这里到学校要多久？", english: "How long from here to school?", pinyin: "cóng zhè lǐ dào xué xiào yào duō jiǔ ？" },
    ],
  },
  {
    hanzi: "担心",
    pinyin: "dānxīn",
    english: "to worry, to be concerned about",
    hsk_level: 2,
    examples: [
      { chinese: "别担心，没问题。", english: "Don't worry, no problem.", pinyin: "bié dān xīn ， méi wèn tí 。" },
      { chinese: "我很担心你。", english: "I'm very worried about you.", pinyin: "wǒ hěn dān xīn nǐ 。" },
    ],
  },
  {
    hanzi: "蛋糕",
    pinyin: "dàngāo",
    english: "cake",
    hsk_level: 2,
    examples: [
      { chinese: "她做的蛋糕很好吃。", english: "The cake she made is delicious.", pinyin: "tā zuò de dàn gāo hěn hǎo chī 。" },
      { chinese: "生日快乐！吃蛋糕吧。", english: "Happy birthday! Let's eat cake.", pinyin: "shēng rì kuài lè ！ chī dàn gāo ba 。" },
    ],
  },
  {
    hanzi: "当然",
    pinyin: "dāngrán",
    english: "of course, certainly, naturally",
    hsk_level: 2,
    examples: [
      { chinese: "当然可以！", english: "Of course you can!", pinyin: "dāng rán kě yǐ ！" },
      { chinese: "这当然是对的。", english: "This is certainly correct.", pinyin: "zhè dāng rán shì duì de 。" },
    ],
  },
  {
    hanzi: "地方",
    pinyin: "dìfāng",
    english: "place, location, area",
    hsk_level: 2,
    examples: [
      { chinese: "这个地方很漂亮。", english: "This place is very beautiful.", pinyin: "zhè ge dì fāng hěn piào liàng 。" },
      { chinese: "你知道这个地方吗？", english: "Do you know this place?", pinyin: "nǐ zhī dào zhè ge dì fāng ma ？" },
    ],
  },
  {
    hanzi: "方便",
    pinyin: "fāngbiàn",
    english: "convenient, handy",
    hsk_level: 2,
    examples: [
      { chinese: "这里交通很方便。", english: "Transportation here is very convenient.", pinyin: "zhè lǐ jiāo tōng hěn fāng biàn 。" },
      { chinese: "坐地铁很方便。", english: "Taking the subway is very convenient.", pinyin: "zuò dì tiě hěn fāng biàn 。" },
    ],
  },
  {
    hanzi: "放",
    pinyin: "fàng",
    english: "to put, to place, to release",
    hsk_level: 2,
    examples: [
      { chinese: "请把书放在桌子上。", english: "Please put the book on the table.", pinyin: "qǐng bǎ shū fàng zài zhuō zi shàng 。" },
      { chinese: "放学了！", english: "School is out!", pinyin: "fàng xué le ！" },
    ],
  },
  {
    hanzi: "附近",
    pinyin: "fùjìn",
    english: "nearby, in the vicinity",
    hsk_level: 2,
    examples: [
      { chinese: "学校附近有超市吗？", english: "Is there a supermarket near the school?", pinyin: "xué xiào fù jìn yǒu chāo shì ma ？" },
      { chinese: "我家附近有公园。", english: "There is a park near my home.", pinyin: "wǒ jiā fù jìn yǒu gōng yuán 。" },
    ],
  },
  {
    hanzi: "复习",
    pinyin: "fùxí",
    english: "to review, to revise",
    hsk_level: 2,
    examples: [
      { chinese: "考试前要复习。", english: "You should review before the exam.", pinyin: "kǎo shì qián yào fù xí 。" },
      { chinese: "我每天复习汉语。", english: "I review Chinese every day.", pinyin: "wǒ měi tiān fù xí Hàn yǔ 。" },
    ],
  },
  {
    hanzi: "刚才",
    pinyin: "gāngcái",
    english: "just now, a moment ago",
    hsk_level: 2,
    examples: [
      { chinese: "他刚才在这里。", english: "He was here just now.", pinyin: "tā gāng cái zài zhè lǐ 。" },
      { chinese: "你刚才说什么？", english: "What did you just say?", pinyin: "nǐ gāng cái shuō shén me ？" },
    ],
  },
  {
    hanzi: "告诉",
    pinyin: "gàosu",
    english: "to tell, to inform",
    hsk_level: 2,
    examples: [
      { chinese: "请告诉我答案。", english: "Please tell me the answer.", pinyin: "qǐng gào su wǒ dá àn 。" },
      { chinese: "他告诉我这个消息。", english: "He told me this news.", pinyin: "tā gào su wǒ zhè ge xiāo xi 。" },
    ],
  },
  {
    hanzi: "哥哥",
    pinyin: "gēge",
    english: "older brother",
    hsk_level: 2,
    examples: [
      { chinese: "我哥哥比我大三岁。", english: "My older brother is three years older than me.", pinyin: "wǒ gē ge bǐ wǒ dà sān suì 。" },
      { chinese: "我哥哥是医生。", english: "My older brother is a doctor.", pinyin: "wǒ gē ge shì yī shēng 。" },
    ],
  },
  {
    hanzi: "给",
    pinyin: "gěi",
    english: "to give, for, to",
    hsk_level: 2,
    examples: [
      { chinese: "请给我一杯水。", english: "Please give me a glass of water.", pinyin: "qǐng gěi wǒ yī bēi shuǐ 。" },
      { chinese: "我给他打电话。", english: "I'll call him.", pinyin: "wǒ gěi tā dǎ diàn huà 。" },
    ],
  },
  {
    hanzi: "跟",
    pinyin: "gēn",
    english: "with, and, to follow",
    hsk_level: 2,
    examples: [
      { chinese: "我跟朋友一起去。", english: "I'm going with my friend.", pinyin: "wǒ gēn péng yǒu yī qǐ qù 。" },
      { chinese: "我跟你说。", english: "Let me tell you.", pinyin: "wǒ gēn nǐ shuō 。" },
    ],
  },
  {
    hanzi: "公共汽车",
    pinyin: "gōnggòng qìchē",
    english: "bus, public bus",
    hsk_level: 2,
    examples: [
      { chinese: "我坐公共汽车上班。", english: "I take the bus to work.", pinyin: "wǒ zuò gōng gòng qì chē shàng bān 。" },
      { chinese: "公共汽车站在哪里？", english: "Where is the bus stop?", pinyin: "gōng gòng qì chē zhàn zài nǎ lǐ ？" },
    ],
  },
  {
    hanzi: "公司",
    pinyin: "gōngsī",
    english: "company, corporation, firm",
    hsk_level: 2,
    examples: [
      { chinese: "他在一家大公司工作。", english: "He works at a large company.", pinyin: "tā zài yī jiā dà gōng sī gōng zuò 。" },
      { chinese: "公司在哪里？", english: "Where is the company?", pinyin: "gōng sī zài nǎ lǐ ？" },
    ],
  },
  {
    hanzi: "贵",
    pinyin: "guì",
    english: "expensive, honorable",
    hsk_level: 2,
    examples: [
      { chinese: "这个太贵了。", english: "This is too expensive.", pinyin: "zhè ge tài guì le 。" },
      { chinese: "这里的东西很贵。", english: "Things here are very expensive.", pinyin: "zhè lǐ de dōng xi hěn guì 。" },
    ],
  },
  {
    hanzi: "过",
    pinyin: "guò",
    english: "to pass, to spend (time), experiential aspect marker",
    hsk_level: 2,
    examples: [
      { chinese: "你去过北京吗？", english: "Have you been to Beijing?", pinyin: "nǐ qù guò Běi jīng ma ？" },
      { chinese: "时间过得很快。", english: "Time passes very quickly.", pinyin: "shí jiān guò de hěn kuài 。" },
    ],
  },
  {
    hanzi: "还是",
    pinyin: "háishi",
    english: "or (in questions), still, had better",
    hsk_level: 2,
    examples: [
      { chinese: "你喝茶还是喝咖啡？", english: "Do you want tea or coffee?", pinyin: "nǐ hē chá hái shi hē kā fēi ？" },
      { chinese: "你还是早点去吧。", english: "You'd better go early.", pinyin: "nǐ hái shi zǎo diǎn qù ba 。" },
    ],
  },
  {
    hanzi: "孩子",
    pinyin: "háizi",
    english: "child, children",
    hsk_level: 2,
    examples: [
      { chinese: "孩子们在公园里玩。", english: "The children are playing in the park.", pinyin: "hái zi men zài gōng yuán lǐ wán 。" },
      { chinese: "你有几个孩子？", english: "How many children do you have?", pinyin: "nǐ yǒu jǐ gè hái zi ？" },
    ],
  },
  {
    hanzi: "黑板",
    pinyin: "hēibǎn",
    english: "blackboard",
    hsk_level: 2,
    examples: [
      { chinese: "老师在黑板上写字。", english: "The teacher writes on the blackboard.", pinyin: "lǎo shī zài hēi bǎn shàng xiě zì 。" },
    ],
  },
  {
    hanzi: "护照",
    pinyin: "hùzhào",
    english: "passport",
    hsk_level: 2,
    examples: [
      { chinese: "我找不到我的护照。", english: "I can't find my passport.", pinyin: "wǒ zhǎo bù dào wǒ de hù zhào 。" },
      { chinese: "出国需要护照。", english: "You need a passport to go abroad.", pinyin: "chū guó xū yào hù zhào 。" },
    ],
  },
  {
    hanzi: "花",
    pinyin: "huā",
    english: "flower, to spend",
    hsk_level: 2,
    examples: [
      { chinese: "这朵花很漂亮。", english: "This flower is very pretty.", pinyin: "zhè duǒ huā hěn piào liàng 。" },
      { chinese: "我花了很多钱。", english: "I spent a lot of money.", pinyin: "wǒ huā le hěn duō qián 。" },
    ],
  },
  {
    hanzi: "欢迎",
    pinyin: "huānyíng",
    english: "to welcome, welcome",
    hsk_level: 2,
    examples: [
      { chinese: "欢迎来中国！", english: "Welcome to China!", pinyin: "huān yíng lái Zhōng guó ！" },
      { chinese: "欢迎您！", english: "Welcome!", pinyin: "huān yíng nín ！" },
    ],
  },
  {
    hanzi: "还",
    pinyin: "hái",
    english: "still, yet, also, in addition",
    hsk_level: 2,
    examples: [
      { chinese: "他还没来。", english: "He hasn't come yet.", pinyin: "tā hái méi lái 。" },
      { chinese: "我还有一个问题。", english: "I have one more question.", pinyin: "wǒ hái yǒu yī gè wèn tí 。" },
    ],
  },
  {
    hanzi: "觉得",
    pinyin: "juéde",
    english: "to feel, to think, to consider",
    hsk_level: 2,
    examples: [
      { chinese: "我觉得很累。", english: "I feel very tired.", pinyin: "wǒ jué de hěn lèi 。" },
      { chinese: "你觉得怎么样？", english: "How do you feel about it?", pinyin: "nǐ jué de zěn me yàng ？" },
      { chinese: "我觉得这个主意很好。", english: "I think this idea is great.", pinyin: "wǒ jué de zhè ge zhǔ yi hěn hǎo 。" },
    ],
  },
  {
    hanzi: "经常",
    pinyin: "jīngcháng",
    english: "often, frequently, regularly",
    hsk_level: 2,
    examples: [
      { chinese: "我经常去图书馆。", english: "I often go to the library.", pinyin: "wǒ jīng cháng qù tú shū guǎn 。" },
      { chinese: "他经常迟到。", english: "He is often late.", pinyin: "tā jīng cháng chí dào 。" },
    ],
  },
  {
    hanzi: "就",
    pinyin: "jiù",
    english: "then, right away, just, only",
    hsk_level: 2,
    examples: [
      { chinese: "我马上就来。", english: "I'll be right there.", pinyin: "wǒ mǎ shàng jiù lái 。" },
      { chinese: "这就是答案。", english: "This is the answer.", pinyin: "zhè jiù shì dá àn 。" },
    ],
  },
  {
    hanzi: "可以",
    pinyin: "kěyǐ",
    english: "can, may, be permitted to",
    hsk_level: 2,
    examples: [
      { chinese: "我可以帮你吗？", english: "May I help you?", pinyin: "wǒ kě yǐ bāng nǐ ma ？" },
      { chinese: "这里可以拍照吗？", english: "Can I take photos here?", pinyin: "zhè lǐ kě yǐ pāi zhào ma ？" },
    ],
  },
  {
    hanzi: "快乐",
    pinyin: "kuàilè",
    english: "happy, joyful",
    hsk_level: 2,
    examples: [
      { chinese: "生日快乐！", english: "Happy birthday!", pinyin: "shēng rì kuài lè ！" },
      { chinese: "祝你快乐！", english: "Wish you happiness!", pinyin: "zhù nǐ kuài lè ！" },
    ],
  },
  {
    hanzi: "离",
    pinyin: "lí",
    english: "to be away from, distance from",
    hsk_level: 2,
    examples: [
      { chinese: "学校离我家很近。", english: "School is close to my home.", pinyin: "xué xiào lí wǒ jiā hěn jìn 。" },
      { chinese: "这里离机场多远？", english: "How far is it from here to the airport?", pinyin: "zhè lǐ lí jī chǎng duō yuǎn ？" },
    ],
  },
  {
    hanzi: "历史",
    pinyin: "lìshǐ",
    english: "history",
    hsk_level: 2,
    examples: [
      { chinese: "中国有悠久的历史。", english: "China has a long history.", pinyin: "Zhōng guó yǒu yōu jiǔ de lì shǐ 。" },
      { chinese: "我喜欢学历史。", english: "I like to study history.", pinyin: "wǒ xǐ huān xué lì shǐ 。" },
    ],
  },
  {
    hanzi: "练习",
    pinyin: "liànxí",
    english: "to practice, exercise",
    hsk_level: 2,
    examples: [
      { chinese: "我每天练习写汉字。", english: "I practice writing Chinese characters every day.", pinyin: "wǒ měi tiān liàn xí xiě Hàn zì 。" },
      { chinese: "多练习就会好。", english: "Practice more and you'll improve.", pinyin: "duō liàn xí jiù huì hǎo 。" },
    ],
  },
  {
    hanzi: "马上",
    pinyin: "mǎshàng",
    english: "immediately, right away",
    hsk_level: 2,
    examples: [
      { chinese: "我马上来。", english: "I'll be right there.", pinyin: "wǒ mǎ shàng lái 。" },
      { chinese: "他马上就到了。", english: "He'll arrive right away.", pinyin: "tā mǎ shàng jiù dào le 。" },
    ],
  },
  {
    hanzi: "满意",
    pinyin: "mǎnyì",
    english: "satisfied, pleased",
    hsk_level: 2,
    examples: [
      { chinese: "我对这个结果很满意。", english: "I'm very satisfied with this result.", pinyin: "wǒ duì zhè ge jié guǒ hěn mǎn yì 。" },
      { chinese: "你满意吗？", english: "Are you satisfied?", pinyin: "nǐ mǎn yì ma ？" },
    ],
  },
  {
    hanzi: "面包",
    pinyin: "miànbāo",
    english: "bread",
    hsk_level: 2,
    examples: [
      { chinese: "我早上吃面包。", english: "I eat bread in the morning.", pinyin: "wǒ zǎo shàng chī miàn bāo 。" },
      { chinese: "这个面包很新鲜。", english: "This bread is very fresh.", pinyin: "zhè ge miàn bāo hěn xīn xiān 。" },
    ],
  },
  {
    hanzi: "明白",
    pinyin: "míngbai",
    english: "to understand, clear",
    hsk_level: 2,
    examples: [
      { chinese: "你明白了吗？", english: "Do you understand?", pinyin: "nǐ míng bái le ma ？" },
      { chinese: "我不明白这道题。", english: "I don't understand this problem.", pinyin: "wǒ bù míng bái zhè dào tí 。" },
    ],
  },
  {
    hanzi: "爬山",
    pinyin: "páshān",
    english: "to climb a mountain, hiking",
    hsk_level: 2,
    examples: [
      { chinese: "周末我们去爬山吧。", english: "Let's go hiking this weekend.", pinyin: "zhōu mò wǒ men qù pá shān ba 。" },
      { chinese: "他很喜欢爬山。", english: "He loves mountain climbing.", pinyin: "tā hěn xǐ huān pá shān 。" },
    ],
  },
  {
    hanzi: "旁边",
    pinyin: "pángbiān",
    english: "beside, next to, side",
    hsk_level: 2,
    examples: [
      { chinese: "超市在银行旁边。", english: "The supermarket is next to the bank.", pinyin: "chāo shì zài yín háng páng biān 。" },
      { chinese: "请坐在我旁边。", english: "Please sit next to me.", pinyin: "qǐng zuò zài wǒ páng biān 。" },
    ],
  },
  {
    hanzi: "跑步",
    pinyin: "pǎobù",
    english: "to run, jogging",
    hsk_level: 2,
    examples: [
      { chinese: "我每天早上跑步。", english: "I run every morning.", pinyin: "wǒ měi tiān zǎo shàng pǎo bù 。" },
      { chinese: "跑步对身体好。", english: "Running is good for your health.", pinyin: "pǎo bù duì shēn tǐ hǎo 。" },
    ],
  },
  {
    hanzi: "便宜",
    pinyin: "piányí",
    english: "cheap, inexpensive",
    hsk_level: 2,
    examples: [
      { chinese: "这个很便宜。", english: "This is very cheap.", pinyin: "zhè ge hěn pián yí 。" },
      { chinese: "能便宜一点吗？", english: "Can you make it cheaper?", pinyin: "néng pián yí yī diǎn ma ？" },
    ],
  },
  {
    hanzi: "票",
    pinyin: "piào",
    english: "ticket",
    hsk_level: 2,
    examples: [
      { chinese: "我买了两张电影票。", english: "I bought two movie tickets.", pinyin: "wǒ mǎi le liǎng zhāng diàn yǐng piào 。" },
      { chinese: "火车票多少钱？", english: "How much is the train ticket?", pinyin: "huǒ chē piào duō shǎo qián ？" },
    ],
  },
  {
    hanzi: "其实",
    pinyin: "qíshí",
    english: "actually, in fact, as a matter of fact",
    hsk_level: 2,
    examples: [
      { chinese: "其实我不喜欢这个。", english: "Actually, I don't like this.", pinyin: "qí shí wǒ bù xǐ huān zhè ge 。" },
      { chinese: "其实很简单。", english: "Actually, it's very simple.", pinyin: "qí shí hěn jiǎn dān 。" },
    ],
  },
  {
    hanzi: "请",
    pinyin: "qǐng",
    english: "please, to invite, to treat",
    hsk_level: 2,
    examples: [
      { chinese: "请进！", english: "Please come in!", pinyin: "qǐng jìn ！" },
      { chinese: "请坐。", english: "Please sit down.", pinyin: "qǐng zuò 。" },
      { chinese: "我请你吃饭。", english: "I'll treat you to a meal.", pinyin: "wǒ qǐng nǐ chī fàn 。" },
    ],
  },
  {
    hanzi: "其他",
    pinyin: "qítā",
    english: "other, the rest",
    hsk_level: 2,
    examples: [
      { chinese: "其他人怎么样？", english: "What about the others?", pinyin: "qí tā rén zěn me yàng ？" },
      { chinese: "还有其他问题吗？", english: "Are there any other questions?", pinyin: "hái yǒu qí tā wèn tí ma ？" },
    ],
  },
  {
    hanzi: "然后",
    pinyin: "ránhòu",
    english: "then, afterwards, after that",
    hsk_level: 2,
    examples: [
      { chinese: "先吃饭，然后去看电影。", english: "Eat first, then go see a movie.", pinyin: "xiān chī fàn ， rán hòu qù kàn diàn yǐng 。" },
      { chinese: "然后怎么办？", english: "What then?", pinyin: "rán hòu zěn me bàn ？" },
    ],
  },
  {
    hanzi: "让",
    pinyin: "ràng",
    english: "to let, to allow, to make",
    hsk_level: 2,
    examples: [
      { chinese: "请让我过去。", english: "Please let me pass.", pinyin: "qǐng ràng wǒ guò qù 。" },
      { chinese: "他让我等他。", english: "He asked me to wait for him.", pinyin: "tā ràng wǒ děng tā 。" },
    ],
  },
  {
    hanzi: "上班",
    pinyin: "shàngbān",
    english: "to go to work, to be at work",
    hsk_level: 2,
    examples: [
      { chinese: "他每天八点上班。", english: "He goes to work at eight o'clock every day.", pinyin: "tā měi tiān bā diǎn shàng bān 。" },
      { chinese: "你几点上班？", english: "What time do you start work?", pinyin: "nǐ jǐ diǎn shàng bān ？" },
    ],
  },
  {
    hanzi: "身体",
    pinyin: "shēntǐ",
    english: "body, health",
    hsk_level: 2,
    examples: [
      { chinese: "你身体好吗？", english: "How is your health?", pinyin: "nǐ shēn tǐ hǎo ma ？" },
      { chinese: "注意身体！", english: "Take care of your health!", pinyin: "zhù yì shēn tǐ ！" },
    ],
  },
  {
    hanzi: "生病",
    pinyin: "shēngbìng",
    english: "to get sick, to fall ill",
    hsk_level: 2,
    examples: [
      { chinese: "我生病了。", english: "I'm sick.", pinyin: "wǒ shēng bìng le 。" },
      { chinese: "他生病不能来上课。", english: "He is sick and can't come to class.", pinyin: "tā shēng bìng bù néng lái shàng kè 。" },
    ],
  },
  {
    hanzi: "时间",
    pinyin: "shíjiān",
    english: "time",
    hsk_level: 2,
    examples: [
      { chinese: "你有时间吗？", english: "Do you have time?", pinyin: "nǐ yǒu shí jiān ma ？" },
      { chinese: "时间过得真快。", english: "Time passes so fast.", pinyin: "shí jiān guò de zhēn kuài 。" },
      { chinese: "我没有时间。", english: "I don't have time.", pinyin: "wǒ méi yǒu shí jiān 。" },
    ],
  },
  {
    hanzi: "事情",
    pinyin: "shìqíng",
    english: "matter, thing, affair",
    hsk_level: 2,
    examples: [
      { chinese: "有什么事情？", english: "What's the matter?", pinyin: "yǒu shén me shì qíng ？" },
      { chinese: "这件事情很重要。", english: "This matter is very important.", pinyin: "zhè jiàn shì qíng hěn zhòng yào 。" },
    ],
  },
  {
    hanzi: "手表",
    pinyin: "shǒubiǎo",
    english: "watch, wristwatch",
    hsk_level: 2,
    examples: [
      { chinese: "这块手表很贵。", english: "This watch is very expensive.", pinyin: "zhè kuài shǒu biǎo hěn guì 。" },
      { chinese: "你的手表几点了？", english: "What time is it on your watch?", pinyin: "nǐ de shǒu biǎo jǐ diǎn le ？" },
    ],
  },
  {
    hanzi: "所以",
    pinyin: "suǒyǐ",
    english: "so, therefore, as a result",
    hsk_level: 2,
    examples: [
      { chinese: "我生病了，所以没去上课。", english: "I was sick, so I didn't go to class.", pinyin: "wǒ shēng bìng le ， suǒ yǐ méi qù shàng kè 。" },
      { chinese: "天冷了，所以穿多点吧。", english: "It got cold, so dress warmer.", pinyin: "tiān lěng le ， suǒ yǐ chuān duō diǎn ba 。" },
    ],
  },
  {
    hanzi: "虽然",
    pinyin: "suīrán",
    english: "although, even though",
    hsk_level: 2,
    examples: [
      { chinese: "虽然很难，但我会努力。", english: "Although it's hard, I'll work hard.", pinyin: "suī rán hěn nán ， dàn wǒ huì nǔ lì 。" },
      { chinese: "虽然下雨，但我们还是去了。", english: "Although it rained, we still went.", pinyin: "suī rán xià yǔ ， dàn wǒ men hái shi qù le 。" },
    ],
  },
  {
    hanzi: "它",
    pinyin: "tā",
    english: "it (for animals and things)",
    hsk_level: 2,
    examples: [
      { chinese: "这只猫，它很可爱。", english: "This cat, it's very cute.", pinyin: "zhè zhī māo ， tā hěn kě ài 。" },
      { chinese: "它是什么颜色？", english: "What color is it?", pinyin: "tā shì shén me yán sè ？" },
    ],
  },
  {
    hanzi: "特别",
    pinyin: "tèbié",
    english: "special, especially, particularly",
    hsk_level: 2,
    examples: [
      { chinese: "这个菜特别好吃。", english: "This dish is especially delicious.", pinyin: "zhè ge cài tè bié hǎo chī 。" },
      { chinese: "今天特别冷。", english: "It's particularly cold today.", pinyin: "jīn tiān tè bié lěng 。" },
    ],
  },
  {
    hanzi: "同事",
    pinyin: "tóngshì",
    english: "colleague, coworker",
    hsk_level: 2,
    examples: [
      { chinese: "他是我的同事。", english: "He is my colleague.", pinyin: "tā shì wǒ de tóng shì 。" },
      { chinese: "我和同事一起吃午饭。", english: "I have lunch with my colleagues.", pinyin: "wǒ hé tóng shì yī qǐ chī wǔ fàn 。" },
    ],
  },
  {
    hanzi: "图书馆",
    pinyin: "túshūguǎn",
    english: "library",
    hsk_level: 2,
    examples: [
      { chinese: "我经常去图书馆看书。", english: "I often go to the library to read.", pinyin: "wǒ jīng cháng qù tú shū guǎn kàn shū 。" },
      { chinese: "图书馆在几楼？", english: "Which floor is the library on?", pinyin: "tú shū guǎn zài jǐ lóu ？" },
    ],
  },
  {
    hanzi: "外",
    pinyin: "wài",
    english: "outside, foreign",
    hsk_level: 2,
    examples: [
      { chinese: "外面很冷。", english: "It's cold outside.", pinyin: "wài miàn hěn lěng 。" },
      { chinese: "孩子在外面玩。", english: "The child is playing outside.", pinyin: "hái zi zài wài miàn wán 。" },
    ],
  },
  {
    hanzi: "完",
    pinyin: "wán",
    english: "to finish, to complete",
    hsk_level: 2,
    examples: [
      { chinese: "作业做完了吗？", english: "Have you finished the homework?", pinyin: "zuò yè zuò wán le ma ？" },
      { chinese: "我吃完了。", english: "I've finished eating.", pinyin: "wǒ chī wán le 。" },
    ],
  },
  {
    hanzi: "为了",
    pinyin: "wèile",
    english: "for, for the sake of, in order to",
    hsk_level: 2,
    examples: [
      { chinese: "为了健康，要多运动。", english: "For your health, exercise more.", pinyin: "wèi le jiàn kāng ， yào duō yùn dòng 。" },
      { chinese: "我为了学汉语来中国。", english: "I came to China to learn Chinese.", pinyin: "wǒ wèi le xué Hàn yǔ lái Zhōng guó 。" },
    ],
  },
  {
    hanzi: "问题",
    pinyin: "wèntí",
    english: "question, problem, issue",
    hsk_level: 2,
    examples: [
      { chinese: "你有什么问题？", english: "Do you have any questions?", pinyin: "nǐ yǒu shén me wèn tí ？" },
      { chinese: "没问题！", english: "No problem!", pinyin: "méi wèn tí ！" },
      { chinese: "这是个大问题。", english: "This is a big problem.", pinyin: "zhè shì gè dà wèn tí 。" },
    ],
  },
  {
    hanzi: "希望",
    pinyin: "xīwàng",
    english: "to hope, to wish, hope",
    hsk_level: 2,
    examples: [
      { chinese: "我希望你成功。", english: "I hope you succeed.", pinyin: "wǒ xī wàng nǐ chéng gōng 。" },
      { chinese: "希望明天天气好。", english: "I hope the weather will be good tomorrow.", pinyin: "xī wàng míng tiān tiān qì hǎo 。" },
    ],
  },
  {
    hanzi: "喜欢",
    pinyin: "xǐhuan",
    english: "to like, to be fond of",
    hsk_level: 2,
    examples: [
      { chinese: "我喜欢学习汉语。", english: "I like learning Chinese.", pinyin: "wǒ xǐ huān xué xí Hàn yǔ 。" },
      { chinese: "你喜欢什么运动？", english: "What sports do you like?", pinyin: "nǐ xǐ huān shén me yùn dòng ？" },
      { chinese: "她很喜欢猫。", english: "She really likes cats.", pinyin: "tā hěn xǐ huān māo 。" },
    ],
  },
  {
    hanzi: "选择",
    pinyin: "xuǎnzé",
    english: "to choose, choice, selection",
    hsk_level: 2,
    examples: [
      { chinese: "你选择哪个？", english: "Which one do you choose?", pinyin: "nǐ xuǎn zé nǎ ge ？" },
      { chinese: "这是一个好的选择。", english: "This is a good choice.", pinyin: "zhè shì yī ge hǎo de xuǎn zé 。" },
    ],
  },
  {
    hanzi: "要",
    pinyin: "yào",
    english: "to want, to need, will, must",
    hsk_level: 2,
    examples: [
      { chinese: "我要一杯咖啡。", english: "I want a cup of coffee.", pinyin: "wǒ yào yī bēi kā fēi 。" },
      { chinese: "你要去哪里？", english: "Where do you want to go?", pinyin: "nǐ yào qù nǎ lǐ ？" },
      { chinese: "明天要下雨了。", english: "It will rain tomorrow.", pinyin: "míng tiān yào xià yǔ le 。" },
    ],
  },
  {
    hanzi: "已经",
    pinyin: "yǐjīng",
    english: "already",
    hsk_level: 2,
    examples: [
      { chinese: "他已经走了。", english: "He has already left.", pinyin: "tā yǐ jīng zǒu le 。" },
      { chinese: "我已经吃完饭了。", english: "I have already finished eating.", pinyin: "wǒ yǐ jīng chī wán fàn le 。" },
    ],
  },
  {
    hanzi: "一般",
    pinyin: "yībān",
    english: "generally, usually, ordinary, so-so",
    hsk_level: 2,
    examples: [
      { chinese: "这个一般，不太好。", english: "This is so-so, not great.", pinyin: "zhè ge yī bān ， bú tài hǎo 。" },
      { chinese: "我一般七点起床。", english: "I usually get up at seven.", pinyin: "wǒ yī bān qī diǎn qǐ chuáng 。" },
    ],
  },
  {
    hanzi: "因为",
    pinyin: "yīnwèi",
    english: "because, since",
    hsk_level: 2,
    examples: [
      { chinese: "因为下雨，所以我没去。", english: "Because it rained, I didn't go.", pinyin: "yīn wèi xià yǔ ， suǒ yǐ wǒ méi qù 。" },
      { chinese: "我学汉语是因为喜欢中国文化。", english: "I study Chinese because I like Chinese culture.", pinyin: "wǒ xué Hàn yǔ shì yīn wèi xǐ huān Zhōng guó wén huà 。" },
    ],
  },
  {
    hanzi: "一样",
    pinyin: "yīyàng",
    english: "same, alike, similar",
    hsk_level: 2,
    examples: [
      { chinese: "我们的想法一样。", english: "We have the same idea.", pinyin: "wǒ men de xiǎng fǎ yī yàng 。" },
      { chinese: "这两个一样大。", english: "These two are the same size.", pinyin: "zhè liǎng ge yī yàng dà 。" },
    ],
  },
  {
    hanzi: "以前",
    pinyin: "yǐqián",
    english: "before, formerly, in the past",
    hsk_level: 2,
    examples: [
      { chinese: "以前我住在上海。", english: "I used to live in Shanghai.", pinyin: "yǐ qián wǒ zhù zài Shàng hǎi 。" },
      { chinese: "以前我不会说汉语。", english: "I couldn't speak Chinese before.", pinyin: "yǐ qián wǒ bú huì shuō Hàn yǔ 。" },
    ],
  },
  {
    hanzi: "游泳",
    pinyin: "yóuyǒng",
    english: "to swim, swimming",
    hsk_level: 2,
    examples: [
      { chinese: "我喜欢游泳。", english: "I like swimming.", pinyin: "wǒ xǐ huān yóu yǒng 。" },
      { chinese: "你会游泳吗？", english: "Can you swim?", pinyin: "nǐ huì yóu yǒng ma ？" },
    ],
  },
  {
    hanzi: "有名",
    pinyin: "yǒumíng",
    english: "famous, well-known",
    hsk_level: 2,
    examples: [
      { chinese: "北京烤鸭很有名。", english: "Peking duck is very famous.", pinyin: "Běi jīng kǎo yā hěn yǒu míng 。" },
      { chinese: "他是很有名的歌手。", english: "He is a very famous singer.", pinyin: "tā shì hěn yǒu míng de gē shǒu 。" },
    ],
  },
  {
    hanzi: "遇到",
    pinyin: "yùdào",
    english: "to meet, to encounter, to run into",
    hsk_level: 2,
    examples: [
      { chinese: "我在路上遇到了他。", english: "I ran into him on the road.", pinyin: "wǒ zài lù shàng yù dào le tā 。" },
      { chinese: "很高兴遇到你！", english: "So glad to run into you!", pinyin: "hěn gāo xìng yù dào nǐ ！" },
    ],
  },
  {
    hanzi: "月亮",
    pinyin: "yuèliang",
    english: "moon",
    hsk_level: 2,
    examples: [
      { chinese: "今晚的月亮很圆。", english: "Tonight's moon is very round.", pinyin: "jīn wǎn de yuè liàng hěn yuán 。" },
      { chinese: "我看着月亮想家。", english: "I look at the moon and miss home.", pinyin: "wǒ kàn zhe yuè liàng xiǎng jiā 。" },
    ],
  },
  {
    hanzi: "运动",
    pinyin: "yùndòng",
    english: "sport, exercise, to exercise",
    hsk_level: 2,
    examples: [
      { chinese: "你喜欢什么运动？", english: "What sport do you like?", pinyin: "nǐ xǐ huān shén me yùn dòng ？" },
      { chinese: "每天运动对身体好。", english: "Daily exercise is good for your health.", pinyin: "měi tiān yùn dòng duì shēn tǐ hǎo 。" },
    ],
  },
  {
    hanzi: "站",
    pinyin: "zhàn",
    english: "to stand, station, stop",
    hsk_level: 2,
    examples: [
      { chinese: "下一站是天安门。", english: "The next stop is Tiananmen.", pinyin: "xià yī zhàn shì Tiān ān mén 。" },
      { chinese: "请站起来。", english: "Please stand up.", pinyin: "qǐng zhàn qǐ lái 。" },
    ],
  },
  {
    hanzi: "照片",
    pinyin: "zhàopiàn",
    english: "photograph, photo",
    hsk_level: 2,
    examples: [
      { chinese: "我拍了很多照片。", english: "I took many photos.", pinyin: "wǒ pāi le hěn duō zhào piàn 。" },
      { chinese: "这张照片很好看。", english: "This photo looks great.", pinyin: "zhè zhāng zhào piàn hěn hǎo kàn 。" },
    ],
  },
  {
    hanzi: "真",
    pinyin: "zhēn",
    english: "real, true, genuine, really",
    hsk_level: 2,
    examples: [
      { chinese: "你真聪明！", english: "You're really smart!", pinyin: "nǐ zhēn cōng míng ！" },
      { chinese: "这是真的吗？", english: "Is this real?", pinyin: "zhè shì zhēn de ma ？" },
    ],
  },
  {
    hanzi: "正在",
    pinyin: "zhèngzài",
    english: "in the process of, right now (progressive marker)",
    hsk_level: 2,
    examples: [
      { chinese: "他正在睡觉。", english: "He is sleeping right now.", pinyin: "tā zhèng zài shuì jiào 。" },
      { chinese: "我正在学汉语。", english: "I am studying Chinese right now.", pinyin: "wǒ zhèng zài xué Hàn yǔ 。" },
    ],
  },
  {
    hanzi: "知道",
    pinyin: "zhīdào",
    english: "to know, to be aware of",
    hsk_level: 2,
    examples: [
      { chinese: "你知道吗？", english: "Did you know?", pinyin: "nǐ zhī dào ma ？" },
      { chinese: "我不知道。", english: "I don't know.", pinyin: "wǒ bù zhī dào 。" },
      { chinese: "他知道答案。", english: "He knows the answer.", pinyin: "tā zhī dào dá àn 。" },
    ],
  },
  {
    hanzi: "只",
    pinyin: "zhǐ",
    english: "only, just, merely",
    hsk_level: 2,
    examples: [
      { chinese: "我只有一个苹果。", english: "I only have one apple.", pinyin: "wǒ zhǐ yǒu yī ge píng guǒ 。" },
      { chinese: "他只来了一次。", english: "He only came once.", pinyin: "tā zhǐ lái le yī cì 。" },
    ],
  },
  {
    hanzi: "重要",
    pinyin: "zhòngyào",
    english: "important",
    hsk_level: 2,
    examples: [
      { chinese: "学习很重要。", english: "Studying is very important.", pinyin: "xué xí hěn zhòng yào 。" },
      { chinese: "健康是最重要的。", english: "Health is the most important thing.", pinyin: "jiàn kāng shì zuì zhòng yào de 。" },
    ],
  },
  {
    hanzi: "准备",
    pinyin: "zhǔnbèi",
    english: "to prepare, to get ready",
    hsk_level: 2,
    examples: [
      { chinese: "我在准备考试。", english: "I am preparing for the exam.", pinyin: "wǒ zài zhǔn bèi kǎo shì 。" },
      { chinese: "你准备好了吗？", english: "Are you ready?", pinyin: "nǐ zhǔn bèi hǎo le ma ？" },
    ],
  },
  {
    hanzi: "自己",
    pinyin: "zìjǐ",
    english: "oneself, self",
    hsk_level: 2,
    examples: [
      { chinese: "你要相信自己。", english: "You should believe in yourself.", pinyin: "nǐ yào xiāng xìn zì jǐ 。" },
      { chinese: "他自己做饭。", english: "He cooks by himself.", pinyin: "tā zì jǐ zuò fàn 。" },
    ],
  },
  {
    hanzi: "最",
    pinyin: "zuì",
    english: "most, -est (superlative)",
    hsk_level: 2,
    examples: [
      { chinese: "这是最好的方法。", english: "This is the best method.", pinyin: "zhè shì zuì hǎo de fāng fǎ 。" },
      { chinese: "我最喜欢夏天。", english: "I like summer the most.", pinyin: "wǒ zuì xǐ huān xià tiān 。" },
    ],
  },
  {
    hanzi: "左边",
    pinyin: "zuǒbiān",
    english: "left side, to the left",
    hsk_level: 2,
    examples: [
      { chinese: "银行在左边。", english: "The bank is on the left.", pinyin: "yín háng zài zuǒ biān 。" },
      { chinese: "请向左边走。", english: "Please walk to the left.", pinyin: "qǐng xiàng zuǒ biān zǒu 。" },
    ],
  },
];
