import { useState, useCallback, useRef } from "react";
import { useIsMobile } from "../hooks/useIsMobile";

interface HoverCharacterProps {
  char: string;
  pinyin: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function HoverCharacter({ char, pinyin, size = "md" }: HoverCharacterProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const isMobile = useIsMobile();
  const tapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPunctuation = /^[。，！？、；：""''（）《》…—\s.!?,;:'"()\-]$/.test(char);

  // Desktop sizes
  const sizeClasses: Record<string, string> = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-5xl",
    "2xl": "text-7xl",
  };

  // Mobile sizes — bump up sm and md so example sentences are tappable
  const mobileSizeClasses: Record<string, string> = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-5xl",
    "2xl": "text-7xl",
  };

  const pinyinSizeClasses: Record<string, string> = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
    xl: "text-base",
    "2xl": "text-lg",
  };

  // Mobile pinyin sizes — slightly larger for readability
  const mobilePinyinSizeClasses: Record<string, string> = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
    "2xl": "text-xl",
  };

  // Mobile: min tap target height per size
  const mobileTapTargetClasses: Record<string, string> = {
    sm: "min-w-[28px] min-h-[44px]",
    md: "min-w-[32px] min-h-[48px]",
    lg: "min-w-[36px] min-h-[52px]",
    xl: "min-w-[40px] min-h-[56px]",
    "2xl": "min-w-[48px] min-h-[64px]",
  };

  const activeSizeClasses = isMobile ? mobileSizeClasses : sizeClasses;
  const activePinyinClasses = isMobile ? mobilePinyinSizeClasses : pinyinSizeClasses;

  // ── Interaction handlers ──

  // Desktop: hover
  const handleMouseEnter = useCallback(() => {
    if (!isMobile) setIsRevealed(true);
  }, [isMobile]);

  const handleMouseLeave = useCallback(() => {
    if (!isMobile) setIsRevealed(false);
  }, [isMobile]);

  // Mobile: tap to toggle
  const handleTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isMobile) return;

      // Prevent the tap from bubbling to the card's flip handler
      e.stopPropagation();

      // Clear any pending timeout (rapid taps)
      if (tapTimeout.current) {
        clearTimeout(tapTimeout.current);
        tapTimeout.current = null;
      }

      setIsRevealed((prev) => !prev);
    },
    [isMobile]
  );

  if (isPunctuation) {
    return (
      <span className={`${activeSizeClasses[size]} text-gray-500`}>
        {char}
      </span>
    );
  }

  return (
    <span
      className={`relative inline-flex flex-col items-center group
        ${isMobile ? `cursor-pointer select-none ${mobileTapTargetClasses[size]} justify-end` : "cursor-pointer"}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleTap}
      // Prevent long-press context menu on mobile
      onContextMenu={isMobile ? (e) => e.preventDefault() : undefined}
    >
      {/* Pinyin label */}
      <span
        className={`${activePinyinClasses[size]} text-red-400 font-medium transition-all duration-200 leading-tight text-center whitespace-nowrap ${
          isRevealed ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
        }`}
        style={{
          minHeight:
            size === "2xl"
              ? "2rem"
              : size === "xl"
              ? "1.5rem"
              : size === "lg"
              ? "1.25rem"
              : "1rem",
        }}
      >
        {pinyin}
      </span>

      {/* Character */}
      <span
        className={`${activeSizeClasses[size]} transition-colors duration-200 ${
          isRevealed ? "text-red-400" : "text-white"
        }`}
      >
        {char}
      </span>

      {/* Mobile: subtle tap indicator dot (only when pinyin is hidden) */}
      {isMobile && !isRevealed && (
        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-800/50" />
      )}
    </span>
  );
}
