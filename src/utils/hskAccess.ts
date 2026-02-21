// HSK Access Level Utilities

export type AccountTier = 'free' | 'premium';

export interface AccessInfo {
  isLoggedIn: boolean;
  accountTier: AccountTier;
  purchasedLevels: number[];
}

// Levels currently available in the database
export const AVAILABLE_LEVELS = [1, 2, 3, 4];

// Levels coming soon
export const COMING_SOON_LEVELS = [5, 6, 7, 8, 9];

// All possible HSK levels
export const ALL_HSK_LEVELS = [...AVAILABLE_LEVELS, ...COMING_SOON_LEVELS];

/**
 * Get all accessible HSK levels for a user
 */
export function getAccessibleLevels(access: AccessInfo): number[] {
  // Premium users get all available levels
  if (access.accountTier === 'premium') {
    return [...AVAILABLE_LEVELS];
  }
  
  // Logged in users always get HSK 1
  if (access.isLoggedIn) {
    const levels = new Set([1, ...access.purchasedLevels]);
    return Array.from(levels).filter(l => AVAILABLE_LEVELS.includes(l)).sort((a, b) => a - b);
  }
  
  // Anonymous users get HSK 1 (limited to 200 words, handled elsewhere)
  return [1];
}

/**
 * Check if a specific level is accessible
 */
export function isLevelAccessible(level: number, access: AccessInfo): boolean {
  const accessible = getAccessibleLevels(access);
  return accessible.includes(level);
}

/**
 * Check if a level is available in the database
 */
export function isLevelAvailable(level: number): boolean {
  return AVAILABLE_LEVELS.includes(level);
}

/**
 * Check if a level is coming soon
 */
export function isLevelComingSoon(level: number): boolean {
  return COMING_SOON_LEVELS.includes(level);
}

/**
 * Get the reason why a level is locked
 */
export function getLockReason(level: number, access: AccessInfo): string | null {
  // Check if it's a coming soon level
  if (isLevelComingSoon(level)) {
    return "Coming Soon";
  }
  
  // Check if level is available
  if (!isLevelAvailable(level)) {
    return "Not Available";
  }
  
  // Check if user has access
  if (isLevelAccessible(level, access)) {
    return null; // Not locked
  }
  
  // Determine lock reason
  if (!access.isLoggedIn) {
    return `Sign in to access HSK ${level}`;
  }
  
  if (level === 1) {
    return null; // HSK 1 is always free for logged in users
  }
  
  return `Purchase HSK ${level} to unlock`;
}

/**
 * Get badge classes for HSK level
 */
export function getHskBadgeClasses(level: number): string {
  switch (level) {
    case 1:
      return "bg-emerald-950/80 text-emerald-400 border border-emerald-800/50";
    case 2:
      return "bg-blue-950/80 text-blue-400 border border-blue-800/50";
    case 3:
      return "bg-purple-950/80 text-purple-400 border border-purple-800/50";
    case 4:
      return "bg-orange-950/80 text-orange-400 border border-orange-800/50";
    case 5:
      return "bg-pink-950/80 text-pink-400 border border-pink-800/50";
    case 6:
      return "bg-cyan-950/80 text-cyan-400 border border-cyan-800/50";
    default:
      return "bg-gray-950/80 text-gray-400 border border-gray-800/50";
  }
}

/**
 * Get button classes for HSK level filter (selected state)
 */
export function getHskButtonClasses(level: number, isSelected: boolean): string {
  if (!isSelected) {
    return "bg-neutral-900 text-gray-400 border border-neutral-800";
  }
  
  switch (level) {
    case 1:
      return "bg-emerald-600 text-white border border-emerald-500";
    case 2:
      return "bg-blue-600 text-white border border-blue-500";
    case 3:
      return "bg-purple-600 text-white border border-purple-500";
    case 4:
      return "bg-orange-600 text-white border border-orange-500";
    default:
      return "bg-red-600 text-white border border-red-500";
  }
}
