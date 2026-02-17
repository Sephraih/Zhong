import { vocabulary, type VocabWord } from "./vocabulary";
import { additionalExamples } from "./additionalExamples";

export function getEnrichedVocabulary(): VocabWord[] {
  return vocabulary.map((word) => {
    const extras = additionalExamples[word.id];
    if (extras && extras.length > 0) {
      return {
        ...word,
        examples: [...word.examples, ...extras],
      };
    }
    return word;
  });
}
