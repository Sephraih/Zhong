import { useState, useMemo, useCallback } from "react";
import { HoverCharacter, isHoverCharacterEvent } from "./HoverCharacter";
import { SpeakerButton } from "./SpeakerButton";
import { getHskBadgeClasses } from "../utils/hskColors";
import type { VocabWord } from "../data/vocabulary";
import type { LearnedState } from "../hooks/useLearnedState";
import { extractPinyinForChar, groupByTrailingPunctuation } from "../utils/pinyinUtils";
import { useIsMobile } from "../hooks/useIsMobile";
import { useCardStore } from "../hooks/useCardStore";
import { useTtsVoiceCheck } from "../hooks/useTtsVoiceCheck";
import { TtsVoiceWarning } from "./TtsVoiceWarning";

export type FlashcardFilter = "all" | "still-learning" | "learned";

interface FlashcardModeProps {
  allWords: VocabWord[];
  learnedState: LearnedState;
  wordStatusFilter: FlashcardFilter;
  onLockedLevelClick?: () => void;
  onNavigateToSupport?: () => void;
}

interface FlashcardItem {
  key: string;
  source: "hsk" | "custom";
  id: number;
  hanzi: string;
  pinyin: string;
  english: string;
  hskLevel: number;
  category: string;
  examples: VocabWord["examples"];
}

const HSK_LEVELS = [1, 2, 3, 4, 5, 6] as const;
type HskLevel = (typeof HSK_LEVELS)[number];

