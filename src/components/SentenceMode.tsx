import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { HoverCharacter, isHoverCharacterEvent } from "./HoverCharacter";
import { SpeakerButton } from "./SpeakerButton";
import { useIsMobile } from "../hooks/useIsMobile";
import { getHskBadgeClasses } from "../utils/hskColors";
import type { VocabWord } from "../data/vocabulary";

interface SentenceModeProps {
  allWords: VocabWord[];
  onLockedLevelClick?: () => void;
}

interface SessionSentence {
  id: string;
  chinese: string;
  pinyinWords: { char: string; pinyin: string }[];
  english: string;
  sourceWord: VocabWord;
  sessionProgress: number;
}

const HSK_LEVELS = [1, 2, 3, 4, 5, 6] as const;
type HskLevel = (typeof HSK_LEVELS)[number];

const ANIMATION_DURATION = 330;

function getProgressColor(progress: number): string {
  switch (progress) {
    case 0: return "bg-gray-600";
    case 1: return "bg-green-900";
    case 2: return "bg-green-700";
    case 3: return "bg-green-500";
    case 4: return "bg-green-400";
    case 5: return "bg-yellow-400";
    default: return "bg-gray-600";
  }
}

function getProgressGlow(progress: number): string {
  switch (progress) {
    case 0: return "shadow-[0_0_8px_3px_rgba(107,114,128,0.5)]";
    case 1: return "shadow-[0_0_8px_3px_rgba(20,83,45,0.6)]";
    case 2: return "shadow-[0_0_8px_3px_rgba(21,128,61,0.6)]";
    case 3: return "shadow-[0_0_8px_3px_rgba(34,197,94,0.5)]";
    case 4: return "shadow-[0_0_8px_3px_rgba(74,222,128,0.5)]";
    case 5: return "shadow-[0_0_8px_3px_rgba(250,204,21,0.5)]";
    default: return "shadow-[0_0_8px_3px_rgba(107,114,128,0.5)]";
  }
}

function getCardGlowClass(
  feedback: "got" | "forgot" | "gold" | null,
  isMaxed: boolean
): string {
  switch (feedback) {
    case "got":
      return "border-emerald-500 shadow-[0_0_24px_6px_rgba(16,185,129,0.35)]";
    case "forgot":
      return "border-red-500 shadow-[0_0_24px_6px_rgba(239,68,68,0.35)]";
    case "gold":
      return "border-yellow-400 shadow-[0_0_24px_6px_rgba(250,204,21,0.4)]";
    default:
      return isMaxed
        ? "border-yellow-500/70 shadow-[0_0_18px_2px_rgba(250,204,21,0.22)]"
        : "border-neutral-800 hover:border-neutral-700";
  }
}

function getHskButtonClasses(level: HskLevel, isSelected: boolean): string {
  if (!isSelected) {
    return "text-gray-400 hover:text-white hover:bg-neutral-800";
  }
  switch (level) {
    case 1: return "bg-emerald-600 text-white";
    case 2: return "bg-blue-600 text-white";
    case 3: return "bg-purple-600 text-white";
    case 4: return "bg-orange-600 text-white";
    case 5: return "bg-pink-600 text-white";
    case 6: return "bg-cyan-600 text-white";
    default: return "bg-red-600 text-white";
  }
}

function getLockedHskButtonClasses(level: HskLevel): string {
  switch (level) {
    case 1: return "bg-neutral-900/55 text-emerald-200/35 border border-emerald-900/30";
    case 2: return "bg-neutral-900/55 text-blue-200/35 border border-blue-900/30";
    case 3: return "bg-neutral-900/55 text-purple-200/35 border border-purple-900/30";
    case 4: return "bg-neutral-900/55 text-orange-200/35 border border-orange-900/30";
    case 5: return "bg-neutral-900/55 text-pink-200/35 border border-pink-900/30";
    case 6: return "bg-neutral-900/55 text-cyan-200/35 border border-cyan-900/30";
    default: return "bg-neutral-900/55 text-gray-600 border border-neutral-800";
  }
}

