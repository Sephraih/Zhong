import { useState, useCallback, useEffect, useRef } from "react";
import { getCachedIsSandboxed } from "../utils/environment";
import type { VocabWord } from "../data/vocabulary";

const STORAGE_KEY = "hanyu-learned-words";

// Simple localStorage helpers with fallbacks
function loadFromStorage(): Set<number> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch {
    // Ignore storage errors
  }
  return new Set();
}

function saveToStorage(learned: Set<number>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(learned)));
  } catch {
    // Ignore storage errors
  }
}

export interface LearnedState {
  isLearned: (wordId: number) => boolean;
  toggleLearned: (wordId: number) => void;
  markAsLearned: (wordId: number) => void;
  markAsStillLearning: (wordId: number) => void;
  learnedCount: number;
}

export function useLearnedState(
  userId?: string,
  vocabulary: VocabWord[] = [],
  accessToken?: string | null
): LearnedState {
  // Initialize from localStorage synchronously
  const [learned, setLearned] = useState<Set<number>>(() => loadFromStorage());
  
  // Track if we should attempt cloud sync
  const cloudSyncAttempted = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync to localStorage whenever learned changes
  useEffect(() => {
    saveToStorage(learned);
  }, [learned]);

  // Cloud sync - only if not in sandbox and we have credentials
  useEffect(() => {
    // Skip cloud sync entirely in sandbox mode
    if (getCachedIsSandboxed()) {
      return;
    }

    // Skip if no user or already attempted
    if (!userId || !accessToken || cloudSyncAttempted.current) {
      return;
    }

    // Skip if no vocabulary yet
    if (vocabulary.length === 0) {
      return;
    }

    cloudSyncAttempted.current = true;

    // Delayed cloud sync - don't block initial render
    const timer = setTimeout(() => {
      loadFromCloud();
    }, 1000);

    return () => clearTimeout(timer);

    async function loadFromCloud() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const apiBase = import.meta.env?.VITE_API_BASE || "";
        const res = await fetch(`${apiBase}/api/learned-progress`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) return;

        const data = await res.json();
        if (data.learned_bits && typeof data.learned_bits === "object") {
          const cloudSet = decodeLearnedBits(data.learned_bits, vocabulary);
          if (cloudSet.size > 0) {
            setLearned(cloudSet);
            saveToStorage(cloudSet);
          }
        }
      } catch {
        // Cloud sync failed - continue with local state
      }
    }
  }, [userId, accessToken, vocabulary]);

  // Debounced cloud save
  const saveToCloud = useCallback(() => {
    if (getCachedIsSandboxed() || !userId || !accessToken || vocabulary.length === 0) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const bits = encodeLearnedBits(learned, vocabulary);
        const apiBase = import.meta.env?.VITE_API_BASE || "";
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        await fetch(`${apiBase}/api/learned-progress`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ learned_bits: bits }),
          signal: controller.signal,
        });

        clearTimeout(timeout);
      } catch {
        // Cloud save failed - local state is preserved
      }
    }, 2000);
  }, [userId, accessToken, vocabulary, learned]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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
    saveToCloud();
  }, [saveToCloud]);

  const markAsLearned = useCallback((wordId: number) => {
    setLearned((prev) => {
      if (prev.has(wordId)) return prev;
      const next = new Set(prev);
      next.add(wordId);
      return next;
    });
    saveToCloud();
  }, [saveToCloud]);

  const markAsStillLearning = useCallback((wordId: number) => {
    setLearned((prev) => {
      if (!prev.has(wordId)) return prev;
      const next = new Set(prev);
      next.delete(wordId);
      return next;
    });
    saveToCloud();
  }, [saveToCloud]);

  return {
    isLearned,
    toggleLearned,
    markAsLearned,
    markAsStillLearning,
    learnedCount: learned.size,
  };
}

// Helper functions for encoding/decoding learned bits

function encodeLearnedBits(learned: Set<number>, vocabulary: VocabWord[]): Record<string, string> {
  const result: Record<string, string> = {};
  
  // Group words by HSK level
  const byLevel: Record<number, number[]> = {};
  for (const word of vocabulary) {
    if (!byLevel[word.hskLevel]) {
      byLevel[word.hskLevel] = [];
    }
    byLevel[word.hskLevel].push(word.id);
  }

  // Sort each level's word IDs
  for (const level of Object.keys(byLevel)) {
    byLevel[Number(level)].sort((a, b) => a - b);
  }

  // Encode each level as a bitset
  for (const [level, wordIds] of Object.entries(byLevel)) {
    const numBytes = Math.ceil(wordIds.length / 8);
    const bytes = new Uint8Array(numBytes);
    
    for (let i = 0; i < wordIds.length; i++) {
      if (learned.has(wordIds[i])) {
        const byteIndex = Math.floor(i / 8);
        const bitIndex = i % 8;
        bytes[byteIndex] |= (1 << bitIndex);
      }
    }
    
    result[level] = bytesToBase64(bytes);
  }

  return result;
}

function decodeLearnedBits(bits: Record<string, string>, vocabulary: VocabWord[]): Set<number> {
  const result = new Set<number>();

  // Group words by HSK level
  const byLevel: Record<number, number[]> = {};
  for (const word of vocabulary) {
    if (!byLevel[word.hskLevel]) {
      byLevel[word.hskLevel] = [];
    }
    byLevel[word.hskLevel].push(word.id);
  }

  // Sort each level's word IDs
  for (const level of Object.keys(byLevel)) {
    byLevel[Number(level)].sort((a, b) => a - b);
  }

  // Decode each level
  for (const [level, base64] of Object.entries(bits)) {
    const wordIds = byLevel[Number(level)];
    if (!wordIds || typeof base64 !== "string") continue;

    try {
      const bytes = base64ToBytes(base64);
      
      for (let i = 0; i < wordIds.length; i++) {
        const byteIndex = Math.floor(i / 8);
        const bitIndex = i % 8;
        
        if (byteIndex < bytes.length && (bytes[byteIndex] & (1 << bitIndex))) {
          result.add(wordIds[i]);
        }
      }
    } catch {
      // Skip invalid base64
    }
  }

  return result;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
