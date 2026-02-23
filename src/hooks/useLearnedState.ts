import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { VocabWord } from "../data/vocabulary";
import { supabase } from "../supabaseClient";

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

// ─── Bitset helpers (base64) ─────────────────────────────────────────────────

function bytesToBase64(bytes: Uint8Array): string {
  // Chunked conversion to avoid call stack limits
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function encodeBitset(orderedIds: number[], learnedSet: Set<number>): string {
  const bitCount = orderedIds.length;
  const byteCount = Math.ceil(bitCount / 8);
  const bytes = new Uint8Array(byteCount);

  orderedIds.forEach((id, idx) => {
    if (!learnedSet.has(id)) return;
    const byteIndex = Math.floor(idx / 8);
    const bitIndex = idx % 8;
    bytes[byteIndex] |= 1 << bitIndex;
  });

  return bytesToBase64(bytes);
}

function decodeBitset(orderedIds: number[], b64: string): Set<number> {
  const out = new Set<number>();
  if (!b64) return out;

  let bytes: Uint8Array;
  try {
    bytes = base64ToBytes(b64);
  } catch {
    return out;
  }

  for (let idx = 0; idx < orderedIds.length; idx++) {
    const byteIndex = Math.floor(idx / 8);
    const bitIndex = idx % 8;
    if (byteIndex >= bytes.length) break;
    if ((bytes[byteIndex] & (1 << bitIndex)) !== 0) out.add(orderedIds[idx]);
  }

  return out;
}

function buildLevelIndex(words: VocabWord[] | undefined) {
  const map = new Map<number, number[]>();
  if (!words?.length) return map;

  for (const w of words) {
    const lvl = w.hskLevel;
    if (!map.has(lvl)) map.set(lvl, []);
    map.get(lvl)!.push(w.id);
  }

  for (const [lvl, ids] of map.entries()) {
    ids.sort((a, b) => a - b);
    map.set(lvl, ids);
  }
  return map;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Cloud-synced learned state.
 *
 * - Always keeps localStorage as fast cache/offline mode.
 * - If userId + Supabase available: syncs to public.user_learned_words.
 *
 * Compact format:
 * - user_learned_words.learned_bits is a JSON object { "1": "base64...", "2": "base64..." }
 * - Bit positions are derived from the sorted word_id list per HSK level.
 *
 * We also keep writing learned_ids for backward compatibility and easier debugging.
 */
export function useLearnedState(userId?: string, words?: VocabWord[]): LearnedState {
  const [learned, setLearned] = useState<Set<number>>(loadLearnedWords);

  const levelIndex = useMemo(() => buildLevelIndex(words), [words]);

  // Persist locally for instant startup/offline
  useEffect(() => {
    saveLearnedWords(learned);
  }, [learned]);

  // Load from Supabase on login and merge with local
  useEffect(() => {
    let cancelled = false;

    async function loadFromCloud() {
      if (!userId) return;
      if (!supabase) return;

      const { data, error } = await supabase
        .from("user_learned_words")
        .select("learned_bits")
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.warn("[useLearnedState] failed to load cloud learned state:", error.message);
        return;
      }

      const merged = new Set<number>(learned);

      // Compact bits only (no learned_ids fallback)
      const bits = (data as any)?.learned_bits as Record<string, string> | null | undefined;
      if (bits && typeof bits === "object" && levelIndex.size > 0) {
        for (const [lvlStr, b64] of Object.entries(bits)) {
          const lvl = Number(lvlStr);
          const ordered = levelIndex.get(lvl);
          if (!ordered?.length) continue;
          const decoded = decodeBitset(ordered, b64);
          decoded.forEach((id) => merged.add(id));
        }
      }

      setLearned(merged);
    }

    loadFromCloud();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, levelIndex]);

  // Debounced cloud save
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!userId) return;
    if (!supabase) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);

    const sb = supabase;
    saveTimer.current = setTimeout(async () => {
      // Build compact learned_bits per level (only for levels present in the current dataset)
      const learnedBits: Record<string, string> = {};
      if (levelIndex.size > 0) {
        for (const [lvl, ordered] of levelIndex.entries()) {
          learnedBits[String(lvl)] = encodeBitset(ordered, learned);
        }
      }

      try {
        const { error } = await sb
          .from("user_learned_words")
          .upsert(
            {
              user_id: userId,
              learned_bits: learnedBits,
            },
            { onConflict: "user_id" }
          );

        if (error) {
          console.warn("[useLearnedState] failed to save cloud learned state:", error.message);
        }
      } catch (e) {
        console.warn("[useLearnedState] failed to save cloud learned state:", e);
      }
    }, 2000);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [learned, userId, levelIndex]);

  const isLearned = useCallback((wordId: number) => learned.has(wordId), [learned]);

  const toggleLearned = useCallback((wordId: number) => {
    setLearned((prev) => {
      const next = new Set(prev);
      if (next.has(wordId)) next.delete(wordId);
      else next.add(wordId);
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