export function SentenceMode({ allWords, onLockedLevelClick }: SentenceModeProps) {
  const isMobile = useIsMobile();

  const [sessionSentences, setSessionSentences] = useState<SessionSentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [selectedLevels, setSelectedLevels] = useState<Set<HskLevel>>(() => new Set(HSK_LEVELS));

  // Animation state
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [feedback, setFeedback] = useState<"got" | "forgot" | "gold" | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Delta indicator (+1 / -1)
  const [deltaPulse, setDeltaPulse] = useState<{
    id: number;
    sentenceId: string;
    text: string;
    tone: "emerald" | "red" | "yellow";
  } | null>(null);
  const [deltaPhase, setDeltaPhase] = useState<"start" | "float" | "fade">("start");
  const deltaIdRef = useRef(0);
  const deltaClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deltaFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerDelta = (sentenceId: string, text: string, tone: "emerald" | "red" | "yellow") => {
    deltaIdRef.current += 1;
    setDeltaPulse({ id: deltaIdRef.current, sentenceId, text, tone });
    setDeltaPhase("start");
    requestAnimationFrame(() => setDeltaPhase("float"));

    if (deltaFadeTimerRef.current) clearTimeout(deltaFadeTimerRef.current);
    if (deltaClearTimerRef.current) clearTimeout(deltaClearTimerRef.current);

    deltaFadeTimerRef.current = setTimeout(() => {
      setDeltaPhase("fade");
    }, Math.max(120, ANIMATION_DURATION - 170));

    deltaClearTimerRef.current = setTimeout(() => {
      setDeltaPulse(null);
    }, ANIMATION_DURATION);
  };

  // Get accessible levels from allWords
  const accessibleLevels = useMemo(() => {
    const levels = new Set<HskLevel>();
    allWords.forEach((w) => {
      if (HSK_LEVELS.includes(w.hskLevel as HskLevel)) levels.add(w.hskLevel as HskLevel);
    });
    return Array.from(levels).sort((a, b) => a - b);
  }, [allWords]);

  const isLevelEnabled = (level: HskLevel) => accessibleLevels.includes(level);

  const allLevelsSelected = useMemo(() => {
    return accessibleLevels.every((l) => selectedLevels.has(l));
  }, [accessibleLevels, selectedLevels]);

  const toggleLevel = (level: HskLevel) => {
    if (!isLevelEnabled(level)) {
      onLockedLevelClick?.();
      return;
    }

    const next = new Set(selectedLevels);
    if (next.has(level)) {
      next.delete(level);
    } else {
      next.add(level);
    }
    setSelectedLevels(next);
  };

  const toggleAllLevels = () => {
    if (allLevelsSelected) {
      setSelectedLevels(new Set());
    } else {
      setSelectedLevels(new Set(accessibleLevels));
    }
  };

  // Collect all example sentences from filtered words
  const allSentences = useMemo(() => {
    const sentences: SessionSentence[] = [];
    const filteredWords = allWords.filter((w) => selectedLevels.has(w.hskLevel as HskLevel));
    
    filteredWords.forEach((word) => {
      word.examples.forEach((example, idx) => {
        sentences.push({
          id: `${word.id}-${idx}`,
          chinese: example.chinese,
          pinyinWords: example.pinyinWords,
          english: example.english,
          sourceWord: word,
          sessionProgress: 0,
        });
      });
    });

    return sentences;
  }, [allWords, selectedLevels]);

  const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const startNewSession = useCallback(() => {
    if (allSentences.length === 0) {
      setSessionSentences([]);
      setIsFinished(true);
      return;
    }

    const shuffled = shuffleArray(allSentences);
    const selected = shuffled.slice(0, 10).map((s) => ({ ...s, sessionProgress: 0 }));
    
    setSessionSentences(selected);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
    setCycleCount(0);
  }, [allSentences]);

  // Start session when levels change or on mount
  useEffect(() => {
    if (allSentences.length > 0 && sessionSentences.length === 0 && !isFinished) {
      startNewSession();
    }
  }, [allSentences, sessionSentences.length, isFinished, startNewSession]);

  // Restart session when selected levels change
  useEffect(() => {
    startNewSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLevels]);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (deltaFadeTimerRef.current) clearTimeout(deltaFadeTimerRef.current);
      if (deltaClearTimerRef.current) clearTimeout(deltaClearTimerRef.current);
    };
  }, []);

  const advanceToNext = (sentences: SessionSentence[], fromIndex: number) => {
    if (sentences.length === 0) {
      setIsFinished(true);
      setSessionSentences([]);
      return;
    }

    let nextIndex = fromIndex + 1;
    let nextSentences = sentences;
    let nextCycle = cycleCount;

    if (nextIndex >= sentences.length) {
      nextIndex = 0;
      nextCycle += 1;
      nextSentences = shuffleArray(sentences);
      setSessionSentences(nextSentences);
      setCycleCount(nextCycle);
    }

    setCurrentIndex(nextIndex);
    setIsFlipped(false);
  };

  const scheduleAdvance = (updatedSentences: SessionSentence[], feedbackType: "got" | "forgot" | "gold") => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    setIsAdvancing(true);
    setFeedback(feedbackType);

    advanceTimerRef.current = setTimeout(() => {
      advanceTimerRef.current = null;
      setIsAdvancing(false);
      setFeedback(null);
      advanceToNext(updatedSentences, currentIndex);
    }, ANIMATION_DURATION);
  };

  const handleGotIt = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAdvancing || sessionSentences.length === 0) return;

    const currentSentence = sessionSentences[currentIndex];
    const prevProgress = currentSentence.sessionProgress;
    const newProgress = Math.min(5, prevProgress + 1);
    const isMaxed = newProgress === 5;

    if (newProgress === prevProgress) {
      advanceToNext(sessionSentences, currentIndex);
      return;
    }

    triggerDelta(currentSentence.id, "+1", isMaxed ? "yellow" : "emerald");

    const updatedSentences = sessionSentences.map((s) =>
      s.id === currentSentence.id ? { ...s, sessionProgress: newProgress } : s
    );
    setSessionSentences(updatedSentences);
    scheduleAdvance(updatedSentences, isMaxed ? "gold" : "got");
  };

  const handleForgotIt = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAdvancing || sessionSentences.length === 0) return;

    const currentSentence = sessionSentences[currentIndex];
    const prevProgress = currentSentence.sessionProgress;
    const newProgress = Math.max(0, prevProgress - 1);

    if (newProgress === prevProgress) {
      advanceToNext(sessionSentences, currentIndex);
      return;
    }

    triggerDelta(currentSentence.id, "-1", "red");

    const updatedSentences = sessionSentences.map((s) =>
      s.id === currentSentence.id ? { ...s, sessionProgress: newProgress } : s
    );
    setSessionSentences(updatedSentences);
    scheduleAdvance(updatedSentences, "forgot");
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAdvancing || sessionSentences.length === 0) return;

    const newSession = sessionSentences.filter((_, i) => i !== currentIndex);

    if (newSession.length === 0) {
      setIsFinished(true);
      setSessionSentences([]);
    } else {
      const newIndex = currentIndex >= newSession.length ? 0 : currentIndex;
      setSessionSentences(newSession);
      setCurrentIndex(newIndex);
      setIsFlipped(false);
    }
  };

  const currentSentence = sessionSentences[currentIndex];

  // HSK Level Filter UI
  const HskFilterButtons = () => (
    <div className="mb-6 flex justify-center">
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={toggleAllLevels}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            allLevelsSelected
              ? "bg-red-600 text-white shadow-sm shadow-red-900/20"
              : "bg-neutral-900 text-gray-400 border border-neutral-800 hover:border-neutral-700"
          }`}
          title={allLevelsSelected ? "Deselect all levels" : "Select all levels"}
        >
          All
        </button>

        {HSK_LEVELS.map((level) => {
          const enabled = isLevelEnabled(level);
          const selected = selectedLevels.has(level);
          return (
            <button
              key={level}
              onClick={() => toggleLevel(level)}
              title={enabled ? undefined : "Sign in / purchase to unlock this level"}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                !enabled
                  ? getLockedHskButtonClasses(level)
                  : selected
                  ? getHskButtonClasses(level, true)
                  : `${getHskButtonClasses(level, false)} border border-neutral-800`
              }`}
            >
              {!enabled ? "🔒 " : ""}HSK {level}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Empty selection state
  if (selectedLevels.size === 0) {
    return (
      <div className="max-w-lg mx-auto">
        <HskFilterButtons />
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-gray-400 text-lg">Please select at least one HSK level</p>
          <p className="text-gray-600 text-sm mt-2">
            Use the buttons above to choose which levels to practice.
          </p>
        </div>
      </div>
    );
  }

  // No sentences available
  if (allSentences.length === 0) {
    return (
      <div className="max-w-lg mx-auto">
        <HskFilterButtons />
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-400 text-lg">No example sentences available</p>
          <p className="text-gray-600 text-sm mt-2">
            The selected HSK levels don't have example sentences yet.
          </p>
        </div>
      </div>
    );
  }

  // Session finished
  if (isFinished) {
    return (
      <div className="max-w-lg mx-auto">
        <HskFilterButtons />
        <div className="text-center py-20 bg-neutral-900 rounded-3xl border border-neutral-800 shadow-2xl px-8">
          <div className="mb-6 inline-flex p-4 bg-emerald-950/30 rounded-full border border-emerald-900/40">
            <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Great work!</h2>
          <p className="text-gray-400 mb-10">You've completed all sentences in this session.</p>
          <button
            onClick={startNewSession}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
          >
            Start Another Session
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (!currentSentence) {
    return (
      <div className="max-w-lg mx-auto">
        <HskFilterButtons />
        <div className="text-center py-16 text-gray-400">Loading sentences...</div>
      </div>
    );
  }

  const ProgressBarInsideCard = () => {
    const isGold = currentSentence.sessionProgress === 5;
    const showDelta = deltaPulse?.sentenceId === currentSentence.id;

    return (
      <div
        className={`flex items-center gap-3 transition-all duration-300 rounded-lg px-2 py-1 -mx-2 ${
          feedback === "got" || feedback === "gold"
            ? "ring-2 ring-emerald-500/50 bg-emerald-950/20"
            : feedback === "forgot"
            ? "ring-2 ring-red-500/50 bg-red-950/20"
            : ""
        }`}
      >
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((step) => {
            const filled = step <= currentSentence.sessionProgress;
            return (
              <div
                key={step}
                className={`w-6 h-3 rounded-sm border transition-all duration-300 ${
                  filled
                    ? `${isGold ? "bg-yellow-400" : getProgressColor(currentSentence.sessionProgress)} border-transparent`
                    : "bg-neutral-800 border-neutral-700"
                }`}
                style={{
                  transitionProperty: "background-color, border-color, transform",
                  transform: filled && feedback ? "scaleY(1.2)" : "scaleY(1)",
                }}
              />
            );
          })}
        </div>
        <span className={`relative text-xs font-medium tabular-nums transition-colors duration-300 ${
          feedback === "gold" || isGold ? "text-yellow-400" : "text-gray-500"
        }`}>
          {currentSentence.sessionProgress}/5 <span className={isGold ? "text-yellow-300" : "text-gray-600"}>⭐</span>
          {showDelta && deltaPulse && (
            <span
              className={`absolute -right-8 top-0 text-xs font-black transition-all duration-300 ${
                deltaPulse.tone === "emerald" ? "text-emerald-300" : deltaPulse.tone === "yellow" ? "text-yellow-300" : "text-red-300"
              } ${
                deltaPhase === "start" ? "opacity-0 translate-y-2 scale-90" : deltaPhase === "float" ? "opacity-100 -translate-y-1 scale-100" : "opacity-0 -translate-y-3 scale-100"
              }`}
              style={{
                textShadow: deltaPulse.tone === "emerald" ? "0 0 14px rgba(16,185,129,0.45)" : deltaPulse.tone === "yellow" ? "0 0 16px rgba(250,204,21,0.55)" : "0 0 14px rgba(239,68,68,0.45)",
              }}
            >
              {deltaPulse.text}
            </span>
          )}
        </span>
      </div>
    );
  };

  return (
    <div className="max-w-lg mx-auto">
      <HskFilterButtons />

      {/* Progress header */}
      <div className="mb-6">
        <div className="flex justify-between items-center text-sm text-gray-400 mb-2">
          <span>Sentence {currentIndex + 1} of {sessionSentences.length}</span>
          <span className="bg-neutral-800 px-2 py-1 rounded text-xs">
            {cycleCount > 0 ? `Cycle ${cycleCount + 1}` : "Sentences"}
          </span>
        </div>
        <div className={`h-2 bg-neutral-800 rounded-full overflow-hidden flex transition-all duration-300 ${
          feedback === "got" || feedback === "gold" ? "ring-2 ring-emerald-500/40" : feedback === "forgot" ? "ring-2 ring-red-500/40" : ""
        }`}>
          {sessionSentences.map((sentence, i) => {
            const isCurrent = i === currentIndex;
            const color = getProgressColor(sentence.sessionProgress);
            return (
              <div
                key={sentence.id}
                className={`h-full flex-1 transition-all duration-300 ${color} ${isCurrent ? "z-10 relative brightness-150 scale-y-150" : ""} ${i > 0 ? "border-l border-black/30" : ""}`}
                style={isCurrent ? { boxShadow: "0 0 8px 2px rgba(255,255,255,0.4)" } : undefined}
              />
            );
          })}
        </div>
      </div>

      {/* Sentence Card */}
      <div
        className={`bg-neutral-900 rounded-3xl shadow-2xl border flex flex-col cursor-pointer select-none transition-all duration-300 relative overflow-hidden ${getCardGlowClass(feedback, currentSentence.sessionProgress >= 5)}`}
        style={{
          minHeight: isMobile ? "400px" : "480px",
        }}
        onClick={(e) => {
          if (isHoverCharacterEvent(e)) return;
          setIsFlipped(!isFlipped);
        }}
      >
        {/* Top badges */}
        <div className="absolute top-5 left-6 flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getHskBadgeClasses(currentSentence.sourceWord.hskLevel)}`}>
            HSK {currentSentence.sourceWord.hskLevel}
          </span>
        </div>
        <div className="absolute top-5 right-6">
          <span className="text-xs text-gray-600 font-medium">{currentSentence.sourceWord.category}</span>
        </div>

        {/* Card content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 pt-16">
          {/* Front: Chinese sentence with hover pinyin */}
          <div className={`flex flex-col items-center transition-all duration-300 ${isFlipped ? "scale-90 -translate-y-8 opacity-40" : "scale-100 translate-y-0 opacity-100"}`}>
            <div className="flex flex-wrap items-end gap-0.5 justify-center mb-4 max-w-full px-2">
              {currentSentence.pinyinWords.map((pw, i) => (
                <HoverCharacter
                  key={`${currentSentence.id}-${i}`}
                  char={pw.char}
                  pinyin={pw.pinyin}
                  size={isMobile ? "lg" : "xl"}
                  wordId={currentSentence.id}
                />
              ))}
            </div>
            <SpeakerButton text={currentSentence.chinese} size="md" />
            
            {!isFlipped && (
              <>
                <div className="mt-6"><ProgressBarInsideCard /></div>
                <p className="text-gray-600 text-sm mt-4">Tap to reveal translation · Hover for pinyin</p>
              </>
            )}
          </div>

          {/* Back: English translation + source word info */}
          <div className={`absolute inset-0 pt-24 pb-6 px-6 flex flex-col items-center bg-neutral-900/95 transition-all duration-300 overflow-y-auto ${
            isFlipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"
          }`}>
            <p className="text-white text-xl font-semibold text-center mb-6 leading-relaxed">
              {currentSentence.english}
            </p>

            <div className="my-4"><ProgressBarInsideCard /></div>

            {/* Source word info */}
            <div className="mt-4 p-4 bg-black/40 rounded-xl border border-neutral-800 w-full">
              <p className="text-xs text-gray-500 mb-2">From vocabulary word:</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl text-white font-bold">{currentSentence.sourceWord.hanzi}</span>
                <div>
                  <p className="text-red-400 text-sm">{currentSentence.sourceWord.pinyin}</p>
                  <p className="text-gray-400 text-sm">{currentSentence.sourceWord.english}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={handleForgotIt}
          disabled={isAdvancing}
          className={`flex-1 py-4 bg-neutral-900 text-red-400 rounded-xl font-bold transition-all duration-200 border flex items-center justify-center gap-2 ${
            isAdvancing && feedback === "forgot" ? "border-red-500 bg-red-950/30 scale-[0.98]" : isAdvancing ? "opacity-60 cursor-not-allowed border-red-900/40" : "border-red-900/40 hover:bg-red-950/40 hover:border-red-700/60"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          Forgot it
        </button>
        <button
          onClick={handleGotIt}
          disabled={isAdvancing}
          className={`flex-1 py-4 bg-neutral-900 rounded-xl font-bold transition-all duration-200 border flex items-center justify-center gap-2 ${
            isAdvancing && (feedback === "got" || feedback === "gold") ? "border-emerald-500 bg-emerald-950/30 scale-[0.98] text-emerald-400" :
            isAdvancing ? "opacity-60 cursor-not-allowed border-emerald-900/40 text-emerald-400" :
            currentSentence.sessionProgress === 4 ? "text-emerald-400 border-emerald-900/40 hover:text-yellow-300 hover:border-yellow-500/70 hover:bg-yellow-950/20 hover:shadow-[0_0_14px_3px_rgba(250,204,21,0.3)]" :
            "text-emerald-400 border-emerald-900/40 hover:bg-emerald-950/40 hover:border-emerald-700/60"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          Got it
        </button>
      </div>

      {/* Remove button */}
      <button
        onClick={handleRemove}
        disabled={isAdvancing}
        className={`w-full mt-3 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
          isAdvancing ? "opacity-60 cursor-not-allowed text-gray-500 bg-neutral-950 border border-neutral-800" :
          currentSentence.sessionProgress >= 5 ? "text-yellow-400 bg-yellow-950/30 border border-yellow-600/60 shadow-[0_0_16px_3px_rgba(250,204,21,0.35)] hover:shadow-[0_0_22px_5px_rgba(250,204,21,0.45)] hover:text-yellow-300 hover:border-yellow-500/80 hover:bg-yellow-950/40" :
          "text-gray-400 bg-neutral-950 border border-neutral-800 hover:text-white hover:border-neutral-700 hover:bg-neutral-900"
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        Remove from session{currentSentence.sessionProgress >= 5 ? " ⭐" : ""}
      </button>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-6 flex-wrap">
        {sessionSentences.map((s, i) => {
          const isCurrent = i === currentIndex;
          const color = getProgressColor(s.sessionProgress);
          const glow = isCurrent ? getProgressGlow(s.sessionProgress) : "";
          return <div key={s.id} className={`rounded-full transition-all duration-300 ${color} ${glow} ${isCurrent ? "w-3 h-3" : "w-2 h-2"}`} />;
        })}
      </div>

      <div className="mt-10 text-center">
        <button onClick={startNewSession} className="text-gray-600 hover:text-gray-400 text-xs font-medium uppercase tracking-widest transition-colors">
          Start New Session
        </button>
      </div>
    </div>
  );
}
