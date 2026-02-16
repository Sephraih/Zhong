import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "hanyu-learned-words";

function loadLearnedWords(): Set<number> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch {
    // ignore
  }
  return new Set();
}

function saveLearnedWords(learned: Set<number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(learned)));
  } catch {
    // ignore
  }
}

export interface LearnedState {
  isLearned: (wordId: number) => boolean;
  toggleLearned: (wordId: number) => void;
  markAsLearned: (wordId: number) => void;
  markAsStillLearning: (wordId: number) => void;
  learnedCount: number;
}

export function useLearnedState(): LearnedState {
  const [learned, setLearned] = useState<Set<number>>(loadLearnedWords);

  useEffect(() => {
    saveLearnedWords(learned);
  }, [learned]);

  const isLearned = useCallback(
    (wordId: number) => learned.has(wordId),
    [learned]
  );

  const toggleLearned = useCallback((wordId: number) => {
    setLearned((prev) => {
      const next = new Set(prev);
      if (next.has(wordId)) {
        next.delete(wordId);
      } else {
        next.add(wordId);
      }
      return next;
    });
  }, []);

  const markAsLearned = useCallback((wordId: number) => {
    setLearned((prev) => {
      if (prev.has(wordId)) return prev;
      const next = new Set(prev);
      next.add(wordId);
      return next;
    });
  }, []);

  const markAsStillLearning = useCallback((wordId: number) => {
    setLearned((prev) => {
      if (!prev.has(wordId)) return prev;
      const next = new Set(prev);
      next.delete(wordId);
      return next;
    });
  }, []);

  return {
    isLearned,
    toggleLearned,
    markAsLearned,
    markAsStillLearning,
    learnedCount: learned.size,
  };
}
