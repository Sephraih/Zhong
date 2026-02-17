import { useState, useEffect, useRef, useCallback } from "react";
import { HoverCharacter } from "./HoverCharacter";
import { SpeakerButton } from "./SpeakerButton";
import { useIsMobile } from "../hooks/useIsMobile";
import type { VocabWord } from "../data/vocabulary";
import type { LearnedState } from "../hooks/useLearnedState";

interface PracticeModeProps {
  allWords: VocabWord[];
  learnedState: LearnedState;
}

type HskLevelFilter = "all" | 1 | 2;
type PracticeDirection = "zh-en" | "en-zh";

interface StoredSession {
  ids: number[];
  currentIndex: number;
  cycleCount: number;
  hskLevel: HskLevelFilter;
  infoMinimized?: boolean;
  progress?: Record<number, number>;
  direction?: PracticeDirection;
}

const STORAGE_KEY = "hanyu-practice-session";
const ANIMATION_DURATION = 330;

// Swipe thresholds
const SWIPE_THRESHOLD = 60; // px to trigger action
const SWIPE_UP_THRESHOLD = 80;

interface SessionWord extends VocabWord {
  sessionProgress: number;
}

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

// ─── Swipe action overlay text + color ───
function getSwipeActionInfo(action: "left" | "right" | "up" | null) {
  switch (action) {
    case "left":
      return { text: "Forgot it", color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/60", icon: "✕" };
    case "right":
      return { text: "Got it", color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/60", icon: "✓" };
    case "up":
      return { text: "Learned it ⭐", color: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-yellow-500/60", icon: "⭐" };
    default:
      return null;
  }
}

export function PracticeMode({ allWords, learnedState }: PracticeModeProps) {
  const isMobile = useIsMobile();

  const [sessionWords, setSessionWords] = useState<SessionWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [hskLevel, setHskLevel] = useState<HskLevelFilter>("all");
  const [infoMinimized, setInfoMinimized] = useState(false);
  const [direction, setDirection] = useState<PracticeDirection>("zh-en");

  // Animation state
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [feedback, setFeedback] = useState<"got" | "forgot" | "gold" | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Swipe state
  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 });
  const [swipeAction, setSwipeAction] = useState<"left" | "right" | "up" | null>(null);
  const [swipeAnimating, setSwipeAnimating] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const swipingRef = useRef(false);

  // Delta indicator
  const [deltaPulse, setDeltaPulse] = useState<{
    id: number;
    wordId: number;
    text: string;
    tone: "emerald" | "red" | "yellow";
  } | null>(null);
  const [deltaPhase, setDeltaPhase] = useState<"start" | "float" | "fade">("start");
  const deltaIdRef = useRef(0);
  const deltaClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deltaFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerDelta = (wordId: number, text: string, tone: "emerald" | "red" | "yellow") => {
    deltaIdRef.current += 1;
    setDeltaPulse({ id: deltaIdRef.current, wordId, text, tone });
    setDeltaPhase("start");

    requestAnimationFrame(() => setDeltaPhase("float"));

    if (deltaFadeTimerRef.current) clearTimeout(deltaFadeTimerRef.current);
    if (deltaClearTimerRef.current) clearTimeout(deltaClearTimerRef.current);

    deltaFadeTimerRef.current = setTimeout(() => {
      setDeltaPhase("fade");
      deltaFadeTimerRef.current = null;
    }, Math.max(120, ANIMATION_DURATION - 170));

    deltaClearTimerRef.current = setTimeout(() => {
      setDeltaPulse(null);
      deltaClearTimerRef.current = null;
    }, ANIMATION_DURATION);
  };

  const { markAsLearned, markAsStillLearning, isLearned } = learnedState;

  const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const saveSession = (
    words: SessionWord[],
    index: number,
    cycle: number,
    level: HskLevelFilter,
    minimized: boolean,
    dir: PracticeDirection
  ) => {
    try {
      const progress: Record<number, number> = {};
      words.forEach((w) => { progress[w.id] = w.sessionProgress; });
      const payload: StoredSession = {
        ids: words.map((w) => w.id),
        currentIndex: index,
        cycleCount: cycle,
        hskLevel: level,
        infoMinimized: minimized,
        progress,
        direction: dir,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch { /* ignore */ }
  };

  const loadSession = (): StoredSession | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as StoredSession;
      if (!parsed || !Array.isArray(parsed.ids)) return null;
      return parsed;
    } catch { return null; }
  };

  const clearSession = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  };

  const startNewSession = (level: HskLevelFilter = hskLevel) => {
    const pool = level === "all" ? allWords : allWords.filter((w) => w.hskLevel === level);
    const unlearned = shuffleArray(pool.filter((w) => !isLearned(w.id)));
    const learned = shuffleArray(pool.filter((w) => isLearned(w.id)));

    let selectedNew = unlearned.slice(0, 8);
    let selectedOld = learned.slice(0, 2);

    if (selectedNew.length < 8) {
      const extra = 8 - selectedNew.length;
      selectedOld = [...selectedOld, ...learned.slice(2, 2 + extra)];
    }
    if (selectedOld.length < 2) {
      const extra = 2 - selectedOld.length;
      selectedNew = [...selectedNew, ...unlearned.slice(8, 8 + extra)];
    }

    const finalSession: SessionWord[] = shuffleArray([
      ...selectedNew.map((w) => ({ ...w, sessionProgress: 0 })),
      ...selectedOld.map((w) => ({ ...w, sessionProgress: 3 })),
    ]).slice(0, 10) as SessionWord[];

    setSessionWords(finalSession);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
    setCycleCount(0);
    saveSession(finalSession, 0, 0, level, infoMinimized, direction);
  };

  useEffect(() => {
    if (allWords.length === 0) return;

    const stored = loadSession();
    if (stored && stored.ids.length > 0) {
      const storedLevel: HskLevelFilter = stored.hskLevel ?? "all";
      setHskLevel(storedLevel);
      setInfoMinimized(Boolean(stored.infoMinimized));
      setDirection(stored.direction ?? "zh-en");

      const pool = storedLevel === "all" ? allWords : allWords.filter((w) => w.hskLevel === storedLevel);
      const storedWords = stored.ids
        .map((id) => pool.find((w) => w.id === id))
        .filter((w): w is VocabWord => Boolean(w));

      if (storedWords.length > 0) {
        const safeIndex = Math.min(stored.currentIndex ?? 0, storedWords.length - 1);
        const restoredWords: SessionWord[] = storedWords.map((w) => ({
          ...w,
          sessionProgress: stored.progress?.[w.id] ?? (isLearned(w.id) ? 3 : 0),
        }));
        setSessionWords(restoredWords);
        setCurrentIndex(safeIndex);
        setCycleCount(stored.cycleCount ?? 0);
        setIsFlipped(false);
        setIsFinished(false);
        return;
      }
    }

    if (sessionWords.length === 0 && !isFinished) {
      startNewSession(hskLevel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allWords]);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (deltaFadeTimerRef.current) clearTimeout(deltaFadeTimerRef.current);
      if (deltaClearTimerRef.current) clearTimeout(deltaClearTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (sessionWords.length > 0 && !isFinished) {
      saveSession(sessionWords, currentIndex, cycleCount, hskLevel, infoMinimized, direction);
    }
  }, [sessionWords, currentIndex, cycleCount, isFinished, hskLevel, infoMinimized, direction]);

  const advanceToNext = useCallback((words: SessionWord[], fromIndex: number) => {
    if (words.length === 0) {
      setIsFinished(true);
      setSessionWords([]);
      clearSession();
      return;
    }

    let nextIndex = fromIndex + 1;
    let nextWords = words;
    let nextCycle = cycleCount;

    if (nextIndex >= words.length) {
      nextIndex = 0;
      nextCycle += 1;
      nextWords = shuffleArray(words);
      setSessionWords(nextWords);
      setCycleCount(nextCycle);
    }

    setCurrentIndex(nextIndex);
    setIsFlipped(false);
  }, [cycleCount]);

  const scheduleAdvance = useCallback((updatedWords: SessionWord[], feedbackType: "got" | "forgot" | "gold") => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);

    setIsAdvancing(true);
    setFeedback(feedbackType);

    advanceTimerRef.current = setTimeout(() => {
      advanceTimerRef.current = null;
      setIsAdvancing(false);
      setFeedback(null);
      advanceToNext(updatedWords, currentIndex);
    }, ANIMATION_DURATION);
  }, [advanceToNext, currentIndex]);

  const handleGotIt = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isAdvancing || swipeAnimating) return;

    const currentWord = sessionWords[currentIndex];
    const prevProgress = currentWord.sessionProgress;
    const newProgress = Math.min(5, prevProgress + 1);
    const isMaxed = newProgress === 5;

    if (newProgress === prevProgress) {
      advanceToNext(sessionWords, currentIndex);
      return;
    }

    triggerDelta(currentWord.id, "+1", isMaxed ? "yellow" : "emerald");

    const updatedWords = sessionWords.map((w) =>
      w.id === currentWord.id ? { ...w, sessionProgress: newProgress } : w
    );
    setSessionWords(updatedWords);
    scheduleAdvance(updatedWords, isMaxed ? "gold" : "got");
  }, [isAdvancing, swipeAnimating, sessionWords, currentIndex, advanceToNext, scheduleAdvance]);

  const handleForgotIt = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isAdvancing || swipeAnimating) return;

    const currentWord = sessionWords[currentIndex];
    const prevProgress = currentWord.sessionProgress;
    const newProgress = Math.max(0, prevProgress - 1);

    if (newProgress === prevProgress) {
      advanceToNext(sessionWords, currentIndex);
      return;
    }

    triggerDelta(currentWord.id, "-1", "red");

    if (isLearned(currentWord.id)) {
      markAsStillLearning(currentWord.id);
    }

    const updatedWords = sessionWords.map((w) =>
      w.id === currentWord.id ? { ...w, sessionProgress: newProgress } : w
    );
    setSessionWords(updatedWords);
    scheduleAdvance(updatedWords, "forgot");
  }, [isAdvancing, swipeAnimating, sessionWords, currentIndex, advanceToNext, scheduleAdvance, isLearned, markAsStillLearning]);

  const handleRemove = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isAdvancing || swipeAnimating) return;

    const wordId = sessionWords[currentIndex].id;
    markAsLearned(wordId);

    const newSession = sessionWords.filter((_, i) => i !== currentIndex);

    if (newSession.length === 0) {
      setIsFinished(true);
      setSessionWords([]);
      clearSession();
    } else {
      const newIndex = currentIndex >= newSession.length ? 0 : currentIndex;
      setSessionWords(newSession);
      setCurrentIndex(newIndex);
      setIsFlipped(false);
    }
  }, [isAdvancing, swipeAnimating, sessionWords, currentIndex, markAsLearned]);

  // ─── Touch / Swipe handlers ───
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (isAdvancing || swipeAnimating) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    swipingRef.current = false;
  }, [isAdvancing, swipeAnimating]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || isAdvancing || swipeAnimating) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    // Determine if this is a swipe (not just a tap)
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      swipingRef.current = true;
    }

    if (!swipingRef.current) return;

    // Prevent vertical scroll while swiping
    e.preventDefault();

    setSwipeOffset({ x: dx, y: Math.min(0, dy) }); // Only allow upward y

    // Determine action from offset
    if (dy < -SWIPE_UP_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
      setSwipeAction("up");
    } else if (dx > SWIPE_THRESHOLD) {
      setSwipeAction("right");
    } else if (dx < -SWIPE_THRESHOLD) {
      setSwipeAction("left");
    } else {
      setSwipeAction(null);
    }
  }, [isAdvancing, swipeAnimating]);

  const onTouchEnd = useCallback(() => {
    if (!touchStartRef.current || isAdvancing || swipeAnimating) {
      touchStartRef.current = null;
      return;
    }

    const wasSwiping = swipingRef.current;
    const action = swipeAction;

    // If user didn't swipe far enough, snap back
    if (!wasSwiping || !action) {
      setSwipeOffset({ x: 0, y: 0 });
      setSwipeAction(null);
      touchStartRef.current = null;

      // If it was a tap (not a swipe), toggle flip
      if (!wasSwiping) {
        setIsFlipped((f) => !f);
      }
      return;
    }

    // Animate card flying off screen
    setSwipeAnimating(true);
    const flyX = action === "right" ? 400 : action === "left" ? -400 : 0;
    const flyY = action === "up" ? -500 : 0;
    setSwipeOffset({ x: flyX, y: flyY });

    // Execute action after fly-out
    setTimeout(() => {
      setSwipeOffset({ x: 0, y: 0 });
      setSwipeAction(null);
      setSwipeAnimating(false);
      touchStartRef.current = null;

      if (action === "right") {
        handleGotIt();
      } else if (action === "left") {
        handleForgotIt();
      } else if (action === "up") {
        handleRemove();
      }
    }, 250);
  }, [isAdvancing, swipeAnimating, swipeAction, handleGotIt, handleForgotIt, handleRemove]);

  const toggleDirection = () => {
    const newDir = direction === "zh-en" ? "en-zh" : "zh-en";
    setDirection(newDir);
    setIsFlipped(false);
  };

  // ── Finished ──
  if (isFinished) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 bg-neutral-900 rounded-3xl border border-neutral-800 shadow-2xl px-8">
        <div className="mb-6 inline-flex p-4 bg-emerald-950/30 rounded-full border border-emerald-900/40">
          <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Nice, that's all!</h2>
        <p className="text-gray-400 mb-10">You've cleared every card in this session. Great work!</p>
        <button
          onClick={() => { clearSession(); startNewSession(hskLevel); }}
          className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
        >
          Start Another Session
        </button>
      </div>
    );
  }

  if (sessionWords.length === 0) {
    return <div className="text-center py-16 text-gray-400">Loading practice session...</div>;
  }

  const currentWord = sessionWords[currentIndex];
  const isCurrentlyLearned = isLearned(currentWord.id);
  const isChinese = direction === "zh-en";

  // Swipe visual info
  const swipeInfo = getSwipeActionInfo(swipeAction);
  const isSwipeActive = swipingRef.current && swipeAction !== null;

  // Card transform from swipe
  const cardSwipeStyle: React.CSSProperties = (isMobile && (swipeOffset.x !== 0 || swipeOffset.y !== 0))
    ? {
        transform: `translate(${swipeOffset.x}px, ${swipeOffset.y}px) rotate(${swipeOffset.x * 0.05}deg)`,
        transition: swipeAnimating ? "transform 0.25s ease-out, opacity 0.25s ease-out" : "none",
        opacity: swipeAnimating ? 0 : 1,
      }
    : {};

  // Card border color from swipe
  const swipeBorderClass = isSwipeActive
    ? swipeAction === "right"
      ? "border-emerald-500 shadow-[0_0_24px_6px_rgba(16,185,129,0.35)]"
      : swipeAction === "left"
      ? "border-red-500 shadow-[0_0_24px_6px_rgba(239,68,68,0.35)]"
      : swipeAction === "up"
      ? "border-yellow-400 shadow-[0_0_24px_6px_rgba(250,204,21,0.4)]"
      : ""
    : "";

  // Progress bar component
  const ProgressBarInsideCard = () => {
    const isGold = currentWord.sessionProgress === 5;
    const showDelta = deltaPulse?.wordId === currentWord.id;

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
            const filled = step <= currentWord.sessionProgress;
            return (
              <div
                key={step}
                className={`w-6 h-3 rounded-sm border transition-all duration-300 ${
                  filled
                    ? `${isGold ? "bg-yellow-400" : getProgressColor(currentWord.sessionProgress)} border-transparent`
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

        <span
          className={`relative text-xs font-medium tabular-nums transition-colors duration-300 ${
            feedback === "gold" || isGold ? "text-yellow-400" : "text-gray-500"
          }`}
        >
          {currentWord.sessionProgress}/5 <span className={isGold ? "text-yellow-300" : "text-gray-600"}>⭐</span>

          {showDelta && deltaPulse && (
            <span
              className={`absolute -right-8 top-0 text-xs font-black transition-all duration-300 ${
                deltaPulse.tone === "emerald"
                  ? "text-emerald-300"
                  : deltaPulse.tone === "yellow"
                  ? "text-yellow-300"
                  : "text-red-300"
              } ${
                deltaPhase === "start"
                  ? "opacity-0 translate-y-2 scale-90"
                  : deltaPhase === "float"
                  ? "opacity-100 -translate-y-1 scale-100"
                  : "opacity-0 -translate-y-3 scale-100"
              }`}
              style={{
                textShadow:
                  deltaPulse.tone === "emerald"
                    ? "0 0 14px rgba(16,185,129,0.45)"
                    : deltaPulse.tone === "yellow"
                    ? "0 0 16px rgba(250,204,21,0.55)"
                    : "0 0 14px rgba(239,68,68,0.45)",
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
    <div className="mx-auto max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.3fr_0.85fr] gap-4 items-start">
        <div className="hidden lg:block" />

        <div className="w-full flex justify-center">
          <div className="max-w-lg w-full">
            {/* Controls */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
                {/* HSK Level */}
                <div className="inline-flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-xl p-1">
                  {([
                    { value: "all" as const, label: "All" },
                    { value: 1 as const, label: "HSK 1" },
                    { value: 2 as const, label: "HSK 2" },
                  ] satisfies { value: HskLevelFilter; label: string }[]).map((opt) => (
                    <button
                      key={String(opt.value)}
                      onClick={() => {
                        setHskLevel(opt.value);
                        clearSession();
                        startNewSession(opt.value);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                        hskLevel === opt.value
                          ? "bg-red-600 text-white shadow-sm shadow-red-900/20"
                          : "text-gray-400 hover:text-white hover:bg-neutral-900"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Direction toggle + help */}
                <div className="inline-flex items-center gap-2">
                  <button
                    onClick={toggleDirection}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:border-neutral-700 transition-all"
                    title={direction === "zh-en" ? "Switch to English → Chinese" : "Switch to Chinese → English"}
                  >
                    {direction === "zh-en" ? (
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

                  {isMobile && (
                    <button
                      onClick={() => {
                        const next = !infoMinimized;
                        setInfoMinimized(next);
                        saveSession(sessionWords, currentIndex, cycleCount, hskLevel, next, direction);
                      }}
                      className={`w-10 h-10 inline-flex items-center justify-center rounded-xl border transition-all ${
                        infoMinimized
                          ? "bg-neutral-900 border-neutral-800 text-gray-500 hover:text-white hover:border-neutral-700"
                          : "bg-yellow-950/25 border-yellow-900/40 text-yellow-300 hover:bg-yellow-950/35 hover:border-yellow-700/50"
                      }`}
                      title={infoMinimized ? "Show help" : "Hide help"}
                    >
                      {infoMinimized ? <span className="text-lg font-black">?</span> : <span className="text-lg">—</span>}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile help panel */}
            {isMobile && !infoMinimized && (
              <div className="mb-5 bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 shadow-lg">
                <div className="text-[11px] leading-relaxed text-gray-400">
                  <p className="font-semibold text-white">How to:</p>
                  <p className="mt-2">
                    10 words per session (8 new + 2 learned). Use <span className="text-emerald-400 font-semibold">Got it</span>{" "}
                    / <span className="text-rose-400 font-semibold">Forgot it</span> to adjust progress.
                  </p>
                  <p className="mt-2">
                    At <span className="text-yellow-400 font-semibold">5/5 ⭐</span>, hit <span className="text-yellow-400 font-semibold">Learned it</span> to remove the word.
                  </p>
                  <p className="mt-2">
                    <span className="font-semibold text-white">Swipe:</span>{" "}
                    <span className="text-emerald-400">right = Got it</span>,{" "}
                    <span className="text-rose-400">left = Forgot it</span>,{" "}
                    <span className="text-yellow-400">up = Learned it</span>.
                  </p>
                  <p className="mt-2">
                    Toggle <span className="font-semibold text-white">中 → EN</span> to switch direction.
                  </p>
                </div>
              </div>
            )}

            {/* Progress header */}
            <div className="mb-6">
              <div className="flex justify-between items-center text-sm text-gray-400 mb-2">
                <span>Card {currentIndex + 1} of {sessionWords.length}</span>
                <span className="bg-neutral-800 px-2 py-1 rounded text-xs">
                  Practice{cycleCount > 0 ? ` · Cycle ${cycleCount + 1}` : ""}
                </span>
              </div>

              {/* Segmented bar */}
              <div
                className={`h-2 bg-neutral-800 rounded-full overflow-hidden flex transition-all duration-300 ${
                  feedback === "got" || feedback === "gold"
                    ? "ring-2 ring-emerald-500/40"
                    : feedback === "forgot"
                    ? "ring-2 ring-red-500/40"
                    : ""
                }`}
              >
                {sessionWords.map((word, i) => {
                  const isCurrent = i === currentIndex;
                  const color = getProgressColor(word.sessionProgress);
                  return (
                    <div
                      key={word.id}
                      className={`h-full flex-1 transition-all duration-300 ${color} ${
                        isCurrent ? "z-10 relative brightness-150 scale-y-150" : ""
                      } ${i > 0 ? "border-l border-black/30" : ""}`}
                      style={isCurrent ? { boxShadow: "0 0 8px 2px rgba(255,255,255,0.4)" } : undefined}
                    />
                  );
                })}
              </div>
            </div>

            {/* ── Flashcard with swipe ── */}
            <div className="relative">
              {/* Swipe action overlay (behind the card) */}
              {isMobile && isSwipeActive && swipeInfo && (
                <div className={`absolute inset-0 rounded-3xl flex items-center justify-center z-0 ${swipeInfo.bg} border-2 ${swipeInfo.border} transition-all duration-150`}>
                  <div className={`text-center ${swipeInfo.color}`}>
                    <div className="text-4xl mb-2">{swipeInfo.icon}</div>
                    <div className="text-lg font-bold">{swipeInfo.text}</div>
                  </div>
                </div>
              )}

              <div
                className={`bg-neutral-900 rounded-3xl shadow-2xl border h-[min(580px,calc(100dvh-300px))] flex flex-col items-center justify-center select-none transition-all duration-300 relative overflow-hidden z-10 ${
                  isMobile ? "touch-none" : "cursor-pointer"
                } ${swipeBorderClass || getCardGlowClass(feedback, currentWord.sessionProgress >= 5)}`}
                onClick={isMobile ? undefined : () => setIsFlipped(!isFlipped)}
                onTouchStart={isMobile ? onTouchStart : undefined}
                onTouchMove={isMobile ? onTouchMove : undefined}
                onTouchEnd={isMobile ? onTouchEnd : undefined}
                style={cardSwipeStyle}
              >
                {/* Swipe label on card */}
                {isMobile && isSwipeActive && swipeInfo && (
                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none`}>
                    <div className={`px-6 py-3 rounded-2xl bg-black/70 backdrop-blur-sm border ${swipeInfo.border}`}>
                      <span className={`text-xl font-bold ${swipeInfo.color}`}>{swipeInfo.text}</span>
                    </div>
                  </div>
                )}

                {/* Top badges */}
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
                  {isCurrentlyLearned && (
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

                {/* Mobile swipe hint */}
                {isMobile && !isFlipped && !isSwipeActive && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-6 text-[10px] text-gray-600 pointer-events-none">
                    <span>← Forgot</span>
                    <span>↑ Learned</span>
                    <span>Got it →</span>
                  </div>
                )}

                {/* Front content */}
                <div
                  className={`flex flex-col items-center transition-all duration-300 ${
                    isFlipped ? "scale-75 -translate-y-12 opacity-40" : "scale-100 translate-y-0 opacity-100"
                  }`}
                >
                  {isChinese ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <p className="text-4xl font-bold text-white text-center px-6">{currentWord.english}</p>
                      <p className="text-gray-500 text-sm mt-2">(English → Chinese)</p>
                    </>
                  )}

                  {!isFlipped && (
                    <div className="mt-8">
                      <ProgressBarInsideCard />
                    </div>
                  )}

                  {!isFlipped && (
                    <p className="text-gray-600 text-sm mt-4">
                      {isMobile
                        ? (isChinese ? "Tap to reveal · Swipe to answer" : "Tap to reveal Chinese")
                        : (isChinese ? "Tap to reveal · Hover for pinyin" : "Tap to reveal Chinese")
                      }
                    </p>
                  )}
                </div>

                {/* Back overlay */}
                <div
                  className={`absolute inset-0 pt-28 sm:pt-36 pb-5 px-5 sm:px-6 w-full flex flex-col items-center overflow-y-auto bg-neutral-900/90 transition-all duration-300 scrollbar-hide ${
                    isFlipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"
                  }`}
                >
                  {isChinese ? (
                    <>
                      <p className="text-red-400 text-xl font-medium mb-1">{currentWord.pinyin}</p>
                      <p className="text-white text-3xl font-bold mb-4 text-center">{currentWord.english}</p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-end gap-2 justify-center mb-2">
                        {currentWord.hanzi.split("").map((char, i) => (
                          <HoverCharacter
                            key={i}
                            char={char}
                            pinyin={extractPinyinForChar(currentWord.pinyin, i, currentWord.hanzi.length)}
                            size="xl"
                          />
                        ))}
                      </div>
                      <p className="text-red-400 text-lg font-medium mb-2">{currentWord.pinyin}</p>
                      <SpeakerButton text={currentWord.hanzi} size="md" />
                    </>
                  )}

                  <div className="my-4">
                    <ProgressBarInsideCard />
                  </div>

                  <div className="space-y-3 mt-2 text-left w-full">
                    {currentWord.examples.slice(0, 3).map((ex, idx) => (
                      <div key={idx} className="p-3 bg-black/40 rounded-xl border border-neutral-800 flex items-start gap-2">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-end gap-0.5 mb-1.5">
                            {ex.pinyinWords.map((pw, i) => (
                              <HoverCharacter key={i} char={pw.char} pinyin={pw.pinyin} size="sm" />
                            ))}
                          </div>
                          <p className="text-gray-400 text-xs leading-relaxed">{ex.english}</p>
                        </div>
                        <SpeakerButton text={ex.chinese} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleForgotIt}
                disabled={isAdvancing || swipeAnimating}
                className={`flex-1 py-4 bg-neutral-900 text-red-400 rounded-xl font-bold transition-all duration-200 border flex items-center justify-center gap-2 ${
                  isAdvancing && feedback === "forgot"
                    ? "border-red-500 bg-red-950/30 scale-[0.98]"
                    : isAdvancing || swipeAnimating
                    ? "opacity-60 cursor-not-allowed border-red-900/40"
                    : "border-red-900/40 hover:bg-red-950/40 hover:border-red-700/60"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Forgot it
              </button>
              <button
                onClick={handleGotIt}
                disabled={isAdvancing || swipeAnimating}
                className={`flex-1 py-4 bg-neutral-900 rounded-xl font-bold transition-all duration-200 border flex items-center justify-center gap-2 ${
                  isAdvancing && (feedback === "got" || feedback === "gold")
                    ? "border-emerald-500 bg-emerald-950/30 scale-[0.98] text-emerald-400"
                    : isAdvancing || swipeAnimating
                    ? "opacity-60 cursor-not-allowed border-emerald-900/40 text-emerald-400"
                    : currentWord.sessionProgress === 4
                    ? "text-emerald-400 border-emerald-900/40 hover:text-yellow-300 hover:border-yellow-500/70 hover:bg-yellow-950/20 hover:shadow-[0_0_14px_3px_rgba(250,204,21,0.3)]"
                    : "text-emerald-400 border-emerald-900/40 hover:bg-emerald-950/40 hover:border-emerald-700/60"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Got it
              </button>
            </div>

            {/* Learned it button */}
            <button
              onClick={handleRemove}
              disabled={isAdvancing || swipeAnimating}
              className={`w-full mt-3 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                isAdvancing || swipeAnimating
                  ? "opacity-60 cursor-not-allowed text-yellow-500/60 bg-neutral-950 border border-yellow-900/30"
                  : currentWord.sessionProgress >= 5
                  ? "text-yellow-400 bg-yellow-950/30 border border-yellow-600/60 shadow-[0_0_16px_3px_rgba(250,204,21,0.35)] hover:shadow-[0_0_22px_5px_rgba(250,204,21,0.45)] hover:text-yellow-300 hover:border-yellow-500/80 hover:bg-yellow-950/40"
                  : "text-yellow-500/80 bg-neutral-950 border border-yellow-900/30 hover:text-yellow-400 hover:border-yellow-600/60 hover:bg-yellow-950/20 hover:shadow-[0_0_12px_2px_rgba(250,204,21,0.25)]"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Learned it{currentWord.sessionProgress >= 5 ? " ⭐" : ""}
            </button>

            {/* Dot indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {sessionWords.map((w, i) => {
                const isCurrent = i === currentIndex;
                const color = getProgressColor(w.sessionProgress);
                const glow = isCurrent ? getProgressGlow(w.sessionProgress) : "";
                return (
                  <div
                    key={w.id}
                    className={`rounded-full transition-all duration-300 ${color} ${glow} ${
                      isCurrent ? "w-3 h-3" : "w-2 h-2"
                    }`}
                  />
                );
              })}
            </div>

            <div className="mt-10 text-center">
              <button
                onClick={() => { clearSession(); startNewSession(hskLevel); }}
                className="text-gray-600 hover:text-gray-400 text-xs font-medium uppercase tracking-widest transition-colors"
              >
                Start New Session
              </button>
            </div>
          </div>
        </div>

        {/* Desktop help toast */}
        <div className={`hidden lg:block justify-self-end ${isMobile ? "hidden" : ""}`}>
          {infoMinimized ? (
            <button
              onClick={() => {
                setInfoMinimized(false);
                saveSession(sessionWords, currentIndex, cycleCount, hskLevel, false, direction);
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-gray-500 hover:text-white hover:border-neutral-700 transition-all shadow-lg sticky top-24"
              title="Show help"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          ) : (
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl px-5 py-4 pr-11 shadow-xl sticky top-24 max-w-[300px]">
              <div className="text-xs leading-relaxed text-gray-400">
                <p className="font-semibold text-white">How to:</p>
                <p className="mt-2">
                  Each Practice Session consists of <span className="font-semibold text-white">10 words</span>, out of
                  which <span className="font-semibold text-white">8</span> are{" "}
                  <span className="font-semibold text-rose-400">new</span> and{" "}
                  <span className="font-semibold text-white">2</span> have been marked as{" "}
                  <span className="font-semibold text-emerald-400">learned</span> before to make sure they aren't
                  forgotten. :)
                </p>
                <p className="mt-2">
                  Click <span className="font-semibold text-emerald-400">Got it</span> to increase progress,{" "}
                  <span className="font-semibold text-rose-400">Forgot it</span> to decrease it.
                </p>
                <p className="mt-2">
                  <span className="font-semibold text-yellow-400">Learned it</span> removes the word from the session
                  and marks it as learned. Keep going until{" "}
                  <span className="font-semibold text-white">no words left</span>!
                </p>
                <p className="mt-3 pt-2 border-t border-neutral-800">
                  <span className="font-semibold text-white">Progress (0–5):</span><br/>
                  Press <span className="text-emerald-400">Got it</span> to fill the bar.
                  At <span className="text-yellow-400">5/5 ⭐</span>, hit <span className="text-yellow-400">Learned it</span>!
                </p>
                <p className="mt-3 pt-2 border-t border-neutral-800">
                  Toggle <span className="font-semibold text-white">中 → EN</span> to switch direction.
                </p>
              </div>
              <button
                onClick={() => {
                  setInfoMinimized(true);
                  saveSession(sessionWords, currentIndex, cycleCount, hskLevel, true, direction);
                }}
                className="absolute top-3 right-3 w-8 h-8 inline-flex items-center justify-center rounded-xl text-gray-500 hover:text-white hover:bg-neutral-800 transition-colors"
                title="Minimize"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
          if (ch === "n" || (ch === "g" && current.endsWith("ng"))) continue;
          result.push(current);
          current = "";
        }
      }
    }
  }

  if (current) result.push(current);
  return result.length === 0 ? [pinyin] : result;
}
