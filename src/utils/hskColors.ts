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
    default:
      return "bg-red-600 text-white shadow-sm shadow-red-900/20";
  }
}
