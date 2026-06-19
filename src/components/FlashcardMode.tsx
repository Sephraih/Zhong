import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { HoverCharacter, isHoverCharacterEvent } from "./HoverCharacter";
import { SpeakerButton } from "./SpeakerButton";
import { getHskBadgeClasses } from "../utils/hskColors";
import type { VocabWord } from "../data/vocabulary";
import type { LearnedState } from "../hooks/useLearnedState";
import { extractPinyinForChar, groupByTrailingPunctuation } from "../utils/pinyinUtils";
import { useIsMobile } from "../hooks/useIsMobile";
import { useCardStore, type CustomCard } from "../hooks/useCardStore";
import { useTtsVoiceCheck } from "../hooks/useTtsVoiceCheck";
import { TtsVoiceWarning } from "./TtsVoiceWarning";
import { useAuth } from "../contexts/AuthContext";
import { useHskLevelSelection } from "../hooks/useHskLevelSelection";
import { HskLevelButtons } from "./HskLevelButtons";
import { usePersistedState } from "../hooks/usePersistedState";
import { readJSON, writeJSON, removeJSON } from "../utils/localStorageJson";

export type FlashcardFilter = "all" | "still-learning" | "learned";
type FlashcardDirection = "zh-en" | "en-zh";

interface FlashcardModeProps {
  allWords: VocabWord[];
  learnedState: LearnedState;
  /** Levels the current user can access (from App.tsx's hasAccessToLevel) */
  accessibleLevels: number[];
  lockReasonForLevel: (level: number) => string | null;
  /** True while the real access tier is still resolving (see App.tsx's accessInfo.isResolving) */
  isResolving?: boolean;
  onLockedLevelClick?: () => void;
  onNavigateToSupport?: () => void;
  onOpenAuth?: () => void;
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

interface FlashcardItemRef {
  key: string;
  source: "hsk" | "custom";
  id: number;
}

interface StoredFlashcardSession {
  refs: FlashcardItemRef[];
  activeDeckIds: number[];
  currentIndex: number;
  isShuffled: boolean;
  shuffledKeys: string[];
}

const STORAGE_KEY = "hanyu-flashcard-session";
const SHOWN_LEVELS = [1, 2, 3, 4, 5, 6];

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

function customCardToItem(card: CustomCard): FlashcardItem {
  return {
    key: `custom_${card.id}`,
    source: "custom",
    id: card.id,
    hanzi: card.hanzi,
    pinyin: card.pinyin,
    english: card.english,
    hskLevel: 0,
    category: "Custom",
    examples: card.examples,
  };
}

const ADD_COUNTS = [5, 10, 20, 50] as const;

export function FlashcardMode({ allWords, learnedState, accessibleLevels, lockReasonForLevel, isResolving, onLockedLevelClick, onNavigateToSupport, onOpenAuth }: FlashcardModeProps) {
  const isMobile = useIsMobile();
  const store = useCardStore();
  const noChineseVoice = useTtsVoiceCheck();
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const { toggleLearned, isLearned } = learnedState;

  // Session items — the unified pool of cards in play
  const [sessionItems, setSessionItems] = useState<FlashcardItem[]>([]);
  const [activeDeckIds, setActiveDeckIds] = useState<Set<number>>(new Set());
  const [setupOpen, setSetupOpen] = useState(true);

  // Word-status filter — governs which cards get ADDED to the session (from both the HSK
  // catalogue and toggled decks below), never what's displayed once a card is in the session.
  const [wordStatusFilter, setWordStatusFilter] = usePersistedState<FlashcardFilter>("hanyu-word-status-flashcards", "all");

  const [direction, setDirection] = usePersistedState<FlashcardDirection>("hanyu-direction-flashcards", "zh-en");
  const isChinese = direction === "zh-en";
  const toggleDirection = () => {
    setDirection(isChinese ? "en-zh" : "zh-en");
    setIsFlipped(false);
  };

  // HSK level selection — only controls which pool addHskCards draws new cards from below;
  // never a live filter over sessionItems (there's no "no cards in session" state this can
  // cause — that's gated on sessionItems itself, see the empty states near the bottom).
  const hskLevelSelection = useHskLevelSelection({
    storageKey: "flashcards",
    accessibleLevels,
    isResolving,
  });
  const hskFilterLevels = hskLevelSelection.selectedLevels;

  // Card navigation state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  // Stable pre-computed key order so toggling Learned doesn't re-randomise
  const [shuffledKeys, setShuffledKeys] = useState<string[]>([]);

  const isItemLearned = useCallback(
    (item: FlashcardItem) =>
      item.source === "hsk" ? isLearned(item.id) : (store.cards.find((c) => c.id === item.id)?.learned ?? false),
    [isLearned, store.cards]
  );

  const matchesStatusFilter = useCallback(
    (learned: boolean) => {
      if (wordStatusFilter === "still-learning") return !learned;
      if (wordStatusFilter === "learned") return learned;
      return true;
    },
    [wordStatusFilter]
  );

  // ── Session persistence (thin refs, re-resolved against allWords/store.cards on restore) ──

  const removeStoredSession = () => removeJSON(STORAGE_KEY);

  const saveSession = (
    items: FlashcardItem[],
    deckIds: Set<number>,
    index: number,
    shuffled: boolean,
    shuffleOrder: string[]
  ) => {
    writeJSON<StoredFlashcardSession>(STORAGE_KEY, {
      refs: items.map((item) => ({ key: item.key, source: item.source, id: item.id })),
      activeDeckIds: Array.from(deckIds),
      currentIndex: index,
      isShuffled: shuffled,
      shuffledKeys: shuffleOrder,
    });
  };

  const resolveItemRef = (ref: FlashcardItemRef): FlashcardItem | null => {
    if (ref.source === "hsk") {
      const word = allWords.find((w) => w.id === ref.id);
      return word ? hskWordToItem(word) : null;
    }
    const card = store.cards.find((c) => c.id === ref.id);
    return card ? customCardToItem(card) : null;
  };

  const hasRestoredRef = useRef(false);
  useEffect(() => {
    if (hasRestoredRef.current) return;
    if (isResolving) return;
    if (allWords.length === 0) return;
    hasRestoredRef.current = true;

    const stored = readJSON<StoredFlashcardSession>(STORAGE_KEY);
    if (!stored || !Array.isArray(stored.refs)) return;
    const resolvedItems = stored.refs.map(resolveItemRef).filter((item): item is FlashcardItem => Boolean(item));
    if (resolvedItems.length === 0) return;

    setSessionItems(resolvedItems);
    setActiveDeckIds(new Set(stored.activeDeckIds ?? []));
    setIsShuffled(Boolean(stored.isShuffled));
    setShuffledKeys(stored.shuffledKeys ?? []);
    setCurrentIndex(Math.max(0, Math.min(stored.currentIndex ?? 0, resolvedItems.length - 1)));
    setSetupOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allWords, isResolving]);

  useEffect(() => {
    if (sessionItems.length === 0) {
      // Only clear a session that was actually restored — on mount, sessionItems starts at []
      // for one render before the restore effect above populates it; wiping storage here would
      // race ahead of that restore and erase the very session it just read.
      if (hasRestoredRef.current) removeStoredSession();
      return;
    }
    saveSession(sessionItems, activeDeckIds, currentIndex, isShuffled, shuffledKeys);
  }, [sessionItems, activeDeckIds, currentIndex, isShuffled, shuffledKeys]);

  // Add N random HSK cards from the current level filter pool
  const addHskCards = (count: number | "all") => {
    const pool = allWords.filter((w) => hskFilterLevels.includes(w.hskLevel) && matchesStatusFilter(isLearned(w.id)));
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
      // Add cards from this deck (dedup), subject to the word-status filter
      const deckEntries = store.getCardsForDeck(deckId);
      const existingKeys = new Set(sessionItems.map((i) => i.key));
      const toAdd: FlashcardItem[] = [];
      for (const dc of deckEntries) {
        const key = `${dc.cardType}_${dc.cardId}`;
        if (existingKeys.has(key)) continue;
        if (dc.cardType === "custom") {
          const card = store.cards.find((c) => c.id === dc.cardId);
          if (card && matchesStatusFilter(card.learned ?? false)) toAdd.push(customCardToItem(card));
        } else {
          const word = allWords.find((w) => w.id === dc.cardId);
          if (word && matchesStatusFilter(isLearned(word.id))) toAdd.push(hskWordToItem(word));
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
    removeStoredSession();
  };

  const displayItems = useMemo(() => {
    if (isShuffled && shuffledKeys.length > 0) {
      const keyOrder = new Map(shuffledKeys.map((key, i) => [key, i]));
      return [...sessionItems].sort((a, b) => {
        const ai = keyOrder.get(a.key) ?? Infinity;
        const bi = keyOrder.get(b.key) ?? Infinity;
        return ai - bi;
      });
    }
    return sessionItems;
  }, [sessionItems, isShuffled, shuffledKeys]);

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
    const arr = [...sessionItems].sort(() => Math.random() - 0.5);
    setShuffledKeys(arr.map((item) => item.key));
    setIsShuffled(true);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleReset = () => {
    setIsShuffled(false);
    setShuffledKeys([]);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleRemoveFromSession = useCallback(() => {
    if (!currentItem) return;
    const keyToRemove = currentItem.key;
    const newLength = displayItems.length - 1;
    setSessionItems((prev) => prev.filter((item) => item.key !== keyToRemove));
    setCurrentIndex((prev) => (newLength > 0 ? Math.min(prev, newLength - 1) : 0));
    setIsFlipped(false);
  }, [currentItem, displayItems.length]);

  const currentIsLearned = currentItem ? isItemLearned(currentItem) : false;

  const progress = displayItems.length > 0 ? ((currentIndex + 1) / displayItems.length) * 100 : 0;
  const sessionLearnedCount = sessionItems.filter(isItemLearned).length;
  const sessionNotLearnedCount = sessionItems.length - sessionLearnedCount;

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
          {/* Word-status filter — governs which cards get added below, not what's displayed */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Add cards as</p>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "all", label: "All Words" },
                { value: "still-learning", label: "📖 Still Learning" },
                { value: "learned", label: "✅ Learned" },
              ] as { value: FlashcardFilter; label: string }[]).map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setWordStatusFilter(filter.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    wordStatusFilter === filter.value
                      ? "bg-red-600 border-red-500 text-white"
                      : "bg-neutral-800 border-neutral-700 text-gray-400 hover:border-neutral-600 hover:text-white"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Decks section */}
          {!isLoggedIn ? (
            <button
              onClick={onOpenAuth}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-neutral-800/50 border border-neutral-700/60 hover:border-neutral-600 hover:bg-neutral-800 transition-colors text-left"
            >
              <span className="text-lg">🎴</span>
              <span className="text-gray-400 text-sm">Sign in to use your own cards & decks</span>
              <svg className="w-4 h-4 text-gray-600 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : store.decks.length > 0 && (
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
            <HskLevelButtons
              shownLevels={SHOWN_LEVELS}
              accessibleLevels={accessibleLevels}
              selectedLevels={hskFilterLevels}
              onToggleLevel={hskLevelSelection.toggleLevel}
              onToggleAll={hskLevelSelection.toggleAll}
              lockReasonForLevel={lockReasonForLevel}
              isResolving={isResolving}
              onLockedClick={onLockedLevelClick}
              className="!justify-start mb-3"
            />
            <div className="flex flex-wrap gap-2">
              {ADD_COUNTS.map((n) => (
                <button
                  key={n}
                  onClick={() => addHskCards(n)}
                  disabled={hskFilterLevels.length === 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-gray-300 border border-neutral-700 transition-colors"
                >
                  +{n} cards
                </button>
              ))}
              <button
                onClick={() => addHskCards("all")}
                disabled={hskFilterLevels.length === 0}
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

      {/* Direction toggle */}
      <div className="mb-4 flex justify-center">
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

      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white font-semibold">{sessionItems.length}</span>
          <span className="text-gray-600">:</span>
          <span className="text-emerald-400 font-semibold">✅ {sessionLearnedCount}</span>
          <span className="text-red-400 font-semibold">📖 {sessionNotLearnedCount}</span>
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
          {isChinese ? (
            <>
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
            </>
          ) : (
            <>
              <p className="text-4xl font-bold text-white text-center px-6">{currentItem.english}</p>
              <p className="text-gray-500 text-sm mt-2">(English → Chinese)</p>
            </>
          )}
          {!isFlipped && (
            <p className="text-gray-600 text-sm mt-8">{isChinese ? "Tap to reveal · Hover characters for pinyin" : "Tap to reveal Chinese"}</p>
          )}
        </div>

        {/* Back overlay */}
        <div
          className={`absolute inset-0 pt-28 pb-6 px-6 w-full flex flex-col items-center overflow-y-auto bg-neutral-900/90 ${isNavigating ? "" : "transition-all duration-300"} ${
            isFlipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"
          }`}
        >
          {isChinese ? (
            <>
              <p className="text-red-400 text-4xl font-medium mb-1">{currentItem.pinyin}</p>
              <p className="text-white text-3xl font-bold mb-4 text-center">{currentItem.english}</p>
            </>
          ) : (
            <>
              <div className="flex items-end gap-2 justify-center mb-2">
                {currentItem.hanzi.split("").map((char, i) => (
                  <HoverCharacter
                    key={`${currentItem.key}-back-${i}`}
                    char={char}
                    pinyin={extractPinyinForChar(currentItem.pinyin, i, currentItem.hanzi.length)}
                    size="2xl"
                    wordId={currentItem.id}
                  />
                ))}
              </div>
              <p className="text-red-400 text-4xl font-medium mb-2">{currentItem.pinyin}</p>
              <SpeakerButton text={currentItem.hanzi} size="md" />
            </>
          )}

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

        <div className="flex-1 flex flex-col gap-2">
          <button
            onClick={handleToggleLearned}
            className={`w-full py-3 rounded-xl font-semibold transition-all border flex items-center justify-center gap-2 ${
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
            onClick={handleRemoveFromSession}
            className="w-full py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-red-400 border border-neutral-800 hover:border-red-900/50 transition-all"
          >
            Remove from session
          </button>
        </div>

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
