import { useMemo } from "react";
import { getHskFilterActiveClasses } from "../utils/hskColors";
import { getAvailableLevelsFromData, getShownLevels, hasAccessToLevel, lockReasonForLevel, type AccessInfoLite } from "../utils/accessLevels";

interface Props {
  words: { hskLevel: number }[];
  selectedLevels: number[]; // empty = all
  onChange: (next: number[]) => void;
  access: AccessInfoLite;
  onLocked?: (reason: string) => void; // used on mobile to show toast
}

export function HskLevelSelector({ words, selectedLevels, onChange, access, onLocked }: Props) {
  const available = useMemo(() => getAvailableLevelsFromData(words as any), [words]);
  const shown = useMemo(() => getShownLevels(words as any), [words]);

  const normalizedSelected = useMemo(() => {
    const filtered = selectedLevels.filter((l) => shown.includes(l));
    return Array.from(new Set(filtered)).sort((a, b) => a - b);
  }, [selectedLevels, shown]);

  const allSelected = normalizedSelected.length === 0;

  const toggle = (level: number) => {
    if (!hasAccessToLevel(level, access) || !available.includes(level)) {
      const reason = lockReasonForLevel(level, access) || "Level not available";
      onLocked?.(reason);
      return;
    }

    if (allSelected) {
      onChange([level]);
      return;
    }

    const next = new Set(normalizedSelected);
    if (next.has(level)) {
      if (next.size === 1) return;
      next.delete(level);
    } else {
      next.add(level);
    }
    onChange(Array.from(next).sort((a, b) => a - b));
  };

  return (
    <div className="flex flex-wrap justify-center gap-2">
      <button
        onClick={() => onChange([])}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
          allSelected
            ? "bg-red-600 text-white border-red-700"
            : "bg-neutral-900 text-gray-500 border-neutral-700 hover:border-neutral-600"
        }`}
      >
        All
      </button>

      {shown.map((level) => {
        const accessible = hasAccessToLevel(level, access);
        const enabled = accessible && available.includes(level);
        const selected = normalizedSelected.includes(level);
        const title = enabled ? undefined : lockReasonForLevel(level, access) || "Not available";

        return (
          <button
            key={level}
            onClick={() => toggle(level)}
            title={title}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              !enabled
                ? "bg-neutral-900/50 text-gray-600 border-neutral-800 cursor-not-allowed"
                : selected
                ? `${getHskFilterActiveClasses(level)} border-transparent`
                : "bg-neutral-900 text-gray-500 border-neutral-700 hover:border-neutral-600"
            }`}
          >
            {!enabled ? "🔒 " : ""}HSK {level}
          </button>
        );
      })}

      {[5, 6, 7, 8, 9].map((level) => (
        <button
          key={level}
          type="button"
          onClick={() => onLocked?.(`HSK ${level} not available yet`)}
          title={`HSK ${level} not available yet`}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border bg-neutral-900/40 text-gray-700 border-neutral-800 cursor-not-allowed"
        >
          ⏳ HSK {level}
        </button>
      ))}
    </div>
  );
}