function getHskButtonClasses(level: HskLevel, isSelected: boolean): string {
  if (!isSelected) return "text-gray-400 hover:text-white hover:bg-neutral-900";
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

function hskWordToItem(w: VocabWord): FlashcardItem {
  return {
    key: `hsk_${w.id}`,
    source: "hsk",
    id: w.id,
    hanzi: w.hanzi,
    pinyin: w.pinyin,
    english: w.english,
    hskLevel: w.hskLevel,
    category: w.category,
    examples: w.examples,
  };
}

const ADD_COUNTS = [5, 10, 20, 50] as const;

export function FlashcardMode({ allWords, learnedState, wordStatusFilter, onLockedLevelClick, onNavigateToSupport }: FlashcardModeProps) {
  const isMobile = useIsMobile();
  const store = useCardStore();
  const noChineseVoice = useTtsVoiceCheck();

  const { toggleLearned, isLearned, learnedCount } = learnedState;

  // Session items — the unified pool of cards in play
  const [sessionItems, setSessionItems] = useState<FlashcardItem[]>([]);
  const [activeDeckIds, setActiveDeckIds] = useState<Set<number>>(new Set());
  const [setupOpen, setSetupOpen] = useState(true);

  // HSK level selection (for drawing random cards)
  const accessibleLevels = useMemo(() => {
    const levels = new Set<HskLevel>();
    allWords.forEach((w) => {
      if (HSK_LEVELS.includes(w.hskLevel as HskLevel)) levels.add(w.hskLevel as HskLevel);
    });
    return Array.from(levels).sort((a, b) => a - b);
  }, [allWords]);

  const [hskFilterLevels, setHskFilterLevels] = useState<Set<HskLevel>>(() => new Set([1]));

  // Card navigation state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(0);

  const isLevelEnabled = (level: HskLevel) => accessibleLevels.includes(level);

  const toggleHskFilterLevel = (level: HskLevel) => {
    if (!isLevelEnabled(level)) return;
    setHskFilterLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level); else next.add(level);
      return next;
    });
  };

  // Add N random HSK cards from the current level filter pool
  const addHskCards = (count: number | "all") => {
    const pool = allWords.filter((w) => hskFilterLevels.has(w.hskLevel as HskLevel));
    const existingKeys = new Set(sessionItems.map((i) => i.key));
    const candidates = pool.filter((w) => !existingKeys.has(`hsk_${w.id}`));
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    const toAdd = count === "all" ? shuffled : shuffled.slice(0, count);
    if (toAdd.length === 0) return;
    setSessionItems((prev) => [...prev, ...toAdd.map(hskWordToItem)]);
    setSetupOpen(false);
  };

  // Toggle deck on/off
  const toggleDeck = (deckId: number) => {
    const isActive = activeDeckIds.has(deckId);
    setActiveDeckIds((prev) => {
      const next = new Set(prev);
      if (isActive) next.delete(deckId); else next.add(deckId);
      return next;
    });

    if (isActive) {
      // Remove cards from this deck
      const deckEntries = store.getCardsForDeck(deckId);
      const keysToRemove = new Set(deckEntries.map((dc) => `${dc.cardType}_${dc.cardId}`));
      setSessionItems((prev) => prev.filter((item) => !keysToRemove.has(item.key)));
    } else {
      // Add cards from this deck (dedup)
      const deckEntries = store.getCardsForDeck(deckId);
      const existingKeys = new Set(sessionItems.map((i) => i.key));
      const toAdd: FlashcardItem[] = [];
      for (const dc of deckEntries) {
        const key = `${dc.cardType}_${dc.cardId}`;
        if (existingKeys.has(key)) continue;
        if (dc.cardType === "custom") {
          const card = store.cards.find((c) => c.id === dc.cardId);
          if (card) {
            toAdd.push({
              key,
              source: "custom",
              id: card.id,
              hanzi: card.hanzi,
              pinyin: card.pinyin,
              english: card.english,
              hskLevel: 0,
              category: "Custom",
              examples: card.examples,
            });
          }
        } else {
          const word = allWords.find((w) => w.id === dc.cardId);
          if (word) toAdd.push(hskWordToItem(word));
        }
      }
      if (toAdd.length > 0) setSessionItems((prev) => [...prev, ...toAdd]);
      if (deckEntries.length > 0) setSetupOpen(false);
    }
  };

  const clearSession = () => {
    setSessionItems([]);
    setActiveDeckIds(new Set());
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Apply wordStatusFilter
  const displayItems = useMemo(() => {
    let items = sessionItems;
    if (wordStatusFilter === "still-learning") {
      items = items.filter((item) =>
        item.source === "hsk" ? !isLearned(item.id) : !(store.cards.find((c) => c.id === item.id)?.learned ?? false)
      );
    } else if (wordStatusFilter === "learned") {
      items = items.filter((item) =>
        item.source === "hsk" ? isLearned(item.id) : (store.cards.find((c) => c.id === item.id)?.learned ?? false)
      );
    }
    if (isShuffled) {
      const arr = [...items];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionItems, wordStatusFilter, isLearned, isShuffled, shuffleSeed, store.cards]);

  const currentItem = displayItems[currentIndex];

  const goNext = useCallback(() => {
    if (isFlipped) {
      setIsNavigating(true);
      setIsFlipped(false);
      setCurrentIndex((prev) => (prev + 1) % displayItems.length);
      setTimeout(() => setIsNavigating(false), 0);
    } else {
      setCurrentIndex((prev) => (prev + 1) % displayItems.length);
    }
  }, [isFlipped, displayItems.length]);

  const goPrev = useCallback(() => {
    if (isFlipped) {
      setIsNavigating(true);
      setIsFlipped(false);
      setCurrentIndex((prev) => (prev - 1 + displayItems.length) % displayItems.length);
      setTimeout(() => setIsNavigating(false), 0);
    } else {
      setCurrentIndex((prev) => (prev - 1 + displayItems.length) % displayItems.length);
    }
  }, [isFlipped, displayItems.length]);

  const handleToggleLearned = useCallback(() => {
    if (!currentItem) return;
    if (currentItem.source === "hsk") {
      toggleLearned(currentItem.id);
    } else {
      store.toggleCardLearned(currentItem.id);
    }
  }, [currentItem, toggleLearned, store]);

  const handleShuffle = () => {
    setIsShuffled(true);
    setShuffleSeed((s) => s + 1);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleReset = () => {
    setIsShuffled(false);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const currentIsLearned = currentItem
    ? currentItem.source === "hsk"
      ? isLearned(currentItem.id)
      : (store.cards.find((c) => c.id === currentItem.id)?.learned ?? false)
    : false;

  const progress = displayItems.length > 0 ? ((currentIndex + 1) / displayItems.length) * 100 : 0;
  const totalLearned = learnedCount;
  const totalLearning = allWords.length - learnedCount;

  // ── Session Setup Panel ───────────────────────────────────────────────────

  const SessionPanel = () => (
    <div className="mb-4 bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setSetupOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
      >
        <span>Session setup {sessionItems.length > 0 ? `· ${sessionItems.length} cards` : ""}</span>
        <svg className={`w-4 h-4 transition-transform ${setupOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {setupOpen && (
        <div className="border-t border-neutral-800 p-4 space-y-5">
          {/* Decks section */}
          {store.decks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">My Decks</p>
              <div className="flex flex-wrap gap-2">
                {store.decks.map((deck) => {
                  const active = activeDeckIds.has(deck.id);
                  const count = store.getDeckCardCount(deck.id);
                  return (
                    <button
                      key={deck.id}
                      onClick={() => toggleDeck(deck.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                        active
                          ? "bg-red-600 border-red-500 text-white"
                          : "bg-neutral-800 border-neutral-700 text-gray-400 hover:border-neutral-600 hover:text-white"
                      }`}
                    >
                      {deck.title}
                      <span className={`text-[10px] ${active ? "text-red-200" : "text-gray-600"}`}>({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* HSK section */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">HSK Catalogue</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {([1, 2, 3, 4, 5, 6] as HskLevel[]).map((level) => {
                const enabled = isLevelEnabled(level);
                const selected = hskFilterLevels.has(level);
                return (
                  <button
                    key={level}
                    onClick={() => { if (!enabled) { onLockedLevelClick?.(); return; } toggleHskFilterLevel(level); }}
                    title={enabled ? undefined : "Sign in or upgrade to Premium to unlock"}
                    className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                      !enabled
                        ? getLockedHskButtonClasses(level)
                        : selected
                        ? `${getHskButtonClasses(level, true)} border-transparent`
                        : `${getHskButtonClasses(level, false)} border-neutral-800`
                    }`}
                  >
                    {!enabled ? "🔒 " : ""}HSK {level}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              {ADD_COUNTS.map((n) => (
                <button
                  key={n}
                  onClick={() => addHskCards(n)}
                  disabled={hskFilterLevels.size === 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-gray-300 border border-neutral-700 transition-colors"
                >
                  +{n} cards
                </button>
              ))}
              <button
                onClick={() => addHskCards("all")}
                disabled={hskFilterLevels.size === 0}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-gray-300 border border-neutral-700 transition-colors"
              >
                + All
              </button>
            </div>
          </div>

          {sessionItems.length > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
              <span className="text-xs text-gray-500">{sessionItems.length} cards in session</span>
              <button onClick={clearSession} className="text-xs text-red-500 hover:text-red-400 transition-colors">Clear session</button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── Empty states ──────────────────────────────────────────────────────────

  if (sessionItems.length === 0) {
    return (
      <div className="max-w-lg mx-auto">
        <SessionPanel />
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-3">🃏</p>
          <p className="font-medium">No cards in session</p>
          <p className="text-sm mt-1">Add cards from a deck or the HSK catalogue above</p>
        </div>
      </div>
    );
  }

  if (displayItems.length === 0) {
    return (
      <div className="max-w-lg mx-auto">
        <SessionPanel />
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium">No cards match the current filter</p>
          <p className="text-sm mt-1">
            {wordStatusFilter === "learned"
              ? "No cards in this session are marked as learned yet."
              : "All cards are marked as learned! Great job!"}
          </p>
        </div>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="max-w-lg mx-auto">
        <SessionPanel />
        <div className="text-center py-12 text-gray-400">Loading cards...</div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {noChineseVoice && <TtsVoiceWarning onMoreInfo={onNavigateToSupport} className="mb-4" />}
      <SessionPanel />

      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-emerald-400 font-semibold">✅ {totalLearned}</span>
          <span className="text-gray-600">·</span>
          <span className="text-red-400 font-semibold">📖 {totalLearning}</span>
        </div>

        <span className="text-sm text-gray-400 font-medium">
          {currentIndex + 1} / {displayItems.length}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border bg-neutral-900 text-gray-400 border-neutral-700 hover:border-red-700/60 hover:text-white hover:bg-neutral-800"
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
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
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
          currentIsLearned ? "border-emerald-700/50 hover:border-emerald-600/70" : "border-neutral-800 hover:border-neutral-700"
        }`}
        onClick={(e) => {
          if (isHoverCharacterEvent(e)) return;
          setIsFlipped(!isFlipped);
        }}
      >
        {/* Badge row */}
        <div className="absolute top-5 left-6 flex items-center gap-2">
          {currentItem.source === "custom" ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/40">
              Custom
            </span>
          ) : (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getHskBadgeClasses(currentItem.hskLevel)}`}>
              HSK {currentItem.hskLevel}
            </span>
          )}
          {currentIsLearned && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-950/80 border border-emerald-800/50">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
        </div>
        <div className="absolute top-5 right-6">
          <span className="text-xs text-gray-600 font-medium">{currentItem.category}</span>
        </div>

        {/* Front */}
        <div className={`flex flex-col items-center ${isNavigating ? "" : "transition-all duration-300"} ${isFlipped ? "scale-75 -translate-y-12 opacity-40" : "scale-100 translate-y-0 opacity-100"}`}>
          <div className="flex items-end gap-2 justify-center">
            {currentItem.hanzi.split("").map((char, i) => (
              <HoverCharacter
                key={`${currentItem.key}-front-${i}`}
                char={char}
                pinyin={extractPinyinForChar(currentItem.pinyin, i, currentItem.hanzi.length)}
                size="2xl"
                wordId={currentItem.id}
              />
            ))}
          </div>
          <div className="mt-4">
            <SpeakerButton text={currentItem.hanzi} size="md" />
          </div>
          {!isFlipped && (
            <p className="text-gray-600 text-sm mt-8">Tap to reveal · Hover characters for pinyin</p>
          )}
        </div>

        {/* Back overlay */}
        <div
          className={`absolute inset-0 pt-28 pb-6 px-6 w-full flex flex-col items-center overflow-y-auto bg-neutral-900/90 ${isNavigating ? "" : "transition-all duration-300"} ${
            isFlipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"
          }`}
        >
          <p className="text-red-400 text-4xl font-medium mb-1">{currentItem.pinyin}</p>
          <p className="text-white text-3xl font-bold mb-4 text-center">{currentItem.english}</p>

          {currentItem.examples.length > 0 && (
            <div className="space-y-3 mt-2 text-left w-full">
              {currentItem.examples.slice(0, 3).map((example, idx) => (
                <div key={`${currentItem.key}-ex-${idx}`} className="p-3 bg-black/40 rounded-xl border border-neutral-800 flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-end gap-0.5 mb-1.5">
                      {groupByTrailingPunctuation(example.pinyinWords).map((group, gi) => (
                        <span key={`${currentItem.key}-ex-${idx}-g${gi}`} className="inline-flex items-end gap-0.5">
                          {group.map((pw, i) => (
                            <HoverCharacter
                              key={`${currentItem.key}-ex-${idx}-${gi}-${i}`}
                              char={pw.char}
                              pinyin={pw.pinyin}
                              size={isMobile ? "lg" : "xl"}
                              charClassName={isMobile ? undefined : "text-[43px]"}
                              wordId={currentItem.id}
                            />
                          ))}
                        </span>
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

      {/* Action buttons */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={goPrev}
          className="px-5 py-4 bg-neutral-900 text-gray-400 rounded-xl font-semibold hover:bg-neutral-800 hover:text-white transition-all border border-neutral-800 hover:border-neutral-700"
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
          className="px-5 py-4 bg-neutral-900 text-gray-400 rounded-xl font-semibold hover:bg-neutral-800 hover:text-white transition-all border border-neutral-800 hover:border-neutral-700"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
