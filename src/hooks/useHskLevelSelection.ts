import { useEffect, useMemo, useState } from "react";

interface UseHskLevelSelectionOptions {
  /** Unique key suffix for localStorage, e.g. "practice", "sentences", "flashcards", "quiz", "browse" */
  storageKey: string;
  /** Levels the user currently has access to (from App.tsx's hasAccessToLevel) */
  accessibleLevels: number[];
  /**
   * True while the real access tier is still being confirmed (see App.tsx's accessInfo.isResolving).
   * While true, `accessibleLevels` may be transiently narrower than the user's real entitlement —
   * skip committing a first-visit default selection until it settles, so a returning premium user's
   * very first visit to a mode doesn't get permanently locked into whatever was accessible during
   * the resolve window.
   */
  isResolving?: boolean;
}

interface UseHskLevelSelectionResult {
  /** Sorted ascending; [] = none selected */
  selectedLevels: number[];
  toggleLevel: (level: number) => void;
  /** All-accessible-selected -> select none; otherwise -> select all accessible */
  toggleAll: () => void;
  /** Reset to all currently-accessible levels */
  selectAll: () => void;
  allSelected: boolean;
}

function storageKeyFor(key: string): string {
  return `hanyu-hsk-levels-${key}`;
}

function readStored(key: string): number[] | null {
  try {
    const raw = localStorage.getItem(storageKeyFor(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((l): l is number => typeof l === "number");
  } catch {
    return null;
  }
}

function writeStored(key: string, levels: number[]) {
  try {
    localStorage.setItem(storageKeyFor(key), JSON.stringify(levels));
  } catch {
    // ignore (sandboxed/unavailable storage)
  }
}

export function useHskLevelSelection({
  storageKey,
  accessibleLevels,
  isResolving = false,
}: UseHskLevelSelectionOptions): UseHskLevelSelectionResult {
  // The full, persisted selection — never silently truncated by a transient/narrow
  // accessibleLevels (e.g. mid auth-resolve). Only ever changed by explicit user action.
  const [storedLevels, setStoredLevels] = useState<number[] | null>(() => readStored(storageKey));

  // First-ever visit for this mode: default to everything currently accessible, once the real
  // access tier has settled (not mid-resolve — see isResolving doc above).
  useEffect(() => {
    if (storedLevels === null && accessibleLevels.length > 0 && !isResolving) {
      const defaults = [...accessibleLevels].sort((a, b) => a - b);
      setStoredLevels(defaults);
      writeStored(storageKey, defaults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedLevels === null, accessibleLevels.length, isResolving, storageKey]);

  // Displayed/effective selection: persisted selection intersected with what's accessible
  // right now, so a level the user has genuinely lost access to (e.g. premium lapsed) drops
  // out of the live filter — but this intersection is never written back to storage, so a
  // transient narrow accessibleLevels can't permanently shrink the saved selection.
  const selectedLevels = useMemo(() => {
    const base = storedLevels ?? [];
    return base.filter((l) => accessibleLevels.includes(l)).sort((a, b) => a - b);
  }, [storedLevels, accessibleLevels]);

  const persist = (levels: number[]) => {
    const sorted = [...levels].sort((a, b) => a - b);
    setStoredLevels(sorted);
    writeStored(storageKey, sorted);
  };

  const toggleLevel = (level: number) => {
    if (!accessibleLevels.includes(level)) return;
    const current = storedLevels ?? [];
    if (current.includes(level)) {
      persist(current.filter((l) => l !== level));
    } else {
      persist([...current, level]);
    }
  };

  const allSelected = accessibleLevels.length > 0 && accessibleLevels.every((l) => selectedLevels.includes(l));

  const toggleAll = () => {
    if (allSelected) {
      persist([]);
    } else {
      persist(accessibleLevels);
    }
  };

  const selectAll = () => persist(accessibleLevels);

  return { selectedLevels, toggleLevel, toggleAll, selectAll, allSelected };
}
