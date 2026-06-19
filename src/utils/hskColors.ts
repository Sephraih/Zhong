// HSK level badge color classes
// Matches the colors used in the stats banner:
// HSK 1: emerald, HSK 2: blue, HSK 3: purple, HSK 4: orange

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
      return "bg-neutral-800 text-gray-400 border border-neutral-700";
  }
}

// For filter buttons - active state colors
export function getHskFilterActiveClasses(level: number): string {
  switch (level) {
    case 1:
      return "bg-emerald-600 text-white shadow-sm shadow-emerald-900/20";
    case 2:
      return "bg-blue-600 text-white shadow-sm shadow-blue-900/20";
    case 3:
      return "bg-purple-600 text-white shadow-sm shadow-purple-900/20";
    case 4:
      return "bg-orange-600 text-white shadow-sm shadow-orange-900/20";
    case 5:
      return "bg-pink-600 text-white shadow-sm shadow-pink-900/20";
    case 6:
      return "bg-cyan-600 text-white shadow-sm shadow-cyan-900/20";
    default:
      return "bg-red-600 text-white shadow-sm shadow-red-900/20";
  }
}

// For filter buttons - locked state colors (disabled, with a subtle hint of the level color)
export function getHskLockedClasses(level: number): string {
  switch (level) {
    case 1:
      return "bg-neutral-900/55 text-emerald-200/35 border border-emerald-900/30";
    case 2:
      return "bg-neutral-900/55 text-blue-200/35 border border-blue-900/30";
    case 3:
      return "bg-neutral-900/55 text-purple-200/35 border border-purple-900/30";
    case 4:
      return "bg-neutral-900/55 text-orange-200/35 border border-orange-900/30";
    case 5:
      return "bg-neutral-900/55 text-pink-200/35 border border-pink-900/30";
    case 6:
      return "bg-neutral-900/55 text-cyan-200/35 border border-cyan-900/30";
    default:
      return "bg-neutral-900/55 text-gray-600 border border-neutral-800";
  }
}

// Neutral "checking access…" state — used instead of the hard lock while the real
// access tier is still resolving, so we never misleadingly show a level as locked
// when it may turn out to be accessible once auth resolves.
export function getHskResolvingClasses(): string {
  return "bg-neutral-900/40 text-gray-500 border border-neutral-800 animate-pulse cursor-wait";
}
