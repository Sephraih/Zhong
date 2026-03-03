// Access level utilities for HSK level filtering

import type { VocabWord } from "../data/vocabulary";

export interface AccessInfoLite {
  isLoggedIn: boolean;
  accountTier: 'free' | 'premium';
  purchasedLevels: number[];
}

// All HSK levels that could exist
const ALL_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// Levels currently available in the database
const AVAILABLE_DB_LEVELS = [1, 2, 3, 4, 5, 6];

/**
 * Get levels that actually exist in the provided word list
 */
export function getAvailableLevelsFromData(words: VocabWord[]): number[] {
  const levels = new Set<number>();
  for (const w of words) {
    levels.add(w.hskLevel);
  }
  return Array.from(levels).sort((a, b) => a - b);
}

/**
 * Get levels to show in the UI (available in data + coming soon indicators)
 */
export function getShownLevels(words: VocabWord[]): number[] {
  const fromData = getAvailableLevelsFromData(words);
  // Show all levels from 1 to max(fromData, 4)
  const maxLevel = Math.max(...fromData, 4);
  return ALL_LEVELS.filter(l => l <= maxLevel);
}

/**
 * Check if user has access to a level
 */
export function hasAccessToLevel(level: number, access: AccessInfoLite): boolean {
  // Premium users have access to all available levels
  if (access.accountTier === 'premium') {
    return AVAILABLE_DB_LEVELS.includes(level);
  }
  
  // Anonymous users only get HSK 1 preview
  if (!access.isLoggedIn) {
    return level === 1;
  }
  
  // Logged in free users get HSK 1 + purchased levels
  if (level === 1) return true;
  return access.purchasedLevels.includes(level);
}

/**
 * Get the reason why a level is locked (or null if not locked)
 */
export function lockReasonForLevel(level: number, access: AccessInfoLite): string | null {
  // Check if level exists in database
  if (!AVAILABLE_DB_LEVELS.includes(level)) {
    return `HSK ${level} not available yet`;
  }
  
  // Check if user has access
  if (hasAccessToLevel(level, access)) {
    return null;
  }
  
  // Determine lock reason
  if (!access.isLoggedIn) {
    return `Sign in to access HSK ${level}`;
  }
  
  return `Purchase HSK ${level} (or Premium) to unlock`;
}

/**
 * Get all accessible levels for a user
 */
export function getAccessibleLevels(access: AccessInfoLite): number[] {
  return AVAILABLE_DB_LEVELS.filter(level => hasAccessToLevel(level, access));
}
