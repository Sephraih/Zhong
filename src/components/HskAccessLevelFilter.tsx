import { useMemo, useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { getHskFilterActiveClasses } from "../utils/hskColors";

export interface AccessContextInfo {
  isLoggedIn: boolean;
  isPremium: boolean;
  purchasedLevels: number[];
}

interface HskAccessLevelFilterProps {
  /** Levels that exist in the dataset (e.g. [1,2] for fallback, [1..4] for Supabase) */
  availableLevels: number[];
  /** Levels currently selected; empty means "All" */
  selectedLevels: number[];
  onChangeSelectedLevels: (levels: number[]) => void;
  access: AccessContextInfo;
  comingSoonLevels?: number[];
}

function normalizeSelected(availableLevels: number[], selectedLevels: number[]): number[] {
  const filtered = selectedLevels.filter((l) => availableLevels.includes(l));
  return Array.from(new Set(filtered)).sort((a, b) => a - b);
}

function isLevelAccessible(level: number, access: AccessContextInfo): boolean {
  if (level >= 5) return false;
  if (access.isPremium) return true;
  if (!access.isLoggedIn) return level === 1;
  if (level === 1) return true;
  return access.purchasedLevels.includes(level);
}

function lockReason(level: number, access: AccessContextInfo): string {
  if (level >= 5) return `HSK ${level} not available yet`;
  if (!access.isLoggedIn) return `Sign in to access HSK ${level}`;
  if (access.isPremium) return "";
  if (level === 1) return "";
  if (access.purchasedLevels.includes(level)) return "";
  return `Purchase HSK ${level} (or Premium) to unlock`;
}

export function HskAccessLevelFilter({
  availableLevels,
  selectedLevels,
  onChangeSelectedLevels,
  access,
  comingSoonLevels = [5, 6, 7, 8, 9],
}: HskAccessLevelFilterProps) {
  const isMobile = useIsMobile();
  const [toast, setToast] = useState<string | null>(null);

  const normalizedSelected = useMemo(
    () => normalizeSelected(availableLevels, selectedLevels),
    [availableLevels, selectedLevels]
  );

  const allSelected = availableLevels.length > 0 && normalizedSelected.length === 0;

  const setAll = () => {
    onChangeSelectedLevels([]);
  };

  const toggle = (level: number) => {
    const accessible = isLevelAccessible(level, access);
    if (!accessible) {
      const msg = lockReason(level, access);
      if (isMobile) {
        setToast(msg);
        window.setTimeout(() => setToast(null), 2200);
      }
      return;
    }

    // empty = all; toggling from all should start with only this level
    if (normalizedSelected.length === 0) {
      onChangeSelectedLevels([level]);
      return;
    }

    const next = new Set(normalizedSelected);
    if (next.has(level)) {
      if (next.size === 1) return; // keep at least one
      next.delete(level);
    } else {
      next.add(level);
    }
    onChangeSelectedLevels(Array.from(next).sort((a, b) => a - b));
  };

  const btnBase = "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border";

  return (
    <div className="mb-4">
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={setAll}
          className={`${btnBase} ${
            allSelected
              ? "bg-red-600 text-white border-red-700"
              : "bg-neutral-900 text-gray-500 border-neutral-700 hover:border-neutral-600"
          }`}
        >
          All
        </button>

        {availableLevels.map((level) => {
          const accessible = isLevelAccessible(level, access);
          const selected = normalizedSelected.includes(level);
          const title = !accessible ? lockReason(level, access) : undefined;

          return (
            <button
              key={level}
              onClick={() => toggle(level)}
              title={title}
              className={`${btnBase} ${
                !accessible
                  ? "bg-neutral-900/50 text-gray-600 border-neutral-800 cursor-not-allowed"
                  : selected
                  ? `${getHskFilterActiveClasses(level)} border-transparent`
                  : "bg-neutral-900 text-gray-500 border-neutral-700 hover:border-neutral-600"
              }`}
            >
              {!accessible ? "🔒 " : ""}HSK {level}
            </button>
          );
        })}

        {comingSoonLevels.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => {
              if (isMobile) {
                setToast(`HSK ${level} not available yet`);
                window.setTimeout(() => setToast(null), 2200);
              }
            }}
            title={`HSK ${level} not available yet`}
            className={`${btnBase} bg-neutral-900/40 text-gray-700 border-neutral-800 cursor-not-allowed`}
          >
            ⏳ HSK {level}
          </button>
        ))}
      </div>

      {toast && (
        <div className="mt-3 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-gray-300">
            {toast}
          </span>
        </div>
      )}
    </div>
  );
}
