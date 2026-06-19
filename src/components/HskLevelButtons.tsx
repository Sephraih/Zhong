import { getHskFilterActiveClasses, getHskLockedClasses, getHskResolvingClasses } from "../utils/hskColors";

interface HskLevelButtonsProps {
  /** All levels to render as buttons, in order, e.g. [1,2,3,4,5,6] */
  shownLevels: number[];
  /** Levels the current user can access right now (subset of shownLevels) */
  accessibleLevels: number[];
  selectedLevels: number[];
  onToggleLevel: (level: number) => void;
  onToggleAll: () => void;
  /** Tooltip text for a locked level; return null if accessible */
  lockReasonForLevel?: (level: number) => string | null;
  /** True while the real access tier is still resolving (see App.tsx's accessInfo.isResolving) */
  isResolving?: boolean;
  /** Called when a locked button is clicked (open login/profile) */
  onLockedClick?: () => void;
  /** Browse-only: per-level word counts, renders "HSK 2 (143)" */
  levelCounts?: Record<number, number>;
  className?: string;
}

export function HskLevelButtons({
  shownLevels,
  accessibleLevels,
  selectedLevels,
  onToggleLevel,
  onToggleAll,
  lockReasonForLevel,
  isResolving = false,
  onLockedClick,
  levelCounts,
  className,
}: HskLevelButtonsProps) {
  const allSelected = accessibleLevels.length > 0 && accessibleLevels.every((l) => selectedLevels.includes(l));

  return (
    <div className={`flex flex-wrap justify-center gap-2 ${className ?? ""}`}>
      <button
        onClick={onToggleAll}
        className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border ${
          allSelected
            ? "bg-red-600 text-white border-red-600 shadow-sm shadow-red-900/20"
            : "bg-neutral-900 text-gray-400 border-neutral-800 hover:border-neutral-700 hover:text-white"
        }`}
        title="Toggle all available levels"
      >
        All
      </button>

      {shownLevels.map((level) => {
        const enabled = accessibleLevels.includes(level);
        const selected = selectedLevels.includes(level);
        const resolving = isResolving && !enabled;
        const reason = lockReasonForLevel?.(level) ?? null;
        const label = levelCounts ? `HSK ${level} (${levelCounts[level] ?? 0})` : `HSK ${level}`;

        return (
          <button
            key={level}
            onClick={() => {
              if (resolving) return;
              if (!enabled) {
                onLockedClick?.();
                return;
              }
              onToggleLevel(level);
            }}
            title={resolving ? "Checking access…" : enabled ? undefined : reason ?? undefined}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border ${
              resolving
                ? getHskResolvingClasses()
                : !enabled
                ? getHskLockedClasses(level)
                : selected
                ? `${getHskFilterActiveClasses(level)} border-transparent`
                : "bg-neutral-900 text-gray-400 border-neutral-800 hover:text-white hover:bg-neutral-800"
            }`}
          >
            {!resolving && !enabled ? "🔒 " : ""}
            {label}
          </button>
        );
      })}
    </div>
  );
}
