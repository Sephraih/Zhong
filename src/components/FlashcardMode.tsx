import { useState, useMemo } from "react";
import { HoverCharacter } from "./HoverCharacter";
import { SpeakerButton } from "./SpeakerButton";
import type { VocabWord } from "../data/vocabulary";
import type { LearnedState } from "../hooks/useLearnedState";

export type FlashcardFilter = "all" | "still-learning" | "learned";

interface FlashcardModeProps {
  words: VocabWord[];
  learnedState: LearnedState;
  wordStatusFilter: FlashcardFilter;
}

function extractPinyinForChar(fullPinyin: string, charIndex: number, totalChars: number): string {
  const syllables = splitPinyin(fullPinyin);
  if (totalChars === 1) return fullPinyin;
  if (charIndex < syllables.length) {
    return syllables[charIndex];
  }
  return fullPinyin;
}

function splitPinyin(pinyin: string): string[] {
  const result: string[] = [];
  let current = "";

  const vowels = "aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ";

  for (let i = 0; i < pinyin.length; i++) {
    const ch = pinyin[i];
    if (ch === " ") {
      if (current) result.push(current);
      current = "";
      continue;
    }
    current += ch;

    if (i < pinyin.length - 1) {
      const next = pinyin[i + 1];
      if (next === " ") continue;
      const isCurrentVowel = vowels.includes(ch.toLowerCase());
      const isNextConsonant = !vowels.includes(next.toLowerCase());

      if (isCurrentVowel && isNextConsonant) {
        const remaining = pinyin.slice(i + 1);
        const nextSyllableMatch = remaining.match(/^[bpmfdtnlgkhjqxzhchshrzcsyw]/i);
        if (nextSyllableMatch) {
          if (ch === "n" || (ch === "g" && current.endsWith("ng"))) {
            continue;
          }
          result.push(current);
          current = "";
        }
      }
    }
  }

  if (current) {
    result.push(current);
  }

  if (result.length === 0) {
    return [pinyin];
  }

  return result;
}

