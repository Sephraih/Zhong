import { useState, useEffect } from "react";
import { HoverCharacter } from "./HoverCharacter";
import { SpeakerButton } from "./SpeakerButton";
import type { VocabWord } from "../data/vocabulary";
import type { LearnedState } from "../hooks/useLearnedState";

interface PracticeModeProps {
  allWords: VocabWord[];
  learnedState: LearnedState;
}

type HskLevelFilter = "all" | 1 | 2;

interface StoredSession {
  ids: number[];
  currentIndex: number;
  cycleCount: number;
  hskLevel: HskLevelFilter;
  infoDismissed?: boolean;
}

const STORAGE_KEY = "hanyu-practice-session";

export function PracticeMode({ allWords, learnedState }: PracticeModeProps) {
  const [sessionWords, setSessionWords] = useState<VocabWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [hskLevel, setHskLevel] = useState<HskLevelFilter>("all");
  const [infoDismissed, setInfoDismissed] = useState(false);

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
    words: VocabWord[],
    index: number,
    cycle: number,
    level: HskLevelFilter,
    dismissed: boolean
  ) => {
    try {
      const payload: StoredSession = {
        ids: words.map((w) => w.id),
        currentIndex: index,
        cycleCount: cycle,
        hskLevel: level,
        infoDismissed: dismissed,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  };

  const loadSession = (): StoredSession | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as StoredSession;
      if (!parsed || !Array.isArray(parsed.ids)) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const clearSession = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const startNewSession = (level: HskLevelFilter = hskLevel) => {
    const pool = level === "all" ? allWords : allWords.filter((w) => w.hskLevel === level);
    const unlearned = shuffleArray(pool.filter((w) => !isLearned(w.id)));
    const learned = shuffleArray(pool.filter((w) => isLearned(w.id)));

    let selectedNew = unlearned.slice(0, 8);
    let selectedOld = learned.slice(0, 2);

    if (selectedNew.length < 8) {
      const extraNeeded = 8 - selectedNew.length;
      selectedOld = [...selectedOld, ...learned.slice(2, 2 + extraNeeded)];
    }
    if (selectedOld.length < 2) {
      const extraNeeded = 2 - selectedOld.length;
      selectedNew = [...selectedNew, ...unlearned.slice(8, 8 + extraNeeded)];
    }

    const finalSession = shuffleArray([...selectedNew, ...selectedOld].slice(0, 10));
    setSessionWords(finalSession);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
    setCycleCount(0);
    saveSession(finalSession, 0, 0, level, infoDismissed);
  };

  useEffect(() => {
    if (allWords.length === 0) return;

    const stored = loadSession();
    if (stored && stored.ids.length > 0) {
      const storedLevel: HskLevelFilter = stored.hskLevel ?? "all";
      setHskLevel(storedLevel);
      setInfoDismissed(Boolean(stored.infoDismissed));

      const pool = storedLevel === "all" ? allWords : allWords.filter((w) => w.hskLevel === storedLevel);
      const storedWords = stored.ids
        .map((id) => pool.find((w) => w.id === id))
        .filter((w): w is VocabWord => Boolean(w));

      if (storedWords.length > 0) {
        const safeIndex = Math.min(stored.currentIndex ?? 0, storedWords.length - 1);
        setSessionWords(storedWords);
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
    if (sessionWords.length > 0 && !isFinished) {
      saveSession(sessionWords, currentIndex, cycleCount, hskLevel, infoDismissed);
    }
  }, [sessionWords, currentIndex, cycleCount, isFinished, hskLevel, infoDismissed]);

  const advanceToNext = (words: VocabWord[], fromIndex: number) => {
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
  };

  const handleGotIt = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAsLearned(sessionWords[currentIndex].id);
    advanceToNext(sessionWords, currentIndex);
  };

  const handleForgotIt = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAsStillLearning(sessionWords[currentIndex].id);
    advanceToNext(sessionWords, currentIndex);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    const wordId = sessionWords[currentIndex].id;
    markAsLearned(wordId);

    const newSession = sessionWords.filter((_, i) => i !== currentIndex);

    if (newSession.length === 0) {
      setIsFinished(true);
      setSessionWords([]);
    } else {
      const newIndex = currentIndex >= newSession.length ? 0 : currentIndex;
      setSessionWords(newSession);
      setCurrentIndex(newIndex);
      setIsFlipped(false);
    }
  };

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
          onClick={() => {
            clearSession();
            startNewSession(hskLevel);
          }}
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

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.3fr_0.85fr] gap-4 items-start">
        {/* Left spacer (keeps center column centered) */}
        <div className="hidden lg:block" />

        {/* Center column */}
        <div className="w-full flex justify-center">
          <div className="max-w-lg w-full">
            {/* Controls */}
          <div className="mb-6">
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-xl p-1">
                {([
                  { value: "all" as const, label: "All" },
                  { value: 1 as const, label: "HSK 1" },
                  { value: 2 as const, label: "HSK 2" },
                ] satisfies { value: HskLevelFilter; label: string }[]).map((opt) => (
                  <button
                    key={String(opt.value)}
                    onClick={() => {
                      const next = opt.value;
                      setHskLevel(next);
                      clearSession();
                      startNewSession(next);
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
            </div>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center text-sm text-gray-400 mb-2">
              <span>
                Card {currentIndex + 1} of {sessionWords.length}
              </span>
              <span className="bg-neutral-800 px-2 py-1 rounded text-xs">
                Practice{cycleCount > 0 ? ` · Cycle ${cycleCount + 1}` : ""}
              </span>
            </div>
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden flex">
              {sessionWords.map((word, i) => (
                <div
                  key={word.id}
                  className={`h-full flex-1 transition-colors duration-300 ${
                    i === currentIndex
                      ? "bg-neutral-500"
                      : isLearned(word.id)
                        ? "bg-emerald-900/60"
                        : "bg-rose-500/60"
                  } ${i > 0 ? "border-l border-black/20" : ""}`}
                />
              ))}
            </div>
          </div>

          {/* Flashcard */}
          <div
            className="bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-800 h-[580px] flex flex-col items-center justify-center cursor-pointer select-none hover:border-neutral-700 transition-all relative pb-4 overflow-hidden"
            onClick={() => setIsFlipped(!isFlipped)}
          >
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

            <div
              className={`flex flex-col items-center transition-all duration-300 ${
                isFlipped ? "scale-75 -translate-y-12 opacity-40" : "scale-100 translate-y-0 opacity-100"
              }`}
            >
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
              {!isFlipped && <p className="text-gray-600 text-sm mt-8">Tap to reveal · Hover for pinyin</p>}
            </div>

            <div
              className={`absolute inset-0 pt-36 pb-6 px-6 w-full flex flex-col items-center overflow-y-auto bg-neutral-900/90 transition-all duration-300 scrollbar-hide ${
                isFlipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"
              }`}
            >
              <p className="text-red-400 text-xl font-medium mb-1">{currentWord.pinyin}</p>
              <p className="text-white text-3xl font-bold mb-6 text-center">{currentWord.english}</p>

              <div className="space-y-3 mt-4 text-left w-full">
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

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleForgotIt}
              className="flex-1 py-4 bg-neutral-900 text-red-400 rounded-xl font-bold hover:bg-red-950/40 transition-all border border-red-900/40 hover:border-red-700/60 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Forgot it
            </button>
            <button
              onClick={handleGotIt}
              className="flex-1 py-4 bg-neutral-900 text-emerald-400 rounded-xl font-bold hover:bg-emerald-950/40 transition-all border border-emerald-900/40 hover:border-emerald-700/60 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Got it
            </button>
          </div>

          <button
            onClick={handleRemove}
            className="w-full mt-3 py-3 rounded-xl text-sm font-semibold text-emerald-400 hover:text-emerald-300 bg-neutral-950 border border-emerald-900/40 hover:border-emerald-700/60 hover:bg-emerald-950/20 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Learned it
          </button>

          <div className="flex justify-center gap-1 mt-6">
            {sessionWords.map((w, i) => (
              <div
                key={w.id}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentIndex ? "bg-neutral-500" : isLearned(w.id) ? "bg-emerald-800" : "bg-rose-500"
                }`}
              />
            ))}
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => {
                clearSession();
                startNewSession(hskLevel);
              }}
              className="text-gray-600 hover:text-gray-400 text-xs font-medium uppercase tracking-widest transition-colors"
            >
              Start New Session
            </button>
          </div>
          </div>
        </div>

        {/* Right column: info toast */}
        <div className="hidden lg:block justify-self-end">
          {!infoDismissed && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl px-5 py-4 pr-11 shadow-xl sticky top-24 max-w-[300px]">
              <div className="text-xs leading-relaxed text-gray-400">
                <p className="font-semibold text-white">How to:</p>
                <p className="mt-2">
                  Each Practice Session consists of <span className="font-semibold text-white">10 words</span>, out of which{" "}
                  <span className="font-semibold text-white">8</span> are <span className="font-semibold text-rose-400">new</span> and{" "}
                  <span className="font-semibold text-white">2</span> have been marked as <span className="font-semibold text-emerald-400">learned</span> before to make sure they aren't forgotten. :)
                </p>
                <p className="mt-2">
                  Click on <span className="font-semibold text-emerald-400">Got it</span> /{" "}
                  <span className="font-semibold text-rose-400">Forgot it</span> to cycle through them as many times as you want.
                </p>
                <p className="mt-2">
                  Select <span className="font-semibold text-emerald-400">Learned it</span>, to{" "}
                  <span className="font-semibold text-white">remove</span> the word from the session if you know it for sure. Keep going until you have{" "}
                  <span className="font-semibold text-white">no words left</span>!
                </p>
              </div>
              <button
                onClick={() => {
                  setInfoDismissed(true);
                  saveSession(sessionWords, currentIndex, cycleCount, hskLevel, true);
                }}
                className="absolute top-3 right-3 w-8 h-8 inline-flex items-center justify-center rounded-xl text-gray-500 hover:text-white hover:bg-neutral-800 transition-colors"
                title="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
