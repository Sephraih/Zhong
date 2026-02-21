import { useState, useMemo, useCallback } from "react";
import { HoverCharacter, isHoverCharacterEvent } from "./HoverCharacter";
import { SpeakerButton } from "./SpeakerButton";
import { getHskBadgeClasses } from "../utils/hskColors";
import type { VocabWord } from "../data/vocabulary";
import type { LearnedState } from "../hooks/useLearnedState";

export type FlashcardFilter = "all" | "still-learning" | "learned";

interface FlashcardModeProps {
  allWords: VocabWord[];
  learnedState: LearnedState;
  wordStatusFilter: FlashcardFilter;
}

const HSK_LEVELS = [1, 2, 3, 4] as const;
type HskLevel = (typeof HSK_LEVELS)[number];

function getHskButtonClasses(level: HskLevel, isSelected: boolean): string {
  if (!isSelected) {
    return "bg-neutral-900 text-gray-500 border-neutral-700 hover:border-neutral-600";
  }
  switch (level) {
    case 1: return "bg-emerald-950/60 text-emerald-400 border-emerald-700/60";
    case 2: return "bg-blue-950/60 text-blue-400 border-blue-700/60";
    case 3: return "bg-purple-950/60 text-purple-400 border-purple-700/60";
    case 4: return "bg-orange-950/60 text-orange-400 border-orange-700/60";
    default: return "bg-red-600 text-white border-red-700";
  }
}

function extractPinyinForChar(fullPinyin: string, charIndex: number, totalChars: number): string {
  const syllables = splitPinyin(fullPinyin);
  if (totalChars === 1) return fullPinyin;
  if (charIndex < syllables.length) return syllables[charIndex];
  return fullPinyin;
}

function splitPinyin(pinyin: string): string[] {
  const result: string[] = [];
  let current = "";
  const vowels = "aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ";
  for (let i = 0; i < pinyin.length; i++) {
    const ch = pinyin[i];
    if (ch === " ") { if (current) result.push(current); current = ""; continue; }
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
          if (ch === "n" || (ch === "g" && current.endsWith("ng"))) continue;
          result.push(current); current = "";
        }
      }
    }
  }
  if (current) result.push(current);
  return result.length === 0 ? [pinyin] : result;
}

