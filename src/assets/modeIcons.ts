const imports = import.meta.glob('./modes/*.png', { eager: true, import: 'default' }) as Record<string, string>;

export const modeIcons: Record<string, string> = {
  browse:     imports['./modes/browse.png']     ?? '',
  practice:   imports['./modes/practice.png']   ?? '',
  sentences:  imports['./modes/sentences.png']  ?? '',
  flashcards: imports['./modes/flashcards.png'] ?? '',
  quiz:       imports['./modes/quiz.png']       ?? '',
  analyze:    imports['./modes/analyze.png']    ?? '',
  cards:      imports['./modes/cards.png']      ?? '',
  pinyin:     imports['./modes/pinyin.png']     ?? '',
};
