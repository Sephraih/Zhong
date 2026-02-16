function pw(pairs: [string, string][]): { char: string; pinyin: string }[] {
  return pairs.map(([char, pinyin]) => ({ char, pinyin }));
}

interface Example {
  chinese: string;
  pinyinWords: { char: string; pinyin: string }[];
  english: string;
}

// Additional examples for select words (optional enrichment).
// Keep this file reasonably small to avoid huge client bundles.
export const additionalExamples: Record<number, Example[]> = {
  1: [
    { chinese: "我也很好。", pinyinWords: pw([["我","wǒ"],["也","yě"],["很","hěn"],["好","hǎo"],["。",""]]), english: "I'm also fine." },
    { chinese: "我不太忙。", pinyinWords: pw([["我","wǒ"],["不","bú"],["太","tài"],["忙","máng"],["。",""]]), english: "I'm not too busy." },
  ],
  7: [
    { chinese: "谢谢你的帮助。", pinyinWords: pw([["谢","xiè"],["谢","xie"],["你","nǐ"],["的","de"],["帮","bāng"],["助","zhù"],["。",""]]), english: "Thanks for your help." },
    { chinese: "真的谢谢！", pinyinWords: pw([["真","zhēn"],["的","de"],["谢","xiè"],["谢","xie"],["！",""]]), english: "Really, thank you!" },
  ],
  101: [
    { chinese: "我每天学习一点儿。", pinyinWords: pw([["我","wǒ"],["每","měi"],["天","tiān"],["学","xué"],["习","xí"],["一","yì"],["点","diǎn"],["儿","r"],["。",""]]), english: "I study a little every day." },
  ],
};