export function FlashcardMode({ allWords, learnedState, wordStatusFilter }: FlashcardModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [selectedLevels, setSelectedLevels] = useState<Set<HskLevel>>(new Set([1, 2, 3, 4]));

  const { toggleLearned, isLearned, learnedCount } = learnedState;

  // Get available HSK levels from the data
  const availableLevels = useMemo(() => {
    const levels = new Set<HskLevel>();
    allWords.forEach((w) => {
      if (HSK_LEVELS.includes(w.hskLevel as HskLevel)) {
        levels.add(w.hskLevel as HskLevel);
      }
    });
    return Array.from(levels).sort((a, b) => a - b);
  }, [allWords]);

  const allLevelsSelected = availableLevels.every((l) => selectedLevels.has(l));

  const toggleLevel = (level: HskLevel) => {
    const next = new Set(selectedLevels);
    if (next.has(level)) {
      if (next.size > 1) next.delete(level);
    } else {
      next.add(level);
    }
    setSelectedLevels(next);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const selectAllLevels = () => {
    setSelectedLevels(new Set(availableLevels));
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Filter words — by HSK level, learned status, then optionally shuffle
  const displayWords = useMemo(() => {
    let filtered = allWords.filter((w) => selectedLevels.has(w.hskLevel as HskLevel));
    
    if (wordStatusFilter === "still-learning") {
      filtered = filtered.filter((w) => !isLearned(w.id));
    } else if (wordStatusFilter === "learned") {
      filtered = filtered.filter((w) => isLearned(w.id));
    }
    
    if (isShuffled) {
      const arr = [...filtered];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
    return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allWords, selectedLevels, wordStatusFilter, isShuffled, shuffleSeed]);

  const currentWord = displayWords[currentIndex];

  // Loop: last -> first, first -> last
  const goNext = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % displayWords.length);
  }, [displayWords.length]);

  const goPrev = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + displayWords.length) % displayWords.length);
  }, [displayWords.length]);

  const handleToggleLearned = useCallback(() => {
    if (!currentWord) return;
    toggleLearned(currentWord.id);
  }, [currentWord, toggleLearned]);

  // Shuffle is always clickable to reshuffle
  const handleShuffle = () => {
    setIsShuffled(true);
    setShuffleSeed((s) => s + 1);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Reset to ordered
  const handleReset = () => {
    setIsShuffled(false);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Counts from actual learned state
  const totalLearned = learnedCount;
  const totalLearning = allWords.length - learnedCount;

  const progress = displayWords.length > 0 ? ((currentIndex + 1) / displayWords.length) * 100 : 0;

  if (displayWords.length === 0) {
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

  if (!currentWord) return null;

  const currentIsLearned = isLearned(currentWord.id);

  return (
    <div className="max-w-lg mx-auto">
      {/* HSK Level Multi-Select */}
      <div className="mb-4">
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={selectAllLevels}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              allLevelsSelected
                ? "bg-red-600 text-white border-red-700"
                : "bg-neutral-900 text-gray-500 border-neutral-700 hover:border-neutral-600"
            }`}
          >
            All
          </button>
          {availableLevels.map((level) => (
            <button
              key={level}
              onClick={() => toggleLevel(level)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${getHskButtonClasses(
                level,
                selectedLevels.has(level)
              )}`}
            >
              HSK {level}
            </button>
          ))}
        </div>
      </div>

      {/* Top bar: counter + shuffle + learned stats */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-emerald-400 font-semibold">✅ {totalLearned}</span>
          <span className="text-gray-600">·</span>
          <span className="text-red-400 font-semibold">📖 {totalLearning}</span>
        </div>

        <span className="text-sm text-gray-400 font-medium">
          {currentIndex + 1} / {displayWords.length}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border bg-neutral-900 text-gray-400 border-neutral-700 hover:border-red-700/60 hover:text-white hover:bg-neutral-800"
            title="Shuffle cards (click again to reshuffle)"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Shuffle
          </button>
          {isShuffled && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all border bg-neutral-900 text-gray-500 border-neutral-700 hover:border-neutral-600 hover:text-white"
              title="Reset to original order"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div
        className={`bg-neutral-900 rounded-3xl shadow-2xl border h-[min(560px,calc(var(--app-inner-h,100svh)-300px))] flex flex-col items-center justify-center cursor-pointer select-none transition-all relative overflow-hidden ${
          currentIsLearned
            ? "border-emerald-700/50 hover:border-emerald-600/70"
            : "border-neutral-800 hover:border-neutral-700"
        }`}
        onClick={(e) => {
          if (isHoverCharacterEvent(e)) return;
          setIsFlipped(!isFlipped);
        }}
      >
        {/* Top-left: HSK badge + learned check */}
        <div className="absolute top-5 left-6 flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getHskBadgeClasses(currentWord.hskLevel)}`}>
            HSK {currentWord.hskLevel}
          </span>
          {currentIsLearned && (
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

        {/* Front Content */}
        <div className={`flex flex-col items-center transition-all duration-300 ${isFlipped ? "scale-75 -translate-y-12 opacity-40" : "scale-100 translate-y-0 opacity-100"}`}>
          <div className="flex items-end gap-2 justify-center">
            {currentWord.hanzi.split("").map((char, i) => (
              <HoverCharacter
                key={`${currentWord.id}-front-${i}`}
                char={char}
                pinyin={extractPinyinForChar(currentWord.pinyin, i, currentWord.hanzi.length)}
                size="2xl"
                wordId={currentWord.id}
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
          className={`absolute inset-0 pt-28 pb-6 px-6 w-full flex flex-col items-center overflow-y-auto bg-neutral-900/90 transition-all duration-300 ${
            isFlipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"
          }`}
        >
          <p className="text-red-400 text-xl font-medium mb-1">{currentWord.pinyin}</p>
          <p className="text-white text-3xl font-bold mb-4 text-center">{currentWord.english}</p>

          {currentWord.examples.length > 0 && (
            <div className="space-y-3 mt-2 text-left w-full">
              {currentWord.examples.slice(0, 3).map((example, idx) => (
                <div key={`${currentWord.id}-ex-${idx}`} className="p-3 bg-black/40 rounded-xl border border-neutral-800 flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-end gap-0.5 mb-1.5">
                      {example.pinyinWords.map((pw, i) => (
                        <HoverCharacter key={`${currentWord.id}-ex-${idx}-${i}`} char={pw.char} pinyin={pw.pinyin} size="sm" wordId={currentWord.id} />
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

      {/* Action Buttons: Prev | Toggle Learned | Next */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={goPrev}
          className="px-5 py-4 bg-neutral-900 text-gray-400 rounded-xl font-semibold hover:bg-neutral-800 hover:text-white transition-all border border-neutral-800 hover:border-neutral-700 flex items-center gap-2"
          title="Previous card"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={handleToggleLearned}
          className={`flex-1 py-4 rounded-xl font-semibold transition-all border flex items-center justify-center gap-2 ${
            currentIsLearned
              ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/60 hover:bg-red-950/30 hover:text-red-400 hover:border-red-800/60"
              : "bg-neutral-900 text-gray-400 border-neutral-800 hover:bg-emerald-950/30 hover:text-emerald-400 hover:border-emerald-800/60"
          }`}
          title={currentIsLearned ? "Mark as Still Learning" : "Mark as Learned"}
        >
          {currentIsLearned ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Learned ✓
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Mark Learned
            </>
          )}
        </button>

        <button
          onClick={goNext}
          className="px-5 py-4 bg-neutral-900 text-gray-400 rounded-xl font-semibold hover:bg-neutral-800 hover:text-white transition-all border border-neutral-800 hover:border-neutral-700 flex items-center gap-2"
          title="Next card"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
