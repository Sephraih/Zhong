import { additionalExamples } from "./additionalExamples";
import type { VocabWord } from "./vocabulary";

export function enrichVocabulary(words: VocabWord[]): VocabWord[] {
  return words.map((word) => {
    const extras = additionalExamples[word.id];
    if (extras && extras.length > 0) {
      return {
        ...word,
        examples: [...word.examples, ...extras].slice(0, 3),
      };
    }
    return word;
  });
}
