import type { VocabWord } from "../data/vocabulary";

export interface AccessInfoLite {
  isLoggedIn: boolean;
  accountTier: "free" | "premium";
  purchasedLevels: number[];
}

export function hasAccessToLevel(level: number, access: AccessInfoLite): boolean {
  if (level >= 7) return false; // Levels 7-9 not available yet
  if (access.accountTier === "premium") return true;
  if (!access.isLoggedIn) return level === 1;
  if (level === 1) return true;
  return access.purchasedLevels.includes(level);
}

export function lockReasonForLevel(level: number, access: AccessInfoLite): string {
  if (level >= 7) return `HSK ${level} not available yet`;
  if (!access.isLoggedIn) return `Sign in to access HSK ${level}`;
  if (access.accountTier === "premium") return "";
  if (level === 1) return "";
  if (access.purchasedLevels.includes(level)) return "";
  return `Purchase HSK ${level} (or Premium) to unlock`;
}

export function getShownLevels(_words: VocabWord[]): number[] {
  // Always show 1-6 (even if some are locked / filtered out), and 7-9 as coming soon.
  return [1, 2, 3, 4, 5, 6];
}

export function getAvailableLevelsFromData(words: VocabWord[]): number[] {
  const set = new Set<number>();
  for (const w of words) set.add(w.hskLevel);
  return Array.from(set).sort((a, b) => a - b);
}
