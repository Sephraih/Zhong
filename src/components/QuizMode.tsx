import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { HoverCharacter } from "./HoverCharacter";
import { useIsMobile } from "../hooks/useIsMobile";
import { getHskBadgeClasses } from "../utils/hskColors";
import type { VocabWord } from "../data/vocabulary";
import { extractPinyinForChar } from "../utils/pinyinUtils";
import { useHskLevelSelection } from "../hooks/useHskLevelSelection";
import { HskLevelButtons } from "./HskLevelButtons";
import { usePersistedState } from "../hooks/usePersistedState";
import { readJSON, writeJSON, removeJSON } from "../utils/localStorageJson";

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

interface QuizOptionWord {
  id: number;
  hanzi: string;
  pinyin: string;
  english: string;
}

interface QuizQuestion {
  word: VocabWord;
  options: QuizOptionWord[];
  correctIndex: number;
}

interface StoredQuizQuestion {
  wordId: number;
  optionWordIds: number[];
  correctIndex: number;
}

interface StoredQuizSession {
  questions: StoredQuizQuestion[];
  currentIndex: number;
  score: number;
  answered: number;
}

type QuizDirection = "zh-en" | "en-zh";

const STORAGE_KEY = "hanyu-quiz-session";
const SHOWN_LEVELS = [1, 2, 3, 4, 5, 6];

function toOptionWord(w: VocabWord): QuizOptionWord {
  return { id: w.id, hanzi: w.hanzi, pinyin: w.pinyin, english: w.english };
}

function buildQuizQuestions(pool: VocabWord[]): QuizQuestion[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
  return shuffled.map((word) => {
    const otherWords = pool.filter((w) => w.id !== word.id);
    const wrongWords = [...otherWords].sort(() => Math.random() - 0.5).slice(0, 3);
    const correctIndex = Math.floor(Math.random() * 4);
    const options = wrongWords.map(toOptionWord);
    options.splice(correctIndex, 0, toOptionWord(word));
    return { word, options, correctIndex };
  });
}

