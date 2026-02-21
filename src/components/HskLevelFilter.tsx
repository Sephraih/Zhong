import { useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { 
  getHskButtonClasses, 
  getLockReason, 
  isLevelAvailable,
  isLevelComingSoon,
  AVAILABLE_LEVELS,
  type AccessInfo 
} from "../utils/hskAccess";

interface HskLevelFilterProps {
  selectedLevels: number[];
  onToggleLevel: (level: number) => void;
  onSelectAll: () => void;
  accessInfo: AccessInfo;
  showLockedLevels?: boolean;
  onLoginClick?: () => void;
  onUpgradeClick?: () => void;
}

export function HskLevelFilter({
  selectedLevels,
  onToggleLevel,
  onSelectAll,
  accessInfo,
  showLockedLevels = true,
  onLoginClick,
  onUpgradeClick,
}: HskLevelFilterProps) {
  const isMobile = useIsMobile();
  const [tooltipLevel, setTooltipLevel] = useState<number | null>(null);

  const allSelected = AVAILABLE_LEVELS.every(l => selectedLevels.includes(l));
  
  const handleLevelClick = (level: number) => {
    const lockReason = getLockReason(level, accessInfo);
    
    if (lockReason) {
      // Show tooltip on mobile
      if (isMobile) {
        setTooltipLevel(tooltipLevel === level ? null : level);
      }
      return;
    }
    
    onToggleLevel(level);
  };

  const handleLockedAction = (_level: number) => {
    if (!accessInfo.isLoggedIn && onLoginClick) {
      onLoginClick();
    } else if (onUpgradeClick) {
      onUpgradeClick();
    }
  };

  return (
    <div className="flex flex-wrap justify-center gap-2 relative">
      {/* All button */}
      <button
        onClick={onSelectAll}
        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
          allSelected
            ? "bg-red-600 text-white border border-red-500"
            : "bg-neutral-900 text-gray-400 border border-neutral-800 hover:border-neutral-700"
        }`}
      >
        All
      </button>

      {/* Level buttons */}
      {AVAILABLE_LEVELS.map((level) => {
        const isSelected = selectedLevels.includes(level);
        const lockReason = getLockReason(level, accessInfo);
        const isLocked = !!lockReason;
        const isComingSoon = isLevelComingSoon(level);
        const showTooltip = tooltipLevel === level && isLocked;

        if (!showLockedLevels && isLocked && !isLevelAvailable(level)) {
          return null;
        }

        return (
          <div key={level} className="relative">
            <button
              onClick={() => handleLevelClick(level)}
              onMouseEnter={() => !isMobile && isLocked && setTooltipLevel(level)}
              onMouseLeave={() => !isMobile && setTooltipLevel(null)}
              disabled={isComingSoon}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                isLocked
                  ? "bg-neutral-900/50 text-gray-600 border border-neutral-800 cursor-not-allowed"
                  : getHskButtonClasses(level, isSelected)
              } ${!isLocked && "hover:opacity-90"}`}
            >
              {isLocked && <span className="text-xs">🔒</span>}
              HSK {level}
            </button>

            {/* Tooltip */}
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
                <div className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                  <p className="text-sm text-white mb-1">{lockReason}</p>
                  {!isComingSoon && (
                    <button
                      onClick={() => handleLockedAction(level)}
                      className="text-xs text-red-400 hover:text-red-300 font-medium"
                    >
                      {!accessInfo.isLoggedIn ? "Sign in →" : "Upgrade →"}
                    </button>
                  )}
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                  <div className="border-8 border-transparent border-t-neutral-800" />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
