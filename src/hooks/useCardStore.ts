import { useState, useEffect, useCallback } from "react";
import { storageGetItem, storageSetItem } from "../utils/storageConsent";

export interface CustomCard {
  id: number;
  hanzi: string;
  pinyin: string;
  english: string;
  learned: boolean;
  examples: {
    chinese: string;
    pinyinWords: { char: string; pinyin: string }[];
    english: string;
  }[];
  createdAt: number;
}

export interface Deck {
  id: number;
  title: string;
  description: string;
  createdAt: number;
}

export interface DeckCard {
  deckId: number;
  cardId: number;
  cardType: "custom" | "hsk";
  hanzi: string;
  pinyin: string;
  addedAt: number;
}

interface StoredDecksData {
  decks: Deck[];
  deckCards: DeckCard[];
}

const CARDS_KEY = "hamhao_custom_cards";
const DECKS_KEY = "hamhao_decks";

/**
 * Directly writes a deck word entry to localStorage without React state.
 * Use this when the useCardStore hook is NOT mounted (e.g., App.tsx-level callbacks
 * that fire while CardsDecksMode is unmounted), to avoid stale-state overwrites.
 */
export function addWordToDeckDirect(
  deckId: number,
  cardId: number,
  cardType: "custom" | "hsk",
  hanzi: string,
  pinyin: string
): boolean {
  try {
    const raw = storageGetItem(DECKS_KEY);
    const data: StoredDecksData = raw ? (JSON.parse(raw) as StoredDecksData) : { decks: [], deckCards: [] };
    const exists = data.deckCards.some(
      (dc) => dc.deckId === deckId && dc.cardId === cardId && dc.cardType === cardType
    );
    if (exists) return false;
    data.deckCards.push({ deckId, cardId, cardType, hanzi, pinyin, addedAt: Date.now() });
    storageSetItem(DECKS_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export interface DeckSummary {
  id: number;
  title: string;
  description: string;
  cardCount: number;
}

export function getHskWordIdsForDeck(deckId: number): Set<number> {
  try {
    const raw = storageGetItem(DECKS_KEY);
    if (!raw) return new Set();
    const data = JSON.parse(raw) as StoredDecksData;
    const ids = (data.deckCards ?? [])
      .filter((dc) => dc.deckId === deckId && dc.cardType === "hsk")
      .map((dc) => dc.cardId);
    return new Set(ids);
  } catch {
    return new Set();
  }
}

export function getDecksFromStorage(): DeckSummary[] {
  try {
    const raw = storageGetItem(DECKS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as StoredDecksData;
    return (data.decks ?? []).map((deck) => ({
      ...deck,
      cardCount: (data.deckCards ?? []).filter((dc) => dc.deckId === deck.id).length,
    }));
  } catch {
    return [];
  }
}

function loadCards(): CustomCard[] {
  try {
    const raw = storageGetItem(CARDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CustomCard[];
  } catch {
    return [];
  }
}

function loadDecksData(): StoredDecksData {
  try {
    const raw = storageGetItem(DECKS_KEY);
    if (!raw) return { decks: [], deckCards: [] };
    return JSON.parse(raw) as StoredDecksData;
  } catch {
    return { decks: [], deckCards: [] };
  }
}

export function useCardStore() {
  const [cards, setCards] = useState<CustomCard[]>(() => loadCards());
  const [decksData, setDecksData] = useState<StoredDecksData>(() => loadDecksData());

  // Persist cards on every change
  useEffect(() => {
    storageSetItem(CARDS_KEY, JSON.stringify(cards));
  }, [cards]);

  // Persist decks + deckCards on every change
  useEffect(() => {
    storageSetItem(DECKS_KEY, JSON.stringify(decksData));
  }, [decksData]);

  // ── Cards ──────────────────────────────────────────────────────────────────

  const addCard = useCallback(
    (draft: Omit<CustomCard, "id" | "createdAt">): CustomCard => {
      const card: CustomCard = { ...draft, id: Date.now(), createdAt: Date.now() };
      setCards((prev) => [card, ...prev]);
      return card;
    },
    []
  );

  const updateCard = useCallback((id: number, patch: Partial<CustomCard>) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const deleteCard = useCallback((id: number) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    // Remove from all decks too
    setDecksData((prev) => ({
      ...prev,
      deckCards: prev.deckCards.filter(
        (dc) => !(dc.cardId === id && dc.cardType === "custom")
      ),
    }));
  }, []);

  const toggleCardLearned = useCallback((id: number) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, learned: !c.learned } : c))
    );
  }, []);

  // ── Decks ──────────────────────────────────────────────────────────────────

  const addDeck = useCallback((title: string, description: string): Deck => {
    const deck: Deck = { id: Date.now(), title, description, createdAt: Date.now() };
    setDecksData((prev) => ({ ...prev, decks: [...prev.decks, deck] }));
    return deck;
  }, []);

  const updateDeck = useCallback((id: number, patch: Partial<Deck>) => {
    setDecksData((prev) => ({
      ...prev,
      decks: prev.decks.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }));
  }, []);

  const deleteDeck = useCallback((id: number) => {
    setDecksData((prev) => ({
      decks: prev.decks.filter((d) => d.id !== id),
      deckCards: prev.deckCards.filter((dc) => dc.deckId !== id),
    }));
  }, []);

  // ── Deck membership ────────────────────────────────────────────────────────

  const addWordToDeck = useCallback(
    (
      deckId: number,
      cardId: number,
      cardType: "custom" | "hsk",
      hanzi: string,
      pinyin: string
    ) => {
      setDecksData((prev) => {
        const exists = prev.deckCards.some(
          (dc) => dc.deckId === deckId && dc.cardId === cardId && dc.cardType === cardType
        );
        if (exists) return prev;
        const entry: DeckCard = { deckId, cardId, cardType, hanzi, pinyin, addedAt: Date.now() };
        return { ...prev, deckCards: [...prev.deckCards, entry] };
      });
    },
    []
  );

  const removeWordFromDeck = useCallback(
    (deckId: number, cardId: number, cardType: "custom" | "hsk") => {
      setDecksData((prev) => ({
        ...prev,
        deckCards: prev.deckCards.filter(
          (dc) => !(dc.deckId === deckId && dc.cardId === cardId && dc.cardType === cardType)
        ),
      }));
    },
    []
  );

  const getCardsForDeck = useCallback(
    (deckId: number): DeckCard[] => {
      return decksData.deckCards.filter((dc) => dc.deckId === deckId);
    },
    [decksData.deckCards]
  );

  const getDeckCardCount = useCallback(
    (deckId: number): number => {
      return decksData.deckCards.filter((dc) => dc.deckId === deckId).length;
    },
    [decksData.deckCards]
  );

  // ── Export / Import ────────────────────────────────────────────────────────

  const exportData = useCallback(() => {
    const payload = {
      version: 1,
      exportedAt: Date.now(),
      cards,
      decks: decksData.decks,
      deckCards: decksData.deckCards,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hamhao-cards-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [cards, decksData]);

  const importData = useCallback((json: string, mode: "merge" | "replace") => {
    const parsed = JSON.parse(json) as {
      version?: number;
      cards?: CustomCard[];
      decks?: Deck[];
      deckCards?: DeckCard[];
    };
    const importedCards: CustomCard[] = Array.isArray(parsed.cards) ? parsed.cards : [];
    const importedDecks: Deck[] = Array.isArray(parsed.decks) ? parsed.decks : [];
    const importedDeckCards: DeckCard[] = Array.isArray(parsed.deckCards) ? parsed.deckCards : [];

    if (mode === "replace") {
      setCards(importedCards);
      setDecksData({ decks: importedDecks, deckCards: importedDeckCards });
    } else {
      // Merge: skip items with duplicate ids
      setCards((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const newCards = importedCards.filter((c) => !existingIds.has(c.id));
        return [...prev, ...newCards];
      });
      setDecksData((prev) => {
        const existingDeckIds = new Set(prev.decks.map((d) => d.id));
        const newDecks = importedDecks.filter((d) => !existingDeckIds.has(d.id));
        const existingDcKeys = new Set(
          prev.deckCards.map((dc) => `${dc.deckId}_${dc.cardId}_${dc.cardType}`)
        );
        const newDeckCards = importedDeckCards.filter(
          (dc) => !existingDcKeys.has(`${dc.deckId}_${dc.cardId}_${dc.cardType}`)
        );
        return {
          decks: [...prev.decks, ...newDecks],
          deckCards: [...prev.deckCards, ...newDeckCards],
        };
      });
    }
  }, []);

  return {
    cards,
    addCard,
    updateCard,
    deleteCard,
    toggleCardLearned,
    decks: decksData.decks,
    addDeck,
    updateDeck,
    deleteDeck,
    deckCards: decksData.deckCards,
    addWordToDeck,
    removeWordFromDeck,
    getCardsForDeck,
    getDeckCardCount,
    exportData,
    importData,
  };
}
