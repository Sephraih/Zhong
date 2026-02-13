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

export function useLearnedState() {
  const [learnedWords, setLearnedWords] = useState<Set<number>>(() => loadLearnedWords());

  useEffect(() => {
    saveLearnedWords(learnedWords);
  }, [learnedWords]);

  const markAsLearned = useCallback((wordId: number) => {
    setLearnedWords((prev) => {
      const next = new Set(prev);
      next.add(wordId);
      return next;
    });
  }, []);

  const markAsStillLearning = useCallback((wordId: number) => {
    setLearnedWords((prev) => {
      const next = new Set(prev);
      next.delete(wordId);
      return next;
    });
  }, []);

  const toggleLearned = useCallback((wordId: number) => {
    setLearnedWords((prev) => {
      const next = new Set(prev);
      if (next.has(wordId)) {
        next.delete(wordId);
      } else {
        next.add(wordId);
      }
      return next;
    });
  }, []);

  const isLearned = useCallback(
    (wordId: number) => learnedWords.has(wordId),
    [learnedWords]
  );

  return {
    learnedWords,
    learnedCount: learnedWords.size,
    markAsLearned,
    markAsStillLearning,
    toggleLearned,
    isLearned,
  };
}

export type LearnedState = ReturnType<typeof useLearnedState>;
