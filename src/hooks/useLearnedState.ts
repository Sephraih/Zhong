import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { VocabWord } from "../data/vocabulary";
import { getSupabaseAuthedClient } from "../supabaseClient";

const STORAGE_KEY = "hanyu-learned-words";

function loadLearnedWords(): Set<number> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return new Set(parsed);
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

  for (let idx = 0; idx < orderedIds.length; idx++) {
    const id = orderedIds[idx];
    if (!learnedSet.has(id)) continue;
    const byteIndex = Math.floor(idx / 8);
    const bitIndex = idx % 8;
    bytes[byteIndex] |= 1 << bitIndex;
  }

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
    const arr = map.get(lvl) ?? [];
    arr.push(w.id);
    map.set(lvl, arr);
  }

  for (const [lvl, ids] of map.entries()) {
    ids.sort((a, b) => a - b);
    map.set(lvl, ids);
  }
  return map;
}

function levelIndexSignature(levelIndex: Map<number, number[]>): string {
  if (levelIndex.size === 0) return "empty";
  const parts: string[] = [];
  for (const [lvl, ids] of Array.from(levelIndex.entries()).sort((a, b) => a[0] - b[0])) {
    const first = ids[0] ?? 0;
    const last = ids[ids.length - 1] ?? 0;
    parts.push(`${lvl}:${ids.length}:${first}:${last}`);
  }
  return parts.join("|");
}

function getAccessToken(): string | null {
  try {
    return localStorage.getItem("hanyu_auth_token");
  } catch {
    return null;
  }
}

/**
 * Cloud-synced learned state.
 *
 * - Always uses localStorage for instant startup/offline.
 * - If userId + JWT available: loads/saves to `public.user_learned_words.learned_bits`.
 *
 * IMPORTANT:
 * We authenticate Supabase writes by constructing a client that includes the JWT in
 * the Authorization header (because this app does auth via /api routes, not via
 * supabase-js auth sessions).
 */
export function useLearnedState(userId?: string, words?: VocabWord[]): LearnedState {
  const [learned, setLearned] = useState<Set<number>>(loadLearnedWords);

  // Always keep a ref to the latest set (avoid stale closures in debounce)
  const learnedRef = useRef(learned);
  useEffect(() => {
    learnedRef.current = learned;
  }, [learned]);

  const levelIndex = useMemo(() => buildLevelIndex(words), [words]);
  const levelSig = useMemo(() => levelIndexSignature(levelIndex), [levelIndex]);

  // Persist locally for instant startup/offline
  useEffect(() => {
    saveLearnedWords(learned);
  }, [learned]);

  const cloudReadyRef = useRef(false);
  const dirtyBeforeReadyRef = useRef(false);
  const lastCloudLoadRef = useRef<{ userId: string; sig: string } | null>(null);

  // Load from Supabase on login and merge with local
  useEffect(() => {
    let cancelled = false;

    // Reset readiness when user changes
    cloudReadyRef.current = false;
    dirtyBeforeReadyRef.current = false;

    const token = getAccessToken();
    const sb = getSupabaseAuthedClient(token);

    async function loadFromCloud() {
      if (!userId) return;
      if (!sb) return;
      if (levelIndex.size === 0) return;

      const last = lastCloudLoadRef.current;
      if (last && last.userId === userId && last.sig === levelSig) {
        cloudReadyRef.current = true;
        return;
      }

      lastCloudLoadRef.current = { userId, sig: levelSig };

      const { data, error } = await sb
        .from("user_learned_words")
        .select("learned_bits")
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;

      cloudReadyRef.current = true;

      if (error) {
        console.warn("[useLearnedState] cloud load error:", error.message);
        return;
      }

      const merged = new Set<number>(learnedRef.current);
      const bits = (data as any)?.learned_bits as Record<string, string> | null | undefined;

      if (bits && typeof bits === "object") {
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

    loadFromCloud().finally(() => {
      // if user interacted before cloud load finished, we should save once ready
      if (!cancelled && cloudReadyRef.current && dirtyBeforeReadyRef.current) {
        // trigger a save by updating state to itself (will run save effect)
        setLearned((prev) => new Set(prev));
        dirtyBeforeReadyRef.current = false;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userId, levelIndex, levelSig]);

  // Debounced cloud save
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    const sb = getSupabaseAuthedClient(token);

    if (!userId || !sb || levelIndex.size === 0) return;

    // Don't save until we've attempted the initial cloud load.
    if (!cloudReadyRef.current) {
      dirtyBeforeReadyRef.current = true;
      return;
    }

    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(async () => {
      const learnedBits: Record<string, string> = {};
      const setToEncode = learnedRef.current;

      for (const [lvl, ordered] of levelIndex.entries()) {
        learnedBits[String(lvl)] = encodeBitset(ordered, setToEncode);
      }

      const { error } = await sb
        .from("user_learned_words")
        .upsert({ user_id: userId, learned_bits: learnedBits }, { onConflict: "user_id" });

      if (error) {
        console.warn("[useLearnedState] cloud save error:", error.message);
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
