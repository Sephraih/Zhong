import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { HoverCharacter } from "./HoverCharacter";
import { useIsMobile } from "../hooks/useIsMobile";
import { getHskBadgeClasses } from "../utils/hskColors";
import type { VocabWord } from "../data/vocabulary";
import { extractPinyinForChar } from "../utils/pinyinUtils";
import { useHskLevelSelection } from "../hooks/useHskLevelSelection";
import { HskLevelButtons } from "./HskLevelButtons";

interface QuizModeProps {
  allWords: VocabWord[];
  /** Levels the current user can access (from App.tsx's hasAccessToLevel) */
  accessibleLevels: number[];
  lockReasonForLevel: (level: number) => string | null;
  /** True while the real access tier is still resolving (see App.tsx's accessInfo.isResolving) */
  isResolving?: boolean;
  /** Called when the user taps a locked HSK level button (should open login or profile) */
  onLockedLevelClick?: () => void;
}

interface QuizQuestion {
  word: VocabWord;
  options: string[];
  correctIndex: number;
}

const SHOWN_LEVELS = [1, 2, 3, 4, 5, 6];

export function QuizMode({ allWords, accessibleLevels, lockReasonForLevel, isResolving, onLockedLevelClick }: QuizModeProps) {
  const isMobile = useIsMobile();
  const levelSelection = useHskLevelSelection({
    storageKey: "quiz",
    accessibleLevels,
    isResolving,
  });
  const { selectedLevels } = levelSelection;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [quizKey, setQuizKey] = useState(0);

  // Restart the quiz whenever the level selection actually changes (not on every render).
  const prevSelectedRef = useRef<number[]>(selectedLevels);
  useEffect(() => {
    if (prevSelectedRef.current.join(",") !== selectedLevels.join(",")) {
      prevSelectedRef.current = selectedLevels;
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setScore(0);
      setAnswered(0);
      setQuizKey((k) => k + 1);
    }
  }, [selectedLevels]);

  const toggleLevel = (level: number) => levelSelection.toggleLevel(level);
  const toggleAllLevels = () => levelSelection.toggleAll();

  const filteredWords = useMemo(() => {
    return allWords.filter((w) => selectedLevels.includes(w.hskLevel));
  }, [allWords, selectedLevels]);

  const questions: QuizQuestion[] = useMemo(() => {
    const shuffled = [...filteredWords].sort(() => Math.random() - 0.5).slice(0, 10);
    return shuffled.map((word) => {
      const otherWords = filteredWords.filter((w) => w.id !== word.id);
      const wrongOptions = otherWords
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((w) => w.english);

      const correctIndex = Math.floor(Math.random() * 4);
      const options = [...wrongOptions];
      options.splice(correctIndex, 0, word.english);

      return { word, options, correctIndex };
    });
  }, [filteredWords, quizKey]);

  const currentQuestion = questions[currentIndex];
  const isComplete = currentIndex >= questions.length;

  const handleAnswer = useCallback(
    (index: number) => {
      if (selectedAnswer !== null) return;
      setSelectedAnswer(index);
      setAnswered((prev) => prev + 1);
      if (index === currentQuestion.correctIndex) {
        setScore((prev) => prev + 1);
      }

      setTimeout(() => {
        setSelectedAnswer(null);
        setCurrentIndex((prev) => prev + 1);
      }, 1500);
    },
    [selectedAnswer, currentQuestion]
  );

  const restart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setAnswered(0);
    setQuizKey((k) => k + 1);
  };

  const progress = ((currentIndex + 1) / questions.length) * 100;

  const HskFilterButtons = () => (
    <div className="mb-6">
      <HskLevelButtons
        shownLevels={SHOWN_LEVELS}
        accessibleLevels={accessibleLevels}
        selectedLevels={selectedLevels}
        onToggleLevel={toggleLevel}
        onToggleAll={toggleAllLevels}
        lockReasonForLevel={lockReasonForLevel}
        isResolving={isResolving}
        onLockedClick={onLockedLevelClick}
      />
    </div>
  );

  if (selectedLevels.length === 0) {
    return (
      <div className="max-w-lg mx-auto">
        <HskFilterButtons />
        <div className="text-center py-16">
          <div className="text-5xl mb-4">👆</div>
          <p className="text-gray-400 text-lg">Please select at least one HSK level.</p>
        </div>
      </div>
    );
  }

  if (filteredWords.length < 4) {
    return (
      <div className="max-w-lg mx-auto">
        <HskFilterButtons />
        <div className="text-center py-16 text-gray-400">
          Need at least 4 words to create a quiz. Try enabling more HSK levels.
        </div>
      </div>
    );
  }

  if (isComplete) {
    const percentage = Math.round((score / answered) * 100);
    return (
      <div className="max-w-lg mx-auto">
        <HskFilterButtons />
        <div className="text-center py-12">
          <div className="bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-800 p-8">
            <div className="text-6xl mb-4">{percentage >= 80 ? "🏆" : percentage >= 60 ? "👍" : "💪"}</div>
            <h2 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h2>
            <p className="text-gray-400 mb-2">
              You scored {score} out of {answered}
            </p>
            <p className="text-3xl font-bold text-red-400 mb-6">{percentage}%</p>

            <button
              onClick={restart}
              className="px-8 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-500 transition-colors shadow-lg shadow-red-900/30"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <HskFilterButtons />

      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span>Score: {score}/{answered}</span>
        </div>
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-800 p-8 text-center mb-6">
        <div className="flex justify-center mb-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getHskBadgeClasses(currentQuestion.word.hskLevel)}`}>
            HSK {currentQuestion.word.hskLevel}
          </span>
        </div>
        
        <p className="text-sm text-gray-500 mb-4">What does this mean?</p>
        
        <div className="flex items-end gap-1 justify-center mb-2">
          {currentQuestion.word.hanzi.split("").map((char, i) => (
            <HoverCharacter
              key={`${currentQuestion.word.id}-${i}`}
              char={char}
              pinyin={extractPinyinForChar(currentQuestion.word.pinyin, i, currentQuestion.word.hanzi.length)}
              size="xl"
              wordId={currentQuestion.word.id}
            />
          ))}
        </div>

        <p className="text-gray-600 text-xs mt-2">
          {isMobile ? "Tap characters for pinyin" : "Hover for pinyin"}
        </p>
      </div>

      <div className="space-y-3">
        {currentQuestion.options.map((option, idx) => {
          let btnClass =
            "w-full py-4 px-6 rounded-xl font-medium text-left transition-all duration-200 border ";

          if (selectedAnswer === null) {
            btnClass += "bg-neutral-900 border-neutral-800 text-gray-200 hover:border-red-700/60 hover:bg-neutral-800";
          } else if (idx === currentQuestion.correctIndex) {
            btnClass += "bg-emerald-950/50 border-emerald-600/60 text-emerald-300";
          } else if (idx === selectedAnswer) {
            btnClass += "bg-red-950/50 border-red-600/60 text-red-300";
          } else {
            btnClass += "bg-neutral-900/40 border-neutral-800/40 text-gray-600";
          }

          return (
            <button key={idx} onClick={() => handleAnswer(idx)} className={btnClass}>
              <span className="mr-3 text-gray-600 font-mono">{String.fromCharCode(65 + idx)}.</span>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
