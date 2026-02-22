import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useIsMobile } from "../hooks/useIsMobile";
import {
  AVAILABLE_LEVELS,
  COMING_SOON_LEVELS,
  getLockReason,
  type AccessInfo,
} from "../utils/hskAccess";

interface HskLevelFilterProps {
  selectedLevels: number[];
  onToggleLevel: (level: number) => void;
  onSelectAll: () => void;
  availableLevelsInData: number[];
  showComingSoon?: boolean;
}

export function HskLevelFilter({
  selectedLevels,
  onToggleLevel,
  onSelectAll,
  availableLevelsInData,
  showComingSoon = false,
}: HskLevelFilterProps) {
  const { user, accountTier, purchasedLevels } = useAuth();
  const isMobile = useIsMobile();
  const [tooltipLevel, setTooltipLevel] = useState<number | null>(null);

  const accessInfo: AccessInfo = {
    isLoggedIn: !!user,
    accountTier: accountTier || "free",
    purchasedLevels: purchasedLevels || [],
  };

  const isAllSelected = selectedLevels.length === 0;

  const handleLevelClick = (level: number) => {
    const lockReason = getLockReason(level, accessInfo);
    if (lockReason) {
      // Show tooltip on click for locked levels
      setTooltipLevel(tooltipLevel === level ? null : level);
      return;
    }
    onToggleLevel(level);
    setTooltipLevel(null);
  };

  const handleAllClick = () => {
    onSelectAll();
    setTooltipLevel(null);
  };

  const getLevelButtonClasses = (level: number, isSelected: boolean, isLocked: boolean): string => {
    if (isLocked) {
      return "bg-neutral-900/50 text-gray-600 border border-neutral-800/50 cursor-not-allowed opacity-60";
    }

    if (!isSelected) {
      return "text-gray-400 hover:text-white hover:bg-neutral-900";
    }

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
  };

  return (
    <div className="inline-flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-xl p-1 flex-wrap relative">
      {/* All button */}
      <button
        onClick={handleAllClick}
        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
          isAllSelected
            ? "bg-red-600 text-white shadow-sm shadow-red-900/20"
            : "text-gray-400 hover:text-white hover:bg-neutral-900"
        }`}
      >
        All
      </button>

      {/* Level buttons */}
      {AVAILABLE_LEVELS.filter((l) => availableLevelsInData.includes(l)).map((level) => {
        const lockReason = getLockReason(level, accessInfo);
        const isLocked = !!lockReason;
        const isSelected = !isLocked && (isAllSelected || selectedLevels.includes(level));
        const showTooltip = tooltipLevel === level && isLocked;

        return (
          <div key={level} className="relative">
            <button
              onClick={() => handleLevelClick(level)}
              onMouseEnter={() => !isMobile && isLocked && setTooltipLevel(level)}
              onMouseLeave={() => !isMobile && setTooltipLevel(null)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1 ${getLevelButtonClasses(
                level,
                isSelected,
                isLocked
              )}`}
            >
              {isLocked && <span className="text-xs">🔒</span>}
              HSK {level}
            </button>

            {/* Tooltip */}
            {showTooltip && lockReason && (
              <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-xs text-white whitespace-nowrap shadow-lg">
                {lockReason}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-neutral-800" />
              </div>
            )}
          </div>
        );
      })}

      {/* Coming soon levels */}
      {showComingSoon &&
        COMING_SOON_LEVELS.slice(0, 2).map((level) => (
          <div key={level} className="relative">
            <button
              onClick={() => setTooltipLevel(tooltipLevel === level ? null : level)}
              onMouseEnter={() => !isMobile && setTooltipLevel(level)}
              onMouseLeave={() => !isMobile && setTooltipLevel(null)}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-neutral-900/30 text-gray-600 border border-neutral-800/30 cursor-not-allowed opacity-50 flex items-center gap-1"
            >
              <span className="text-xs">🔜</span>
              HSK {level}
            </button>

            {tooltipLevel === level && (
              <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-xs text-white whitespace-nowrap shadow-lg">
                Coming Soon
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-neutral-800" />
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