export function FlashcardMode({ words, learnedState, wordStatusFilter }: FlashcardModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionKnown, setSessionKnown] = useState<Set<number>>(new Set());
  const [sessionUnknown, setSessionUnknown] = useState<Set<number>>(new Set());

  const { markAsLearned, markAsStillLearning, isLearned } = learnedState;

  // Filter words based on word status filter, then shuffle
  const shuffledWords = useMemo(() => {
    let filtered = words;
    if (wordStatusFilter === "still-learning") {
      filtered = words.filter((w) => !isLearned(w.id));
    } else if (wordStatusFilter === "learned") {
      filtered = words.filter((w) => isLearned(w.id));
    }
    return [...filtered].sort(() => Math.random() - 0.5);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, wordStatusFilter]);

  const currentWord = shuffledWords[currentIndex];

  const handleKnown = () => {
    setSessionKnown((prev) => new Set(prev).add(currentWord.id));
    markAsLearned(currentWord.id);
    nextCard();
  };

  const handleUnknown = () => {
    setSessionUnknown((prev) => new Set(prev).add(currentWord.id));
    markAsStillLearning(currentWord.id);
    nextCard();
  };

  const nextCard = () => {
    setIsFlipped(false);
    if (currentIndex < shuffledWords.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const restart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionKnown(new Set());
    setSessionUnknown(new Set());
  };

  const progress = shuffledWords.length > 0 ? ((currentIndex + 1) / shuffledWords.length) * 100 : 0;
  const isComplete =
    shuffledWords.length > 0 &&
    currentIndex >= shuffledWords.length - 1 &&
    (sessionKnown.has(currentWord?.id) || sessionUnknown.has(currentWord?.id));

  if (shuffledWords.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">📭</div>
        <p className="text-gray-400 text-lg">No words available for the selected filters.</p>
        <p className="text-gray-600 text-sm mt-2">
          {wordStatusFilter === "learned"
            ? "You haven't marked any words as learned yet."
            : wordStatusFilter === "still-learning"
            ? "All words are marked as learned! Great job!"
            : "Adjust your HSK level filter to see words."}
        </p>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-800 p-8">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">Session Complete!</h2>
          <p className="text-gray-400 mb-6">You reviewed {shuffledWords.length} words</p>

          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400">{sessionKnown.size}</div>
              <div className="text-sm text-gray-400">Learned</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">{sessionUnknown.size}</div>
              <div className="text-sm text-gray-400">Still Learning</div>
            </div>
          </div>

          <p className="text-gray-500 text-xs mb-6">Your progress has been saved automatically.</p>

          <button
            onClick={restart}
            className="px-8 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-500 transition-colors shadow-lg shadow-red-900/30"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>
            Card {currentIndex + 1} of {shuffledWords.length}
          </span>
          <span>
            ✅ {sessionKnown.size} · ❌ {sessionUnknown.size}
          </span>
        </div>
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div
        className="bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-800 h-[min(580px,calc(100dvh-260px))] flex flex-col items-center justify-center cursor-pointer select-none hover:border-neutral-700 transition-all relative pb-4 overflow-hidden"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Top-left: HSK badge + learned check */}
        <div className="absolute top-5 left-6 flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              currentWord.hskLevel === 1
                ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/50"
                : "bg-blue-950/80 text-blue-400 border border-blue-800/50"
            }`}
          >
            HSK {currentWord.hskLevel}
          </span>
          {isLearned(currentWord.id) && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-950/80 border border-emerald-800/50">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
        </div>
        <div className="absolute top-5 right-6">
          <span className="text-xs text-gray-600 font-medium">{currentWord.category}</span>
        </div>

        {/* Front Content (always visible, transforms when flipped) */}
        <div className={`flex flex-col items-center transition-all duration-300 ${isFlipped ? "scale-75 -translate-y-12 opacity-40" : "scale-100 translate-y-0 opacity-100"}`}>
          <div className="flex items-end gap-2 justify-center">
            {currentWord.hanzi.split("").map((char, i) => (
              <HoverCharacter
                key={i}
                char={char}
                pinyin={extractPinyinForChar(currentWord.pinyin, i, currentWord.hanzi.length)}
                size="2xl"
              />
            ))}
          </div>
          <div className="mt-4">
            <SpeakerButton text={currentWord.hanzi} size="md" />
          </div>
          {!isFlipped && (
            <p className="text-gray-600 text-sm mt-8">Tap to reveal · Hover characters for pinyin</p>
          )}
        </div>

        {/* Revealed Info (Overlay) */}
        <div
          className={`absolute inset-0 pt-36 pb-6 px-6 w-full flex flex-col items-center overflow-y-auto bg-neutral-900/90 transition-all duration-300 ${
            isFlipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"
          }`}
        >
          <p className="text-red-400 text-xl font-medium mb-1">{currentWord.pinyin}</p>
          <p className="text-white text-3xl font-bold mb-6 text-center">{currentWord.english}</p>

          {currentWord.examples.length > 0 && (
            <div className="space-y-3 mt-4 text-left w-full">
              {currentWord.examples.slice(0, 3).map((example, idx) => (
                <div key={idx} className="p-3 bg-black/40 rounded-xl border border-neutral-800 flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-end gap-0.5 mb-1.5">
                      {example.pinyinWords.map((pw, i) => (
                        <HoverCharacter key={i} char={pw.char} pinyin={pw.pinyin} size="sm" />
                      ))}
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed">{example.english}</p>
                  </div>
                  <SpeakerButton text={example.chinese} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={handleUnknown}
          className="flex-1 py-4 bg-neutral-900 text-red-400 rounded-xl font-semibold hover:bg-red-950/50 transition-colors border border-red-900/40 hover:border-red-700/60"
        >
          ❌ Still Learning
        </button>
        <button
          onClick={handleKnown}
          className="flex-1 py-4 bg-neutral-900 text-emerald-400 rounded-xl font-semibold hover:bg-emerald-950/50 transition-colors border border-emerald-900/40 hover:border-emerald-700/60"
        >
          ✅ I Know This
        </button>
      </div>
    </div>
  );
}
