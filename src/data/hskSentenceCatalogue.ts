export type CatalogueSentence = {
  chinese: string;
  english: string;
};

/**
 * A small built-in catalogue of HSK 1–2 style sentences.
 * The example generator prefers these over templates to avoid repetitive patterns.
 *
 * NOTE: This is not a complete official corpus; it’s a curated in-app catalogue.
 * Add more sentences over time to increase coverage.
 */
export const HSK_SENTENCE_CATALOGUE: CatalogueSentence[] = [
  { chinese: "你好！", english: "Hello!" },
  { chinese: "你好吗？", english: "How are you?" },
  { chinese: "我很好，谢谢。", english: "I'm fine, thanks." },
  { chinese: "你叫什么名字？", english: "What is your name?" },
  { chinese: "我叫小王。", english: "My name is Xiao Wang." },
  { chinese: "你是哪国人？", english: "What country are you from?" },
  { chinese: "我是中国人。", english: "I am Chinese." },
  { chinese: "我不是北京人。", english: "I’m not from Beijing." },
  { chinese: "你会说汉语吗？", english: "Can you speak Chinese?" },
  { chinese: "我会说一点儿汉语。", english: "I can speak a little Chinese." },
  { chinese: "我们一起学习汉语。", english: "We study Chinese together." },

  { chinese: "今天星期几？", english: "What day is it today?" },
  { chinese: "今天星期一。", english: "Today is Monday." },
  { chinese: "明天你有时间吗？", english: "Do you have time tomorrow?" },
  { chinese: "我明天很忙。", english: "I’m very busy tomorrow." },
  { chinese: "昨天我在家。", english: "Yesterday I was at home." },
  { chinese: "现在几点？", english: "What time is it now?" },
  { chinese: "现在九点。", english: "It’s nine o’clock now." },
  { chinese: "我们九点见面。", english: "We’ll meet at nine." },
  { chinese: "我住在北京。", english: "I live in Beijing." },
  { chinese: "你家在哪儿？", english: "Where is your home?" },
  { chinese: "我家在学校后面。", english: "My home is behind the school." },
  { chinese: "商店在前面。", english: "The shop is in front." },

  { chinese: "请进。", english: "Please come in." },
  { chinese: "请坐。", english: "Please sit down." },
  { chinese: "请给我一杯水。", english: "Please give me a cup of water." },
  { chinese: "我想喝茶。", english: "I want to drink tea." },
  { chinese: "我不喝咖啡。", english: "I don’t drink coffee." },
  { chinese: "这个菜很好吃。", english: "This dish is delicious." },
  { chinese: "我喜欢吃米饭。", english: "I like eating rice." },
  { chinese: "我们去饭馆吃饭吧。", english: "Let’s go to a restaurant to eat." },
  { chinese: "你要不要水果？", english: "Do you want fruit?" },
  { chinese: "我想买苹果。", english: "I want to buy apples." },
  { chinese: "这个苹果多少钱？", english: "How much is this apple?" },
  { chinese: "太贵了。", english: "It’s too expensive." },
  { chinese: "这个不贵，很便宜。", english: "This isn’t expensive; it’s cheap." },
  { chinese: "我买两个。", english: "I’ll buy two." },

  { chinese: "对不起，我来晚了。", english: "Sorry, I’m late." },
  { chinese: "没关系。", english: "It doesn’t matter." },
  { chinese: "不客气。", english: "You’re welcome." },
  { chinese: "谢谢你。", english: "Thank you." },

  { chinese: "我去学校。", english: "I go to school." },
  { chinese: "他在学校学习。", english: "He studies at school." },
  { chinese: "老师在教室。", english: "The teacher is in the classroom." },
  { chinese: "我们认识那个老师。", english: "We know that teacher." },
  { chinese: "我喜欢看电影。", english: "I like watching movies." },
  { chinese: "周末我们去看电影。", english: "We’ll go watch a movie on the weekend." },
  { chinese: "我在图书馆读书。", english: "I read in the library." },

  { chinese: "今天天气很好。", english: "The weather is very good today." },
  { chinese: "今天很冷。", english: "It’s very cold today." },
  { chinese: "今天很热。", english: "It’s very hot today." },
  { chinese: "外面刮风了。", english: "It’s windy outside." },
  { chinese: "下雨了，我们回家吧。", english: "It’s raining; let’s go home." },
  { chinese: "明天可能下雪。", english: "It might snow tomorrow." },

  { chinese: "我坐地铁去公司。", english: "I take the subway to the company." },
  { chinese: "你坐出租车还是坐公共汽车？", english: "Do you take a taxi or the bus?" },
  { chinese: "去机场怎么走？", english: "How do I get to the airport?" },
  { chinese: "这儿是出口。", english: "This is the exit." },

  { chinese: "我有一个弟弟。", english: "I have a younger brother." },
  { chinese: "她有一个女儿。", english: "She has a daughter." },
  { chinese: "我和朋友去公园。", english: "I go to the park with my friend." },
  { chinese: "他很聪明。", english: "He is smart." },
  { chinese: "她很漂亮。", english: "She is pretty." },
  { chinese: "我很高兴认识你。", english: "I’m happy to meet you." },

  { chinese: "我想换一个房间。", english: "I want to change to another room." },
  { chinese: "这个房间很安静。", english: "This room is very quiet." },
  { chinese: "房间里有空调。", english: "There is air conditioning in the room." },

  { chinese: "我忘记了。", english: "I forgot." },
  { chinese: "我记得你的名字。", english: "I remember your name." },
  { chinese: "你明白吗？", english: "Do you understand?" },
  { chinese: "我不太明白。", english: "I don’t quite understand." },

  { chinese: "我打算明年去中国。", english: "I plan to go to China next year." },
  { chinese: "我希望你来北京。", english: "I hope you come to Beijing." },
  { chinese: "我们可以一起去。", english: "We can go together." },

  { chinese: "我在网上买票。", english: "I buy tickets online." },
  { chinese: "我用信用卡付款。", english: "I pay with a credit card." },

  { chinese: "你先走，我马上来。", english: "You go first; I’ll come right away." },
  { chinese: "等一下。", english: "Wait a moment." },

  { chinese: "今天我做作业。", english: "Today I do homework." },
  { chinese: "我需要帮助。", english: "I need help." },
  { chinese: "你能帮忙吗？", english: "Can you help?" },
  { chinese: "当然可以。", english: "Of course." },

  { chinese: "他身体不舒服。", english: "He doesn’t feel well." },
  { chinese: "我感冒了。", english: "I caught a cold." },
  { chinese: "你要去医院吗？", english: "Do you need to go to the hospital?" },
  { chinese: "医生说要休息。", english: "The doctor said to rest." },

  { chinese: "这个问题很简单。", english: "This problem is very simple." },
  { chinese: "这个题不难。", english: "This question isn’t hard." },
  { chinese: "我觉得很难。", english: "I think it’s hard." },

  { chinese: "我开始工作了。", english: "I started working." },
  { chinese: "我还没完成。", english: "I haven’t finished yet." },
  { chinese: "我们终于到了。", english: "We finally arrived." },

  { chinese: "这个颜色是红色。", english: "This color is red." },
  { chinese: "我喜欢蓝色的衣服。", english: "I like blue clothes." },
  { chinese: "这件衣服不贵。", english: "This piece of clothing isn’t expensive." },

  { chinese: "我每天跑步锻炼。", english: "I run every day to exercise." },
  { chinese: "他喜欢踢足球。", english: "He likes playing soccer." },
  { chinese: "我们周末去爬山。", english: "We go climb mountains on the weekend." },

  { chinese: "我正在写电子邮件。", english: "I’m writing an email." },
  { chinese: "我给你打电话。", english: "I’ll call you." },
  { chinese: "你看见我的手机了吗？", english: "Have you seen my phone?" },

  { chinese: "我在找我的护照。", english: "I’m looking for my passport." },
  { chinese: "请把门关上。", english: "Please close the door." },
  { chinese: "我把书放在桌子上。", english: "I put the book on the table." },
  { chinese: "椅子在桌子旁边。", english: "The chair is beside the table." },

  { chinese: "你为什么不来？", english: "Why don’t you come?" },
  { chinese: "因为我没有时间。", english: "Because I don’t have time." },
  { chinese: "所以我们下次见面。", english: "So we’ll meet next time." },
];
