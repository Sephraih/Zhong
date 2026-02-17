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

// ─── Helper ───────────────────────────────────────────────────────────────────

function pw(pairs: [string, string][]): { char: string; pinyin: string }[] {
  return pairs.map(([char, pinyin]) => ({ char, pinyin }));
}

// ─── Fallback / offline vocabulary ───────────────────────────────────────────
// Used when Supabase is unreachable (sandbox, no internet, missing env vars).
// Contains a representative cross-section of HSK 1 & 2 words so every feature
// of the app (browse, flashcards, practice, quiz) works without the DB.

export const FALLBACK_VOCABULARY: VocabWord[] = [
  // ── HSK 1 ─────────────────────────────────────────────────────────────────
  {
    id: 1, hanzi: "爱", pinyin: "ài", english: "love, like", hskLevel: 1, category: "Verbs",
    examples: [
      { chinese: "我爱你。", pinyinWords: pw([["我","wǒ"],["爱","ài"],["你","nǐ"],["。",""]]), english: "I love you." },
      { chinese: "她爱学习。", pinyinWords: pw([["她","tā"],["爱","ài"],["学","xué"],["习","xí"],["。",""]]), english: "She loves studying." },
    ],
  },
  {
    id: 2, hanzi: "八", pinyin: "bā", english: "eight", hskLevel: 1, category: "Numbers",
    examples: [
      { chinese: "我有八本书。", pinyinWords: pw([["我","wǒ"],["有","yǒu"],["八","bā"],["本","běn"],["书","shū"],["。",""]]), english: "I have eight books." },
    ],
  },
  {
    id: 3, hanzi: "爸爸", pinyin: "bà ba", english: "father, dad", hskLevel: 1, category: "Family",
    examples: [
      { chinese: "我爸爸是老师。", pinyinWords: pw([["我","wǒ"],["爸","bà"],["爸","ba"],["是","shì"],["老","lǎo"],["师","shī"],["。",""]]), english: "My father is a teacher." },
      { chinese: "爸爸在家。", pinyinWords: pw([["爸","bà"],["爸","ba"],["在","zài"],["家","jiā"],["。",""]]), english: "Dad is at home." },
    ],
  },
  {
    id: 4, hanzi: "杯子", pinyin: "bēi zi", english: "cup, glass", hskLevel: 1, category: "Nouns",
    examples: [
      { chinese: "这个杯子是我的。", pinyinWords: pw([["这","zhè"],["个","gè"],["杯","bēi"],["子","zi"],["是","shì"],["我","wǒ"],["的","de"],["。",""]]), english: "This cup is mine." },
      { chinese: "请给我一个杯子。", pinyinWords: pw([["请","qǐng"],["给","gěi"],["我","wǒ"],["一","yī"],["个","gè"],["杯","bēi"],["子","zi"],["。",""]]), english: "Please give me a cup." },
    ],
  },
  {
    id: 5, hanzi: "北京", pinyin: "Běi jīng", english: "Beijing", hskLevel: 1, category: "Places",
    examples: [
      { chinese: "我在北京工作。", pinyinWords: pw([["我","wǒ"],["在","zài"],["北","Běi"],["京","jīng"],["工","gōng"],["作","zuò"],["。",""]]), english: "I work in Beijing." },
      { chinese: "北京是中国的首都。", pinyinWords: pw([["北","Běi"],["京","jīng"],["是","shì"],["中","zhōng"],["国","guó"],["的","de"],["首","shǒu"],["都","dū"],["。",""]]), english: "Beijing is the capital of China." },
    ],
  },
  {
    id: 6, hanzi: "本", pinyin: "běn", english: "measure word for books", hskLevel: 1, category: "Measure Words",
    examples: [
      { chinese: "我买了一本书。", pinyinWords: pw([["我","wǒ"],["买","mǎi"],["了","le"],["一","yī"],["本","běn"],["书","shū"],["。",""]]), english: "I bought a book." },
    ],
  },
  {
    id: 7, hanzi: "不客气", pinyin: "bù kè qi", english: "you're welcome", hskLevel: 1, category: "Greetings",
    examples: [
      { chinese: "谢谢你！不客气。", pinyinWords: pw([["谢","xiè"],["谢","xiè"],["你","nǐ"],["！",""],["不","bù"],["客","kè"],["气","qi"],["。",""]]), english: "Thank you! You're welcome." },
    ],
  },
  {
    id: 8, hanzi: "不", pinyin: "bù", english: "no, not", hskLevel: 1, category: "Adverbs",
    examples: [
      { chinese: "我不是老师。", pinyinWords: pw([["我","wǒ"],["不","bù"],["是","shì"],["老","lǎo"],["师","shī"],["。",""]]), english: "I am not a teacher." },
      { chinese: "今天不冷。", pinyinWords: pw([["今","jīn"],["天","tiān"],["不","bù"],["冷","lěng"],["。",""]]), english: "It's not cold today." },
    ],
  },
  {
    id: 9, hanzi: "菜", pinyin: "cài", english: "dish, vegetable", hskLevel: 1, category: "Food",
    examples: [
      { chinese: "这个菜很好吃。", pinyinWords: pw([["这","zhè"],["个","gè"],["菜","cài"],["很","hěn"],["好","hǎo"],["吃","chī"],["。",""]]), english: "This dish is delicious." },
      { chinese: "她做的菜很香。", pinyinWords: pw([["她","tā"],["做","zuò"],["的","de"],["菜","cài"],["很","hěn"],["香","xiāng"],["。",""]]), english: "The food she cooked smells great." },
    ],
  },
  {
    id: 10, hanzi: "茶", pinyin: "chá", english: "tea", hskLevel: 1, category: "Food",
    examples: [
      { chinese: "我喜欢喝茶。", pinyinWords: pw([["我","wǒ"],["喜","xǐ"],["欢","huān"],["喝","hē"],["茶","chá"],["。",""]]), english: "I like drinking tea." },
      { chinese: "请喝茶。", pinyinWords: pw([["请","qǐng"],["喝","hē"],["茶","chá"],["。",""]]), english: "Please have some tea." },
    ],
  },
  {
    id: 11, hanzi: "吃", pinyin: "chī", english: "to eat", hskLevel: 1, category: "Verbs",
    examples: [
      { chinese: "我喜欢吃米饭。", pinyinWords: pw([["我","wǒ"],["喜","xǐ"],["欢","huān"],["吃","chī"],["米","mǐ"],["饭","fàn"],["。",""]]), english: "I like eating rice." },
      { chinese: "你吃饭了吗？", pinyinWords: pw([["你","nǐ"],["吃","chī"],["饭","fàn"],["了","le"],["吗","ma"],["？",""]]), english: "Have you eaten?" },
    ],
  },
  {
    id: 12, hanzi: "出租车", pinyin: "chū zū chē", english: "taxi", hskLevel: 1, category: "Transport",
    examples: [
      { chinese: "我坐出租车去机场。", pinyinWords: pw([["我","wǒ"],["坐","zuò"],["出","chū"],["租","zū"],["车","chē"],["去","qù"],["机","jī"],["场","chǎng"],["。",""]]), english: "I take a taxi to the airport." },
    ],
  },
  {
    id: 13, hanzi: "打电话", pinyin: "dǎ diàn huà", english: "to make a phone call", hskLevel: 1, category: "Verbs",
    examples: [
      { chinese: "我给她打电话。", pinyinWords: pw([["我","wǒ"],["给","gěi"],["她","tā"],["打","dǎ"],["电","diàn"],["话","huà"],["。",""]]), english: "I call her on the phone." },
      { chinese: "请打电话给我。", pinyinWords: pw([["请","qǐng"],["打","dǎ"],["电","diàn"],["话","huà"],["给","gěi"],["我","wǒ"],["。",""]]), english: "Please call me." },
    ],
  },
  {
    id: 14, hanzi: "大", pinyin: "dà", english: "big, large", hskLevel: 1, category: "Adjectives",
    examples: [
      { chinese: "这个房间很大。", pinyinWords: pw([["这","zhè"],["个","gè"],["房","fáng"],["间","jiān"],["很","hěn"],["大","dà"],["。",""]]), english: "This room is very big." },
      { chinese: "他的手很大。", pinyinWords: pw([["他","tā"],["的","de"],["手","shǒu"],["很","hěn"],["大","dà"],["。",""]]), english: "His hands are very big." },
    ],
  },
  {
    id: 15, hanzi: "的", pinyin: "de", english: "possessive particle", hskLevel: 1, category: "Particles",
    examples: [
      { chinese: "这是我的书。", pinyinWords: pw([["这","zhè"],["是","shì"],["我","wǒ"],["的","de"],["书","shū"],["。",""]]), english: "This is my book." },
      { chinese: "她是我的朋友。", pinyinWords: pw([["她","tā"],["是","shì"],["我","wǒ"],["的","de"],["朋","péng"],["友","yǒu"],["。",""]]), english: "She is my friend." },
    ],
  },
  {
    id: 16, hanzi: "地方", pinyin: "dì fāng", english: "place, location", hskLevel: 1, category: "Nouns",
    examples: [
      { chinese: "这个地方很漂亮。", pinyinWords: pw([["这","zhè"],["个","gè"],["地","dì"],["方","fāng"],["很","hěn"],["漂","piào"],["亮","liàng"],["。",""]]), english: "This place is very beautiful." },
    ],
  },
  {
    id: 17, hanzi: "电脑", pinyin: "diàn nǎo", english: "computer", hskLevel: 1, category: "Technology",
    examples: [
      { chinese: "我用电脑工作。", pinyinWords: pw([["我","wǒ"],["用","yòng"],["电","diàn"],["脑","nǎo"],["工","gōng"],["作","zuò"],["。",""]]), english: "I work with a computer." },
      { chinese: "电脑坏了。", pinyinWords: pw([["电","diàn"],["脑","nǎo"],["坏","huài"],["了","le"],["。",""]]), english: "The computer broke down." },
    ],
  },
  {
    id: 18, hanzi: "电视", pinyin: "diàn shì", english: "television, TV", hskLevel: 1, category: "Technology",
    examples: [
      { chinese: "我晚上看电视。", pinyinWords: pw([["我","wǒ"],["晚","wǎn"],["上","shàng"],["看","kàn"],["电","diàn"],["视","shì"],["。",""]]), english: "I watch TV in the evening." },
    ],
  },
  {
    id: 19, hanzi: "电影", pinyin: "diàn yǐng", english: "movie, film", hskLevel: 1, category: "Entertainment",
    examples: [
      { chinese: "我们一起去看电影吧。", pinyinWords: pw([["我","wǒ"],["们","men"],["一","yī"],["起","qǐ"],["去","qù"],["看","kàn"],["电","diàn"],["影","yǐng"],["吧","ba"],["。",""]]), english: "Let's go watch a movie together." },
      { chinese: "这部电影很好看。", pinyinWords: pw([["这","zhè"],["部","bù"],["电","diàn"],["影","yǐng"],["很","hěn"],["好","hǎo"],["看","kàn"],["。",""]]), english: "This movie is very good." },
    ],
  },
  {
    id: 20, hanzi: "东西", pinyin: "dōng xi", english: "thing, stuff", hskLevel: 1, category: "Nouns",
    examples: [
      { chinese: "你买了什么东西？", pinyinWords: pw([["你","nǐ"],["买","mǎi"],["了","le"],["什","shén"],["么","me"],["东","dōng"],["西","xi"],["？",""]]), english: "What did you buy?" },
      { chinese: "这个东西很贵。", pinyinWords: pw([["这","zhè"],["个","gè"],["东","dōng"],["西","xi"],["很","hěn"],["贵","guì"],["。",""]]), english: "This thing is very expensive." },
    ],
  },
  {
    id: 21, hanzi: "都", pinyin: "dōu", english: "all, both", hskLevel: 1, category: "Adverbs",
    examples: [
      { chinese: "他们都是学生。", pinyinWords: pw([["他","tā"],["们","men"],["都","dōu"],["是","shì"],["学","xué"],["生","shēng"],["。",""]]), english: "They are all students." },
      { chinese: "我都知道了。", pinyinWords: pw([["我","wǒ"],["都","dōu"],["知","zhī"],["道","dào"],["了","le"],["。",""]]), english: "I know it all." },
    ],
  },
  {
    id: 22, hanzi: "读", pinyin: "dú", english: "to read, to study", hskLevel: 1, category: "Verbs",
    examples: [
      { chinese: "她每天读书。", pinyinWords: pw([["她","tā"],["每","měi"],["天","tiān"],["读","dú"],["书","shū"],["。",""]]), english: "She reads every day." },
    ],
  },
  {
    id: 23, hanzi: "对不起", pinyin: "duì bu qǐ", english: "sorry, excuse me", hskLevel: 1, category: "Greetings",
    examples: [
      { chinese: "对不起，我来晚了。", pinyinWords: pw([["对","duì"],["不","bu"],["起","qǐ"],["，",""],["我","wǒ"],["来","lái"],["晚","wǎn"],["了","le"],["。",""]]), english: "Sorry, I'm late." },
    ],
  },
  {
    id: 24, hanzi: "多少", pinyin: "duō shǎo", english: "how many, how much", hskLevel: 1, category: "Question Words",
    examples: [
      { chinese: "这个多少钱？", pinyinWords: pw([["这","zhè"],["个","gè"],["多","duō"],["少","shǎo"],["钱","qián"],["？",""]]), english: "How much is this?" },
      { chinese: "你有多少本书？", pinyinWords: pw([["你","nǐ"],["有","yǒu"],["多","duō"],["少","shǎo"],["本","běn"],["书","shū"],["？",""]]), english: "How many books do you have?" },
    ],
  },
  {
    id: 25, hanzi: "儿子", pinyin: "ér zi", english: "son", hskLevel: 1, category: "Family",
    examples: [
      { chinese: "她的儿子很聪明。", pinyinWords: pw([["她","tā"],["的","de"],["儿","ér"],["子","zi"],["很","hěn"],["聪","cōng"],["明","míng"],["。",""]]), english: "Her son is very smart." },
    ],
  },
  // ── HSK 2 ─────────────────────────────────────────────────────────────────
  {
    id: 100, hanzi: "啊", pinyin: "ā", english: "ah, oh (exclamation)", hskLevel: 2, category: "Particles",
    examples: [
      { chinese: "啊，你来了！", pinyinWords: pw([["啊","ā"],["，",""],["你","nǐ"],["来","lái"],["了","le"],["！",""]]), english: "Ah, you're here!" },
    ],
  },
  {
    id: 101, hanzi: "矮", pinyin: "ǎi", english: "short (in height)", hskLevel: 2, category: "Adjectives",
    examples: [
      { chinese: "他比我矮。", pinyinWords: pw([["他","tā"],["比","bǐ"],["我","wǒ"],["矮","ǎi"],["。",""]]), english: "He is shorter than me." },
    ],
  },
  {
    id: 102, hanzi: "把", pinyin: "bǎ", english: "to hold, handle (grammar particle)", hskLevel: 2, category: "Particles",
    examples: [
      { chinese: "请把书给我。", pinyinWords: pw([["请","qǐng"],["把","bǎ"],["书","shū"],["给","gěi"],["我","wǒ"],["。",""]]), english: "Please give me the book." },
      { chinese: "我把作业做完了。", pinyinWords: pw([["我","wǒ"],["把","bǎ"],["作","zuò"],["业","yè"],["做","zuò"],["完","wán"],["了","le"],["。",""]]), english: "I finished the homework." },
    ],
  },
  {
    id: 103, hanzi: "班", pinyin: "bān", english: "class, shift", hskLevel: 2, category: "School",
    examples: [
      { chinese: "我们班有三十个学生。", pinyinWords: pw([["我","wǒ"],["们","men"],["班","bān"],["有","yǒu"],["三","sān"],["十","shí"],["个","gè"],["学","xué"],["生","shēng"],["。",""]]), english: "Our class has thirty students." },
    ],
  },
  {
    id: 104, hanzi: "搬", pinyin: "bān", english: "to move (objects)", hskLevel: 2, category: "Verbs",
    examples: [
      { chinese: "帮我搬一下这个箱子。", pinyinWords: pw([["帮","bāng"],["我","wǒ"],["搬","bān"],["一","yī"],["下","xià"],["这","zhè"],["个","gè"],["箱","xiāng"],["子","zi"],["。",""]]), english: "Help me move this box." },
    ],
  },
  {
    id: 105, hanzi: "帮助", pinyin: "bāng zhù", english: "to help, assistance", hskLevel: 2, category: "Verbs",
    examples: [
      { chinese: "谢谢你的帮助。", pinyinWords: pw([["谢","xiè"],["谢","xiè"],["你","nǐ"],["的","de"],["帮","bāng"],["助","zhù"],["。",""]]), english: "Thank you for your help." },
      { chinese: "我可以帮助你吗？", pinyinWords: pw([["我","wǒ"],["可","kě"],["以","yǐ"],["帮","bāng"],["助","zhù"],["你","nǐ"],["吗","ma"],["？",""]]), english: "Can I help you?" },
    ],
  },
  {
    id: 106, hanzi: "比", pinyin: "bǐ", english: "to compare, than", hskLevel: 2, category: "Prepositions",
    examples: [
      { chinese: "今天比昨天冷。", pinyinWords: pw([["今","jīn"],["天","tiān"],["比","bǐ"],["昨","zuó"],["天","tiān"],["冷","lěng"],["。",""]]), english: "Today is colder than yesterday." },
      { chinese: "他比我高。", pinyinWords: pw([["他","tā"],["比","bǐ"],["我","wǒ"],["高","gāo"],["。",""]]), english: "He is taller than me." },
    ],
  },
  {
    id: 107, hanzi: "别", pinyin: "bié", english: "don't, other", hskLevel: 2, category: "Adverbs",
    examples: [
      { chinese: "别说话！", pinyinWords: pw([["别","bié"],["说","shuō"],["话","huà"],["！",""]]), english: "Don't talk!" },
      { chinese: "别担心。", pinyinWords: pw([["别","bié"],["担","dān"],["心","xīn"],["。",""]]), english: "Don't worry." },
    ],
  },
  {
    id: 108, hanzi: "宾馆", pinyin: "bīn guǎn", english: "hotel", hskLevel: 2, category: "Places",
    examples: [
      { chinese: "我住在宾馆里。", pinyinWords: pw([["我","wǒ"],["住","zhù"],["在","zài"],["宾","bīn"],["馆","guǎn"],["里","lǐ"],["。",""]]), english: "I'm staying at a hotel." },
    ],
  },
  {
    id: 109, hanzi: "冰箱", pinyin: "bīng xiāng", english: "refrigerator, fridge", hskLevel: 2, category: "Household",
    examples: [
      { chinese: "冰箱里有牛奶。", pinyinWords: pw([["冰","bīng"],["箱","xiāng"],["里","lǐ"],["有","yǒu"],["牛","niú"],["奶","nǎi"],["。",""]]), english: "There is milk in the fridge." },
      { chinese: "把水果放进冰箱里。", pinyinWords: pw([["把","bǎ"],["水","shuǐ"],["果","guǒ"],["放","fàng"],["进","jìn"],["冰","bīng"],["箱","xiāng"],["里","lǐ"],["。",""]]), english: "Put the fruit in the fridge." },
    ],
  },
  {
    id: 110, hanzi: "才", pinyin: "cái", english: "only then, just", hskLevel: 2, category: "Adverbs",
    examples: [
      { chinese: "他八点才来。", pinyinWords: pw([["他","tā"],["八","bā"],["点","diǎn"],["才","cái"],["来","lái"],["。",""]]), english: "He didn't come until eight o'clock." },
    ],
  },
  {
    id: 111, hanzi: "参加", pinyin: "cān jiā", english: "to participate, to attend", hskLevel: 2, category: "Verbs",
    examples: [
      { chinese: "你参加比赛了吗？", pinyinWords: pw([["你","nǐ"],["参","cān"],["加","jiā"],["比","bǐ"],["赛","sài"],["了","le"],["吗","ma"],["？",""]]), english: "Did you join the competition?" },
      { chinese: "我想参加这个活动。", pinyinWords: pw([["我","wǒ"],["想","xiǎng"],["参","cān"],["加","jiā"],["这","zhè"],["个","gè"],["活","huó"],["动","dòng"],["。",""]]), english: "I want to participate in this activity." },
    ],
  },
  {
    id: 112, hanzi: "草", pinyin: "cǎo", english: "grass", hskLevel: 2, category: "Nature",
    examples: [
      { chinese: "公园里有很多草。", pinyinWords: pw([["公","gōng"],["园","yuán"],["里","lǐ"],["有","yǒu"],["很","hěn"],["多","duō"],["草","cǎo"],["。",""]]), english: "There is a lot of grass in the park." },
    ],
  },
  {
    id: 113, hanzi: "层", pinyin: "céng", english: "floor, layer, storey", hskLevel: 2, category: "Measure Words",
    examples: [
      { chinese: "我住在五层。", pinyinWords: pw([["我","wǒ"],["住","zhù"],["在","zài"],["五","wǔ"],["层","céng"],["。",""]]), english: "I live on the fifth floor." },
      { chinese: "图书馆在三层。", pinyinWords: pw([["图","tú"],["书","shū"],["馆","guǎn"],["在","zài"],["三","sān"],["层","céng"],["。",""]]), english: "The library is on the third floor." },
    ],
  },
  {
    id: 114, hanzi: "差", pinyin: "chà", english: "bad, poor, differ from", hskLevel: 2, category: "Adjectives",
    examples: [
      { chinese: "他的汉语说得很差。", pinyinWords: pw([["他","tā"],["的","de"],["汉","hàn"],["语","yǔ"],["说","shuō"],["得","de"],["很","hěn"],["差","chà"],["。",""]]), english: "His Chinese is very poor." },
    ],
  },
  {
    id: 115, hanzi: "超市", pinyin: "chāo shì", english: "supermarket", hskLevel: 2, category: "Places",
    examples: [
      { chinese: "我去超市买东西。", pinyinWords: pw([["我","wǒ"],["去","qù"],["超","chāo"],["市","shì"],["买","mǎi"],["东","dōng"],["西","xi"],["。",""]]), english: "I go to the supermarket to buy things." },
      { chinese: "超市里的东西很便宜。", pinyinWords: pw([["超","chāo"],["市","shì"],["里","lǐ"],["的","de"],["东","dōng"],["西","xi"],["很","hěn"],["便","pián"],["宜","yi"],["。",""]]), english: "Things in the supermarket are very cheap." },
    ],
  },
  {
    id: 116, hanzi: "成绩", pinyin: "chéng jì", english: "grade, result, score", hskLevel: 2, category: "School",
    examples: [
      { chinese: "他的成绩很好。", pinyinWords: pw([["他","tā"],["的","de"],["成","chéng"],["绩","jì"],["很","hěn"],["好","hǎo"],["。",""]]), english: "His grades are very good." },
      { chinese: "这次考试的成绩出来了。", pinyinWords: pw([["这","zhè"],["次","cì"],["考","kǎo"],["试","shì"],["的","de"],["成","chéng"],["绩","jì"],["出","chū"],["来","lái"],["了","le"],["。",""]]), english: "The exam results are out." },
    ],
  },
  {
    id: 117, hanzi: "城市", pinyin: "chéng shì", english: "city", hskLevel: 2, category: "Places",
    examples: [
      { chinese: "上海是一个大城市。", pinyinWords: pw([["上","shàng"],["海","hǎi"],["是","shì"],["一","yī"],["个","gè"],["大","dà"],["城","chéng"],["市","shì"],["。",""]]), english: "Shanghai is a big city." },
    ],
  },
  {
    id: 118, hanzi: "迟到", pinyin: "chí dào", english: "to be late, late arrival", hskLevel: 2, category: "Verbs",
    examples: [
      { chinese: "对不起，我迟到了。", pinyinWords: pw([["对","duì"],["不","bu"],["起","qǐ"],["，",""],["我","wǒ"],["迟","chí"],["到","dào"],["了","le"],["。",""]]), english: "Sorry, I'm late." },
      { chinese: "上课不能迟到。", pinyinWords: pw([["上","shàng"],["课","kè"],["不","bù"],["能","néng"],["迟","chí"],["到","dào"],["。",""]]), english: "You can't be late for class." },
    ],
  },
  {
    id: 119, hanzi: "船", pinyin: "chuán", english: "boat, ship", hskLevel: 2, category: "Transport",
    examples: [
      { chinese: "我坐船去岛上。", pinyinWords: pw([["我","wǒ"],["坐","zuò"],["船","chuán"],["去","qù"],["岛","dǎo"],["上","shàng"],["。",""]]), english: "I go to the island by boat." },
    ],
  },
  {
    id: 120, hanzi: "春", pinyin: "chūn", english: "spring (season)", hskLevel: 2, category: "Nature",
    examples: [
      { chinese: "春天花都开了。", pinyinWords: pw([["春","chūn"],["天","tiān"],["花","huā"],["都","dōu"],["开","kāi"],["了","le"],["。",""]]), english: "Flowers bloom in spring." },
      { chinese: "我最喜欢春天。", pinyinWords: pw([["我","wǒ"],["最","zuì"],["喜","xǐ"],["欢","huān"],["春","chūn"],["天","tiān"],["。",""]]), english: "Spring is my favorite season." },
    ],
  },
  {
    id: 121, hanzi: "聪明", pinyin: "cōng míng", english: "smart, clever, intelligent", hskLevel: 2, category: "Adjectives",
    examples: [
      { chinese: "她的孩子很聪明。", pinyinWords: pw([["她","tā"],["的","de"],["孩","hái"],["子","zi"],["很","hěn"],["聪","cōng"],["明","míng"],["。",""]]), english: "Her child is very smart." },
      { chinese: "你真聪明！", pinyinWords: pw([["你","nǐ"],["真","zhēn"],["聪","cōng"],["明","míng"],["！",""]]), english: "You're so clever!" },
    ],
  },
  {
    id: 122, hanzi: "从", pinyin: "cóng", english: "from, since", hskLevel: 2, category: "Prepositions",
    examples: [
      { chinese: "我从北京来。", pinyinWords: pw([["我","wǒ"],["从","cóng"],["北","Běi"],["京","jīng"],["来","lái"],["。",""]]), english: "I come from Beijing." },
      { chinese: "从这里到学校要二十分钟。", pinyinWords: pw([["从","cóng"],["这","zhè"],["里","lǐ"],["到","dào"],["学","xué"],["校","xiào"],["要","yào"],["二","èr"],["十","shí"],["分","fēn"],["钟","zhōng"],["。",""]]), english: "It takes twenty minutes from here to school." },
    ],
  },
  {
    id: 123, hanzi: "打篮球", pinyin: "dǎ lán qiú", english: "to play basketball", hskLevel: 2, category: "Sports",
    examples: [
      { chinese: "他每天打篮球。", pinyinWords: pw([["他","tā"],["每","měi"],["天","tiān"],["打","dǎ"],["篮","lán"],["球","qiú"],["。",""]]), english: "He plays basketball every day." },
    ],
  },
  {
    id: 124, hanzi: "担心", pinyin: "dān xīn", english: "to worry, to be concerned", hskLevel: 2, category: "Emotions",
    examples: [
      { chinese: "别担心，没问题。", pinyinWords: pw([["别","bié"],["担","dān"],["心","xīn"],["，",""],["没","méi"],["问","wèn"],["题","tí"],["。",""]]), english: "Don't worry, no problem." },
      { chinese: "我很担心他。", pinyinWords: pw([["我","wǒ"],["很","hěn"],["担","dān"],["心","xīn"],["他","tā"],["。",""]]), english: "I'm very worried about him." },
    ],
  },
  {
    id: 125, hanzi: "蛋糕", pinyin: "dàn gāo", english: "cake", hskLevel: 2, category: "Food",
    examples: [
      { chinese: "生日快乐！这是蛋糕。", pinyinWords: pw([["生","shēng"],["日","rì"],["快","kuài"],["乐","lè"],["！",""],["这","zhè"],["是","shì"],["蛋","dàn"],["糕","gāo"],["。",""]]), english: "Happy birthday! Here's the cake." },
      { chinese: "她做的蛋糕很好吃。", pinyinWords: pw([["她","tā"],["做","zuò"],["的","de"],["蛋","dàn"],["糕","gāo"],["很","hěn"],["好","hǎo"],["吃","chī"],["。",""]]), english: "The cake she made is delicious." },
    ],
  },
];

// ─── Re-export getEnrichedVocabulary for backward compat ─────────────────────
export function getEnrichedVocabulary(): VocabWord[] {
  return FALLBACK_VOCABULARY;
}