export function QuizMode({ allWords, accessibleLevels, lockReasonForLevel, isResolving, onLockedLevelClick }: QuizModeProps) {
  const isMobile = useIsMobile();
  const levelSelection = useHskLevelSelection({
    storageKey: "quiz",
    accessibleLevels,
    isResolving,
  });
  const { selectedLevels } = levelSelection;

  const [direction, setDirection] = usePersistedState<QuizDirection>("hanyu-direction-quiz", "zh-en");
  const isChinese = direction === "zh-en";

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);

  const filteredWords = useMemo(() => {
    return allWords.filter((w) => selectedLevels.includes(w.hskLevel));
  }, [allWords, selectedLevels]);

  const removeStoredSession = () => removeJSON(STORAGE_KEY);

  const saveSession = (qs: QuizQuestion[], index: number, sc: number, ans: number) => {
    writeJSON<StoredQuizSession>(STORAGE_KEY, {
      questions: qs.map((q) => ({ wordId: q.word.id, optionWordIds: q.options.map((o) => o.id), correctIndex: q.correctIndex })),
      currentIndex: index,
      score: sc,
      answered: ans,
    });
  };

  const resolveStoredQuestion = (sq: StoredQuizQuestion): QuizQuestion | null => {
    const word = allWords.find((w) => w.id === sq.wordId);
    if (!word) return null;
    const optionWords = sq.optionWordIds.map((id) => allWords.find((w) => w.id === id)).filter((w): w is VocabWord => Boolean(w));
    if (optionWords.length !== sq.optionWordIds.length) return null;
    return { word, options: optionWords.map(toOptionWord), correctIndex: sq.correctIndex };
  };

  const startNewQuiz = (levels: number[] = selectedLevels) => {
    const pool = allWords.filter((w) => levels.includes(w.hskLevel));
    const newQuestions = buildQuizQuestions(pool);
    setQuestions(newQuestions);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setAnswered(0);
    if (newQuestions.length > 0) saveSession(newQuestions, 0, 0, 0);
    else removeStoredSession();
  };

  const hasRestoredRef = useRef(false);
  useEffect(() => {
    if (hasRestoredRef.current) return;
    if (isResolving) return;
    if (allWords.length === 0) return;
    if (selectedLevels.length === 0) return;

    const stored = readJSON<StoredQuizSession>(STORAGE_KEY);
    if (!stored || !Array.isArray(stored.questions) || stored.questions.length === 0) {
      // Nothing was ever saved — a confident, permanent decision, safe to latch.
      hasRestoredRef.current = true;
      startNewQuiz(selectedLevels);
      return;
    }

    const resolved = stored.questions.map(resolveStoredQuestion).filter((q): q is QuizQuestion => Boolean(q));
    if (resolved.length !== stored.questions.length) {
      // A session WAS saved but some of its words don't resolve against allWords yet — this can
      // happen transiently while access is still settling. Don't latch: retry on the next
      // allWords/level change instead of discarding a real session for a mismatched fresh one.
      return;
    }

    hasRestoredRef.current = true;
    setQuestions(resolved);
    setCurrentIndex(Math.min(stored.currentIndex ?? 0, resolved.length));
    setScore(stored.score ?? 0);
    setAnswered(stored.answered ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allWords, selectedLevels, isResolving]);

  const currentQuestion = questions[currentIndex];
  const isComplete = questions.length > 0 && currentIndex >= questions.length;

  useEffect(() => {
    if (questions.length === 0) return;
    if (isComplete) {
      removeStoredSession();
      return;
    }
    saveSession(questions, currentIndex, score, answered);
  }, [questions, currentIndex, score, answered, isComplete]);

  const handleLevelToggle = (level: number) => {
    const newLevels = selectedLevels.includes(level)
      ? selectedLevels.filter((l) => l !== level)
      : [...selectedLevels, level].sort((a, b) => a - b);
    levelSelection.toggleLevel(level);
    startNewQuiz(newLevels);
  };

  const handleToggleAllLevels = () => {
    const newLevels = levelSelection.allSelected ? [] : accessibleLevels;
    levelSelection.toggleAll();
    startNewQuiz(newLevels);
  };

  const toggleDirection = () => {
    setDirection(isChinese ? "en-zh" : "zh-en");
    startNewQuiz(selectedLevels);
  };

  const handleAnswer = useCallback(
    (index: number) => {
      if (selectedAnswer !== null || !currentQuestion) return;
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

  const restart = () => startNewQuiz(selectedLevels);

  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const HskFilterButtons = () => (
    <div className="mb-6 space-y-3">
      <HskLevelButtons
        shownLevels={SHOWN_LEVELS}
        accessibleLevels={accessibleLevels}
        selectedLevels={selectedLevels}
        onToggleLevel={handleLevelToggle}
        onToggleAll={handleToggleAllLevels}
        lockReasonForLevel={lockReasonForLevel}
        isResolving={isResolving}
        onLockedClick={onLockedLevelClick}
      />

      <div className="flex justify-center">
        <button
          onClick={toggleDirection}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:border-neutral-700 transition-all"
          title={isChinese ? "Switch to English → Chinese" : "Switch to Chinese → English"}
        >
          {isChinese ? (
            <>
              <span className="text-red-400">中</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <span>EN</span>
            </>
          ) : (
            <>
              <span>EN</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <span className="text-red-400">中</span>
            </>
          )}
        </button>
      </div>
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

  if (!currentQuestion) {
    return (
      <div className="max-w-lg mx-auto">
        <HskFilterButtons />
        <div className="text-center py-12 text-gray-400">Loading quiz...</div>
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

        {isChinese ? (
          <>
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
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">Which word means this?</p>
            <p className="text-2xl font-bold text-white px-4">{currentQuestion.word.english}</p>
          </>
        )}
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
              {isChinese ? (
                option.english
              ) : (
                <span className="inline-flex items-end gap-0.5">
                  {option.hanzi.split("").map((char, i) => (
                    <HoverCharacter
                      key={`opt-${option.id}-${i}`}
                      char={char}
                      pinyin={extractPinyinForChar(option.pinyin, i, option.hanzi.length)}
                      size="md"
                      wordId={option.id}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
