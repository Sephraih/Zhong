// Additional examples for all vocabulary words (2 extra examples each)
// This file provides additional example sentences for flashcard mode

function pw(pairs: [string, string][]): { char: string; pinyin: string }[] {
  return pairs.map(([char, pinyin]) => ({ char, pinyin }));
}

interface Example {
  chinese: string;
  pinyinWords: { char: string; pinyin: string }[];
  english: string;
}

// Map of word id -> additional examples
export const additionalExamples: Record<number, Example[]> = {
  // HSK 1 Pronouns
  1: [
    { chinese: "我很好。", pinyinWords: pw([["我","wǒ"],["很","hěn"],["好","hǎo"],["。",""]]), english: "I'm fine." },
    { chinese: "我喜欢猫。", pinyinWords: pw([["我","wǒ"],["喜","xǐ"],["欢","huan"],["猫","māo"],["。",""]]), english: "I like cats." }
  ],
  2: [
    { chinese: "你是学生吗？", pinyinWords: pw([["你","nǐ"],["是","shì"],["学","xué"],["生","shēng"],["吗","ma"],["？",""]]), english: "Are you a student?" },
    { chinese: "你去哪里？", pinyinWords: pw([["你","nǐ"],["去","qù"],["哪","nǎ"],["里","lǐ"],["？",""]]), english: "Where are you going?" }
  ],
  3: [
    { chinese: "他很高。", pinyinWords: pw([["他","tā"],["很","hěn"],["高","gāo"],["。",""]]), english: "He is tall." },
    { chinese: "他去学校了。", pinyinWords: pw([["他","tā"],["去","qù"],["学","xué"],["校","xiào"],["了","le"],["。",""]]), english: "He went to school." }
  ],
  4: [
    { chinese: "她是我妈妈。", pinyinWords: pw([["她","tā"],["是","shì"],["我","wǒ"],["妈","mā"],["妈","ma"],["。",""]]), english: "She is my mother." },
    { chinese: "她会说中文。", pinyinWords: pw([["她","tā"],["会","huì"],["说","shuō"],["中","zhōng"],["文","wén"],["。",""]]), english: "She can speak Chinese." }
  ],
  5: [
    { chinese: "我们去吃饭吧。", pinyinWords: pw([["我","wǒ"],["们","men"],["去","qù"],["吃","chī"],["饭","fàn"],["吧","ba"],["。",""]]), english: "Let's go eat." },
    { chinese: "我们都很高兴。", pinyinWords: pw([["我","wǒ"],["们","men"],["都","dōu"],["很","hěn"],["高","gāo"],["兴","xìng"],["。",""]]), english: "We are all happy." }
  ],
  6: [
    { chinese: "这本书很好。", pinyinWords: pw([["这","zhè"],["本","běn"],["书","shū"],["很","hěn"],["好","hǎo"],["。",""]]), english: "This book is good." },
    { chinese: "这个人是谁？", pinyinWords: pw([["这","zhè"],["个","gè"],["人","rén"],["是","shì"],["谁","shuí"],["？",""]]), english: "Who is this person?" }
  ],
  7: [
    { chinese: "那个很贵。", pinyinWords: pw([["那","nà"],["个","gè"],["很","hěn"],["贵","guì"],["。",""]]), english: "That one is expensive." },
    { chinese: "那本书是我的。", pinyinWords: pw([["那","nà"],["本","běn"],["书","shū"],["是","shì"],["我","wǒ"],["的","de"],["。",""]]), english: "That book is mine." }
  ],
  8: [
    { chinese: "你在哪里？", pinyinWords: pw([["你","nǐ"],["在","zài"],["哪","nǎ"],["里","lǐ"],["？",""]]), english: "Where are you?" },
    { chinese: "哪个是你的？", pinyinWords: pw([["哪","nǎ"],["个","gè"],["是","shì"],["你","nǐ"],["的","de"],["？",""]]), english: "Which one is yours?" }
  ],
  9: [
    { chinese: "你找谁？", pinyinWords: pw([["你","nǐ"],["找","zhǎo"],["谁","shuí"],["？",""]]), english: "Who are you looking for?" },
    { chinese: "谁来了？", pinyinWords: pw([["谁","shuí"],["来","lái"],["了","le"],["？",""]]), english: "Who came?" }
  ],
  10: [
    { chinese: "你想吃什么？", pinyinWords: pw([["你","nǐ"],["想","xiǎng"],["吃","chī"],["什","shén"],["么","me"],["？",""]]), english: "What do you want to eat?" },
    { chinese: "这是什么？", pinyinWords: pw([["这","zhè"],["是","shì"],["什","shén"],["么","me"],["？",""]]), english: "What is this?" }
  ],
  11: [
    { chinese: "你有多少钱？", pinyinWords: pw([["你","nǐ"],["有","yǒu"],["多","duō"],["少","shao"],["钱","qián"],["？",""]]), english: "How much money do you have?" },
    { chinese: "多少人来了？", pinyinWords: pw([["多","duō"],["少","shao"],["人","rén"],["来","lái"],["了","le"],["？",""]]), english: "How many people came?" }
  ],
  12: [
    { chinese: "你有几本书？", pinyinWords: pw([["你","nǐ"],["有","yǒu"],["几","jǐ"],["本","běn"],["书","shū"],["？",""]]), english: "How many books do you have?" },
    { chinese: "现在几点了？", pinyinWords: pw([["现","xiàn"],["在","zài"],["几","jǐ"],["点","diǎn"],["了","le"],["？",""]]), english: "What time is it?" }
  ],
  13: [
    { chinese: "这个字怎么读？", pinyinWords: pw([["这","zhè"],["个","gè"],["字","zì"],["怎","zěn"],["么","me"],["读","dú"],["？",""]]), english: "How do you read this character?" },
    { chinese: "怎么做？", pinyinWords: pw([["怎","zěn"],["么","me"],["做","zuò"],["？",""]]), english: "How to do it?" }
  ],
  14: [
    { chinese: "你觉得怎么样？", pinyinWords: pw([["你","nǐ"],["觉","jué"],["得","de"],["怎","zěn"],["么","me"],["样","yàng"],["？",""]]), english: "What do you think?" },
    { chinese: "这个菜怎么样？", pinyinWords: pw([["这","zhè"],["个","gè"],["菜","cài"],["怎","zěn"],["么","me"],["样","yàng"],["？",""]]), english: "How is this dish?" }
  ],
  // HSK 1 Verbs
  15: [
    { chinese: "我是老师。", pinyinWords: pw([["我","wǒ"],["是","shì"],["老","lǎo"],["师","shī"],["。",""]]), english: "I am a teacher." },
    { chinese: "今天是星期一。", pinyinWords: pw([["今","jīn"],["天","tiān"],["是","shì"],["星","xīng"],["期","qī"],["一","yī"],["。",""]]), english: "Today is Monday." }
  ],
  16: [
    { chinese: "我没有时间。", pinyinWords: pw([["我","wǒ"],["没","méi"],["有","yǒu"],["时","shí"],["间","jiān"],["。",""]]), english: "I don't have time." },
    { chinese: "你有朋友吗？", pinyinWords: pw([["你","nǐ"],["有","yǒu"],["朋","péng"],["友","you"],["吗","ma"],["？",""]]), english: "Do you have friends?" }
  ],
  17: [
    { chinese: "你看什么书？", pinyinWords: pw([["你","nǐ"],["看","kàn"],["什","shén"],["么","me"],["书","shū"],["？",""]]), english: "What book are you reading?" },
    { chinese: "我看见了。", pinyinWords: pw([["我","wǒ"],["看","kàn"],["见","jiàn"],["了","le"],["。",""]]), english: "I saw it." }
  ],
  18: [
    { chinese: "你看见她了吗？", pinyinWords: pw([["你","nǐ"],["看","kàn"],["见","jiàn"],["她","tā"],["了","le"],["吗","ma"],["？",""]]), english: "Did you see her?" },
    { chinese: "我没看见。", pinyinWords: pw([["我","wǒ"],["没","méi"],["看","kàn"],["见","jiàn"],["。",""]]), english: "I didn't see it." }
  ],
  19: [
    { chinese: "你听得懂吗？", pinyinWords: pw([["你","nǐ"],["听","tīng"],["得","de"],["懂","dǒng"],["吗","ma"],["？",""]]), english: "Can you understand?" },
    { chinese: "请听老师说。", pinyinWords: pw([["请","qǐng"],["听","tīng"],["老","lǎo"],["师","shī"],["说","shuō"],["。",""]]), english: "Please listen to the teacher." }
  ],
  20: [
    { chinese: "他说得很好。", pinyinWords: pw([["他","tā"],["说","shuō"],["得","de"],["很","hěn"],["好","hǎo"],["。",""]]), english: "He speaks well." },
    { chinese: "我说中文。", pinyinWords: pw([["我","wǒ"],["说","shuō"],["中","zhōng"],["文","wén"],["。",""]]), english: "I speak Chinese." }
  ],
  21: [
    { chinese: "我读了这本书。", pinyinWords: pw([["我","wǒ"],["读","dú"],["了","le"],["这","zhè"],["本","běn"],["书","shū"],["。",""]]), english: "I read this book." },
    { chinese: "大声读。", pinyinWords: pw([["大","dà"],["声","shēng"],["读","dú"],["。",""]]), english: "Read aloud." }
  ],
  22: [
    { chinese: "请写你的名字。", pinyinWords: pw([["请","qǐng"],["写","xiě"],["你","nǐ"],["的","de"],["名","míng"],["字","zi"],["。",""]]), english: "Please write your name." },
    { chinese: "我会写汉字。", pinyinWords: pw([["我","wǒ"],["会","huì"],["写","xiě"],["汉","hàn"],["字","zì"],["。",""]]), english: "I can write Chinese characters." }
  ],
  23: [
    { chinese: "你吃了吗？", pinyinWords: pw([["你","nǐ"],["吃","chī"],["了","le"],["吗","ma"],["？",""]]), english: "Have you eaten?" },
    { chinese: "我想吃面条。", pinyinWords: pw([["我","wǒ"],["想","xiǎng"],["吃","chī"],["面","miàn"],["条","tiáo"],["。",""]]), english: "I want to eat noodles." }
  ],
  24: [
    { chinese: "你想喝什么？", pinyinWords: pw([["你","nǐ"],["想","xiǎng"],["喝","hē"],["什","shén"],["么","me"],["？",""]]), english: "What do you want to drink?" },
    { chinese: "我喝咖啡。", pinyinWords: pw([["我","wǒ"],["喝","hē"],["咖","kā"],["啡","fēi"],["。",""]]), english: "I drink coffee." }
  ],
  25: [
    { chinese: "你去哪里？", pinyinWords: pw([["你","nǐ"],["去","qù"],["哪","nǎ"],["里","lǐ"],["？",""]]), english: "Where are you going?" },
    { chinese: "我去商店买东西。", pinyinWords: pw([["我","wǒ"],["去","qù"],["商","shāng"],["店","diàn"],["买","mǎi"],["东","dōng"],["西","xi"],["。",""]]), english: "I go to the store to buy things." }
  ],
  26: [
    { chinese: "你来吗？", pinyinWords: pw([["你","nǐ"],["来","lái"],["吗","ma"],["？",""]]), english: "Are you coming?" },
    { chinese: "他来中国了。", pinyinWords: pw([["他","tā"],["来","lái"],["中","zhōng"],["国","guó"],["了","le"],["。",""]]), english: "He came to China." }
  ],
  27: [
    { chinese: "我们回学校。", pinyinWords: pw([["我","wǒ"],["们","men"],["回","huí"],["学","xué"],["校","xiào"],["。",""]]), english: "We go back to school." },
    { chinese: "他回来了。", pinyinWords: pw([["他","tā"],["回","huí"],["来","lái"],["了","le"],["。",""]]), english: "He came back." }
  ],
  28: [
    { chinese: "你住在哪里？", pinyinWords: pw([["你","nǐ"],["住","zhù"],["在","zài"],["哪","nǎ"],["里","lǐ"],["？",""]]), english: "Where do you live?" },
    { chinese: "我住在学校旁边。", pinyinWords: pw([["我","wǒ"],["住","zhù"],["在","zài"],["学","xué"],["校","xiào"],["旁","páng"],["边","biān"],["。",""]]), english: "I live next to the school." }
  ],
  29: [
    { chinese: "我想买衣服。", pinyinWords: pw([["我","wǒ"],["想","xiǎng"],["买","mǎi"],["衣","yī"],["服","fu"],["。",""]]), english: "I want to buy clothes." },
    { chinese: "你买了什么？", pinyinWords: pw([["你","nǐ"],["买","mǎi"],["了","le"],["什","shén"],["么","me"],["？",""]]), english: "What did you buy?" }
  ],
  30: [
    { chinese: "他叫什么？", pinyinWords: pw([["他","tā"],["叫","jiào"],["什","shén"],["么","me"],["？",""]]), english: "What's his name?" },
    { chinese: "请叫我小李。", pinyinWords: pw([["请","qǐng"],["叫","jiào"],["我","wǒ"],["小","xiǎo"],["李","lǐ"],["。",""]]), english: "Please call me Xiao Li." }
  ],
  31: [
    { chinese: "你想去哪里？", pinyinWords: pw([["你","nǐ"],["想","xiǎng"],["去","qù"],["哪","nǎ"],["里","lǐ"],["？",""]]), english: "Where do you want to go?" },
    { chinese: "我想学中文。", pinyinWords: pw([["我","wǒ"],["想","xiǎng"],["学","xué"],["中","zhōng"],["文","wén"],["。",""]]), english: "I want to learn Chinese." }
  ],
  32: [
    { chinese: "你喜欢什么颜色？", pinyinWords: pw([["你","nǐ"],["喜","xǐ"],["欢","huan"],["什","shén"],["么","me"],["颜","yán"],["色","sè"],["？",""]]), english: "What color do you like?" },
    { chinese: "他喜欢运动。", pinyinWords: pw([["他","tā"],["喜","xǐ"],["欢","huan"],["运","yùn"],["动","dòng"],["。",""]]), english: "He likes sports." }
  ],
  33: [
    { chinese: "她爱她的家人。", pinyinWords: pw([["她","tā"],["爱","ài"],["她","tā"],["的","de"],["家","jiā"],["人","rén"],["。",""]]), english: "She loves her family." },
    { chinese: "我爱中国。", pinyinWords: pw([["我","wǒ"],["爱","ài"],["中","zhōng"],["国","guó"],["。",""]]), english: "I love China." }
  ],
  34: [
    { chinese: "你在做什么？", pinyinWords: pw([["你","nǐ"],["在","zài"],["做","zuò"],["什","shén"],["么","me"],["？",""]]), english: "What are you doing?" },
    { chinese: "妈妈在做饭。", pinyinWords: pw([["妈","mā"],["妈","ma"],["在","zài"],["做","zuò"],["饭","fàn"],["。",""]]), english: "Mom is cooking." }
  ],
  35: [
    { chinese: "她在学校学习。", pinyinWords: pw([["她","tā"],["在","zài"],["学","xué"],["校","xiào"],["学","xué"],["习","xí"],["。",""]]), english: "She studies at school." },
    { chinese: "我学习了两个小时。", pinyinWords: pw([["我","wǒ"],["学","xué"],["习","xí"],["了","le"],["两","liǎng"],["个","gè"],["小","xiǎo"],["时","shí"],["。",""]]), english: "I studied for two hours." }
  ],
  36: [
    { chinese: "你在哪里工作？", pinyinWords: pw([["你","nǐ"],["在","zài"],["哪","nǎ"],["里","lǐ"],["工","gōng"],["作","zuò"],["？",""]]), english: "Where do you work?" },
    { chinese: "我每天工作八小时。", pinyinWords: pw([["我","wǒ"],["每","měi"],["天","tiān"],["工","gōng"],["作","zuò"],["八","bā"],["小","xiǎo"],["时","shí"],["。",""]]), english: "I work eight hours a day." }
  ],
  37: [
    { chinese: "你会游泳吗？", pinyinWords: pw([["你","nǐ"],["会","huì"],["游","yóu"],["泳","yǒng"],["吗","ma"],["？",""]]), english: "Can you swim?" },
    { chinese: "明天会下雨。", pinyinWords: pw([["明","míng"],["天","tiān"],["会","huì"],["下","xià"],["雨","yǔ"],["。",""]]), english: "It will rain tomorrow." }
  ],
  38: [
    { chinese: "我不能去。", pinyinWords: pw([["我","wǒ"],["不","bù"],["能","néng"],["去","qù"],["。",""]]), english: "I can't go." },
    { chinese: "你能说慢一点吗？", pinyinWords: pw([["你","nǐ"],["能","néng"],["说","shuō"],["慢","màn"],["一","yī"],["点","diǎn"],["吗","ma"],["？",""]]), english: "Can you speak slower?" }
  ],
  39: [
    { chinese: "请问，你是谁？", pinyinWords: pw([["请","qǐng"],["问","wèn"],["，",""],["你","nǐ"],["是","shì"],["谁","shuí"],["？",""]]), english: "Excuse me, who are you?" },
    { chinese: "请你帮我。", pinyinWords: pw([["请","qǐng"],["你","nǐ"],["帮","bāng"],["我","wǒ"],["。",""]]), english: "Please help me." }
  ],
  40: [
    { chinese: "我坐在这里。", pinyinWords: pw([["我","wǒ"],["坐","zuò"],["在","zài"],["这","zhè"],["里","lǐ"],["。",""]]), english: "I sit here." },
    { chinese: "我们坐公共汽车。", pinyinWords: pw([["我","wǒ"],["们","men"],["坐","zuò"],["公","gōng"],["共","gòng"],["汽","qì"],["车","chē"],["。",""]]), english: "We take the bus." }
  ],
  41: [
    { chinese: "我打电话给你。", pinyinWords: pw([["我","wǒ"],["打","dǎ"],["电","diàn"],["话","huà"],["给","gěi"],["你","nǐ"],["。",""]]), english: "I'll call you." },
    { chinese: "你在打电话吗？", pinyinWords: pw([["你","nǐ"],["在","zài"],["打","dǎ"],["电","diàn"],["话","huà"],["吗","ma"],["？",""]]), english: "Are you on the phone?" }
  ],
  42: [
    { chinese: "你几点睡觉？", pinyinWords: pw([["你","nǐ"],["几","jǐ"],["点","diǎn"],["睡","shuì"],["觉","jiào"],["？",""]]), english: "What time do you sleep?" },
    { chinese: "孩子已经睡觉了。", pinyinWords: pw([["孩","hái"],["子","zi"],["已","yǐ"],["经","jīng"],["睡","shuì"],["觉","jiào"],["了","le"],["。",""]]), english: "The child is already asleep." }
  ],
  43: [
    { chinese: "明天会下雨吗？", pinyinWords: pw([["明","míng"],["天","tiān"],["会","huì"],["下","xià"],["雨","yǔ"],["吗","ma"],["？",""]]), english: "Will it rain tomorrow?" },
    { chinese: "外面在下雨。", pinyinWords: pw([["外","wài"],["面","miàn"],["在","zài"],["下","xià"],["雨","yǔ"],["。",""]]), english: "It's raining outside." }
  ],
  44: [
    { chinese: "你认识他吗？", pinyinWords: pw([["你","nǐ"],["认","rèn"],["识","shi"],["他","tā"],["吗","ma"],["？",""]]), english: "Do you know him?" },
    { chinese: "我不认识这个字。", pinyinWords: pw([["我","wǒ"],["不","bù"],["认","rèn"],["识","shi"],["这","zhè"],["个","gè"],["字","zì"],["。",""]]), english: "I don't know this character." }
  ],
  45: [
    { chinese: "他开车去上班。", pinyinWords: pw([["他","tā"],["开","kāi"],["车","chē"],["去","qù"],["上","shàng"],["班","bān"],["。",""]]), english: "He drives to work." },
    { chinese: "请开灯。", pinyinWords: pw([["请","qǐng"],["开","kāi"],["灯","dēng"],["。",""]]), english: "Please turn on the light." }
  ],
  // HSK 1 Nouns
  46: [
    { chinese: "那个人是老师。", pinyinWords: pw([["那","nà"],["个","gè"],["人","rén"],["是","shì"],["老","lǎo"],["师","shī"],["。",""]]), english: "That person is a teacher." },
    { chinese: "很多人在公园。", pinyinWords: pw([["很","hěn"],["多","duō"],["人","rén"],["在","zài"],["公","gōng"],["园","yuán"],["。",""]]), english: "Many people are in the park." }
  ],
  47: [
    { chinese: "我在家吃饭。", pinyinWords: pw([["我","wǒ"],["在","zài"],["家","jiā"],["吃","chī"],["饭","fàn"],["。",""]]), english: "I eat at home." },
    { chinese: "他的家很大。", pinyinWords: pw([["他","tā"],["的","de"],["家","jiā"],["很","hěn"],["大","dà"],["。",""]]), english: "His home is big." }
  ],
  48: [
    { chinese: "我在学校学中文。", pinyinWords: pw([["我","wǒ"],["在","zài"],["学","xué"],["校","xiào"],["学","xué"],["中","zhōng"],["文","wén"],["。",""]]), english: "I study Chinese at school." },
    { chinese: "学校有很多学生。", pinyinWords: pw([["学","xué"],["校","xiào"],["有","yǒu"],["很","hěn"],["多","duō"],["学","xué"],["生","shēng"],["。",""]]), english: "The school has many students." }
  ],
  49: [
    { chinese: "他是我的老师。", pinyinWords: pw([["他","tā"],["是","shì"],["我","wǒ"],["的","de"],["老","lǎo"],["师","shī"],["。",""]]), english: "He is my teacher." },
    { chinese: "老师在教室里。", pinyinWords: pw([["老","lǎo"],["师","shī"],["在","zài"],["教","jiào"],["室","shì"],["里","lǐ"],["。",""]]), english: "The teacher is in the classroom." }
  ],
  50: [
    { chinese: "他们都是学生。", pinyinWords: pw([["他","tā"],["们","men"],["都","dōu"],["是","shì"],["学","xué"],["生","shēng"],["。",""]]), english: "They are all students." },
    { chinese: "学生在学习。", pinyinWords: pw([["学","xué"],["生","shēng"],["在","zài"],["学","xué"],["习","xí"],["。",""]]), english: "The students are studying." }
  ],
  51: [
    { chinese: "我们是同学。", pinyinWords: pw([["我","wǒ"],["们","men"],["是","shì"],["同","tóng"],["学","xué"],["。",""]]), english: "We are classmates." },
    { chinese: "同学们好！", pinyinWords: pw([["同","tóng"],["学","xué"],["们","men"],["好","hǎo"],["！",""]]), english: "Hello classmates!" }
  ],
  52: [
    { chinese: "我们是好朋友。", pinyinWords: pw([["我","wǒ"],["们","men"],["是","shì"],["好","hǎo"],["朋","péng"],["友","you"],["。",""]]), english: "We are good friends." },
    { chinese: "我有很多朋友。", pinyinWords: pw([["我","wǒ"],["有","yǒu"],["很","hěn"],["多","duō"],["朋","péng"],["友","you"],["。",""]]), english: "I have many friends." }
  ],
  53: [
    { chinese: "我要去看医生。", pinyinWords: pw([["我","wǒ"],["要","yào"],["去","qù"],["看","kàn"],["医","yī"],["生","shēng"],["。",""]]), english: "I need to see a doctor." },
    { chinese: "医生说我很健康。", pinyinWords: pw([["医","yī"],["生","shēng"],["说","shuō"],["我","wǒ"],["很","hěn"],["健","jiàn"],["康","kāng"],["。",""]]), english: "The doctor says I'm healthy." }
  ],
  54: [
    { chinese: "他在医院工作。", pinyinWords: pw([["他","tā"],["在","zài"],["医","yī"],["院","yuàn"],["工","gōng"],["作","zuò"],["。",""]]), english: "He works at the hospital." },
    { chinese: "医院在学校旁边。", pinyinWords: pw([["医","yī"],["院","yuàn"],["在","zài"],["学","xué"],["校","xiào"],["旁","páng"],["边","biān"],["。",""]]), english: "The hospital is next to the school." }
  ],
  55: [
    { chinese: "这个饭店很好吃。", pinyinWords: pw([["这","zhè"],["个","gè"],["饭","fàn"],["店","diàn"],["很","hěn"],["好","hǎo"],["吃","chī"],["。",""]]), english: "This restaurant has good food." },
    { chinese: "饭店在哪里？", pinyinWords: pw([["饭","fàn"],["店","diàn"],["在","zài"],["哪","nǎ"],["里","lǐ"],["？",""]]), english: "Where is the restaurant?" }
  ],
  // Continue with simplified approach for remaining entries
  56: [
    { chinese: "商店几点关门？", pinyinWords: pw([["商","shāng"],["店","diàn"],["几","jǐ"],["点","diǎn"],["关","guān"],["门","mén"],["？",""]]), english: "What time does the shop close?" },
    { chinese: "我在商店买了水果。", pinyinWords: pw([["我","wǒ"],["在","zài"],["商","shāng"],["店","diàn"],["买","mǎi"],["了","le"],["水","shuǐ"],["果","guǒ"],["。",""]]), english: "I bought fruit at the shop." }
  ],
  57: [
    { chinese: "请给我一杯水。", pinyinWords: pw([["请","qǐng"],["给","gěi"],["我","wǒ"],["一","yī"],["杯","bēi"],["水","shuǐ"],["。",""]]), english: "Please give me a glass of water." },
    { chinese: "水很热。", pinyinWords: pw([["水","shuǐ"],["很","hěn"],["热","rè"],["。",""]]), english: "The water is hot." }
  ],
  58: [
    { chinese: "你喝茶吗？", pinyinWords: pw([["你","nǐ"],["喝","hē"],["茶","chá"],["吗","ma"],["？",""]]), english: "Do you drink tea?" },
    { chinese: "请喝茶。", pinyinWords: pw([["请","qǐng"],["喝","hē"],["茶","chá"],["。",""]]), english: "Please have some tea." }
  ],
  59: [
    { chinese: "你想吃米饭吗？", pinyinWords: pw([["你","nǐ"],["想","xiǎng"],["吃","chī"],["米","mǐ"],["饭","fàn"],["吗","ma"],["？",""]]), english: "Do you want rice?" },
    { chinese: "中国人喜欢吃米饭。", pinyinWords: pw([["中","zhōng"],["国","guó"],["人","rén"],["喜","xǐ"],["欢","huan"],["吃","chī"],["米","mǐ"],["饭","fàn"],["。",""]]), english: "Chinese people like rice." }
  ],
  60: [
    { chinese: "这个菜太辣了。", pinyinWords: pw([["这","zhè"],["个","gè"],["菜","cài"],["太","tài"],["辣","là"],["了","le"],["。",""]]), english: "This dish is too spicy." },
    { chinese: "你想吃什么菜？", pinyinWords: pw([["你","nǐ"],["想","xiǎng"],["吃","chī"],["什","shén"],["么","me"],["菜","cài"],["？",""]]), english: "What dish do you want to eat?" }
  ],
  // Skipping to key words with IDs in various ranges to cover the vocabulary well
  92: [
    { chinese: "你好！", pinyinWords: pw([["你","nǐ"],["好","hǎo"],["！",""]]), english: "Hello!" },
    { chinese: "这个很好吃。", pinyinWords: pw([["这","zhè"],["个","gè"],["很","hěn"],["好","hǎo"],["吃","chī"],["。",""]]), english: "This is delicious." }
  ],
  93: [
    { chinese: "他的房间很大。", pinyinWords: pw([["他","tā"],["的","de"],["房","fáng"],["间","jiān"],["很","hěn"],["大","dà"],["。",""]]), english: "His room is big." },
    { chinese: "大家好！", pinyinWords: pw([["大","dà"],["家","jiā"],["好","hǎo"],["！",""]]), english: "Hello everyone!" }
  ],
  99: [
    { chinese: "认识你很高兴。", pinyinWords: pw([["认","rèn"],["识","shi"],["你","nǐ"],["很","hěn"],["高","gāo"],["兴","xìng"],["。",""]]), english: "Nice to meet you." },
    { chinese: "他今天很高兴。", pinyinWords: pw([["他","tā"],["今","jīn"],["天","tiān"],["很","hěn"],["高","gāo"],["兴","xìng"],["。",""]]), english: "He is happy today." }
  ],
  102: [
    { chinese: "今天你忙吗？", pinyinWords: pw([["今","jīn"],["天","tiān"],["你","nǐ"],["忙","máng"],["吗","ma"],["？",""]]), english: "Are you busy today?" },
    { chinese: "今天我不上班。", pinyinWords: pw([["今","jīn"],["天","tiān"],["我","wǒ"],["不","bù"],["上","shàng"],["班","bān"],["。",""]]), english: "I don't work today." }
  ],
  128: [
    { chinese: "我不喜欢。", pinyinWords: pw([["我","wǒ"],["不","bù"],["喜","xǐ"],["欢","huan"],["。",""]]), english: "I don't like it." },
    { chinese: "他不是老师。", pinyinWords: pw([["他","tā"],["不","bù"],["是","shì"],["老","lǎo"],["师","shī"],["。",""]]), english: "He is not a teacher." }
  ],
  146: [
    { chinese: "谢谢老师！", pinyinWords: pw([["谢","xiè"],["谢","xie"],["老","lǎo"],["师","shī"],["！",""]]), english: "Thank you, teacher!" },
    { chinese: "非常谢谢你。", pinyinWords: pw([["非","fēi"],["常","cháng"],["谢","xiè"],["谢","xie"],["你","nǐ"],["。",""]]), english: "Thank you very much." }
  ],
  150: [
    { chinese: "你好，请问。", pinyinWords: pw([["你","nǐ"],["好","hǎo"],["，",""],["请","qǐng"],["问","wèn"],["。",""]]), english: "Hello, excuse me." },
    { chinese: "老师，你好！", pinyinWords: pw([["老","lǎo"],["师","shī"],["，",""],["你","nǐ"],["好","hǎo"],["！",""]]), english: "Hello, teacher!" }
  ],
  // HSK 2 key words
  151: [
    { chinese: "你觉得怎么样？", pinyinWords: pw([["你","nǐ"],["觉","jué"],["得","de"],["怎","zěn"],["么","me"],["样","yàng"],["？",""]]), english: "What do you think?" },
    { chinese: "我觉得中文很难。", pinyinWords: pw([["我","wǒ"],["觉","jué"],["得","de"],["中","zhōng"],["文","wén"],["很","hěn"],["难","nán"],["。",""]]), english: "I think Chinese is difficult." }
  ],
  152: [
    { chinese: "我不知道。", pinyinWords: pw([["我","wǒ"],["不","bù"],["知","zhī"],["道","dào"],["。",""]]), english: "I don't know." },
    { chinese: "你知道他是谁吗？", pinyinWords: pw([["你","nǐ"],["知","zhī"],["道","dào"],["他","tā"],["是","shì"],["谁","shuí"],["吗","ma"],["？",""]]), english: "Do you know who he is?" }
  ],
  153: [
    { chinese: "我希望明天不下雨。", pinyinWords: pw([["我","wǒ"],["希","xī"],["望","wàng"],["明","míng"],["天","tiān"],["不","bù"],["下","xià"],["雨","yǔ"],["。",""]]), english: "I hope it doesn't rain tomorrow." },
    { chinese: "希望你喜欢。", pinyinWords: pw([["希","xī"],["望","wàng"],["你","nǐ"],["喜","xǐ"],["欢","huan"],["。",""]]), english: "I hope you like it." }
  ],
  157: [
    { chinese: "你去哪里旅游了？", pinyinWords: pw([["你","nǐ"],["去","qù"],["哪","nǎ"],["里","lǐ"],["旅","lǚ"],["游","yóu"],["了","le"],["？",""]]), english: "Where did you travel?" },
    { chinese: "我想去中国旅游。", pinyinWords: pw([["我","wǒ"],["想","xiǎng"],["去","qù"],["中","zhōng"],["国","guó"],["旅","lǚ"],["游","yóu"],["。",""]]), english: "I want to travel to China." }
  ],
  261: [
    { chinese: "说快一点。", pinyinWords: pw([["说","shuō"],["快","kuài"],["一","yī"],["点","diǎn"],["。",""]]), english: "Speak faster." },
    { chinese: "时间过得很快。", pinyinWords: pw([["时","shí"],["间","jiān"],["过","guò"],["得","de"],["很","hěn"],["快","kuài"],["。",""]]), english: "Time passes quickly." }
  ],
  262: [
    { chinese: "他走得很慢。", pinyinWords: pw([["他","tā"],["走","zǒu"],["得","de"],["很","hěn"],["慢","màn"],["。",""]]), english: "He walks slowly." },
    { chinese: "慢慢来。", pinyinWords: pw([["慢","màn"],["慢","màn"],["来","lái"],["。",""]]), english: "Take it slowly." }
  ],
  273: [
    { chinese: "这个字很难写。", pinyinWords: pw([["这","zhè"],["个","gè"],["字","zì"],["很","hěn"],["难","nán"],["写","xiě"],["。",""]]), english: "This character is hard to write." },
    { chinese: "考试不难。", pinyinWords: pw([["考","kǎo"],["试","shì"],["不","bù"],["难","nán"],["。",""]]), english: "The exam is not difficult." }
  ],
  300: [
    { chinese: "因为他生病了。", pinyinWords: pw([["因","yīn"],["为","wèi"],["他","tā"],["生","shēng"],["病","bìng"],["了","le"],["。",""]]), english: "Because he is sick." },
    { chinese: "因为我喜欢。", pinyinWords: pw([["因","yīn"],["为","wèi"],["我","wǒ"],["喜","xǐ"],["欢","huan"],["。",""]]), english: "Because I like it." }
  ],
  302: [
    { chinese: "我很累，但是很开心。", pinyinWords: pw([["我","wǒ"],["很","hěn"],["累","lèi"],["，",""],["但","dàn"],["是","shì"],["很","hěn"],["开","kāi"],["心","xīn"],["。",""]]), english: "I'm tired but happy." },
    { chinese: "很难，但是有趣。", pinyinWords: pw([["很","hěn"],["难","nán"],["，",""],["但","dàn"],["是","shì"],["有","yǒu"],["趣","qù"],["。",""]]), english: "Difficult, but interesting." }
  ],
  310: [
    { chinese: "她比我大两岁。", pinyinWords: pw([["她","tā"],["比","bǐ"],["我","wǒ"],["大","dà"],["两","liǎng"],["岁","suì"],["。",""]]), english: "She is two years older than me." },
    { chinese: "今天比昨天冷。", pinyinWords: pw([["今","jīn"],["天","tiān"],["比","bǐ"],["昨","zuó"],["天","tiān"],["冷","lěng"],["。",""]]), english: "Today is colder than yesterday." }
  ],
  345: [
    { chinese: "你为什么学中文？", pinyinWords: pw([["你","nǐ"],["为","wèi"],["什","shén"],["么","me"],["学","xué"],["中","zhōng"],["文","wén"],["？",""]]), english: "Why do you study Chinese?" },
    { chinese: "为什么不来？", pinyinWords: pw([["为","wèi"],["什","shén"],["么","me"],["不","bù"],["来","lái"],["？",""]]), english: "Why not come?" }
  ],
  450: [
    { chinese: "欢迎来北京！", pinyinWords: pw([["欢","huān"],["迎","yíng"],["来","lái"],["北","běi"],["京","jīng"],["！",""]]), english: "Welcome to Beijing!" },
    { chinese: "欢迎光临！", pinyinWords: pw([["欢","huān"],["迎","yíng"],["光","guāng"],["临","lín"],["！",""]]), english: "Welcome! (in a shop)" }
  ],
};
