import { useState, useCallback, useRef, useLayoutEffect } from "react";
import { useIsMobile } from "../hooks/useIsMobile";

interface HoverCharacterProps {
  char: string;
  pinyin: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  wordId?: number | string;
}

/**
 * Helper: check if a click/touch event originated from a HoverCharacter.
 * Used by parent card handlers to ignore taps on characters.
 */
export function isHoverCharacterEvent(e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): boolean {
  const target = e.target as HTMLElement;
  return !!target?.closest?.("[data-hover-char]");
}

export function HoverCharacter({ char, pinyin, size = "md", wordId }: HoverCharacterProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const isMobile = useIsMobile();
  const isTouching = useRef(false);

  const isPunctuation = /^[。，！？、；：""''（）《》…—\s.!?,;:'"()\-]$/.test(char);

  // Reset pinyin visibility when the rendered content changes (new card / new sentence)
  // This prevents “sticky” toggled pinyin when React reuses components between cards.
  useLayoutEffect(() => {
    setIsRevealed(false);
  }, [wordId, char, pinyin]);

  // Desktop sizes
  const sizeClasses: Record<string, string> = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-5xl",
    "2xl": "text-7xl",
  };

  // Mobile sizes
  const mobileSizeClasses: Record<string, string> = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
    "2xl": "text-6xl",
  };

  const pinyinSizeClasses: Record<string, string> = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
    xl: "text-base",
    "2xl": "text-lg",
  };

  const mobilePinyinSizeClasses: Record<string, string> = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
    "2xl": "text-xl",
  };

  const mobileTapTargetClasses: Record<string, string> = {
    sm: "min-w-[28px] min-h-[44px]",
    md: "min-w-[32px] min-h-[48px]",
    lg: "min-w-[36px] min-h-[52px]",
    xl: "min-w-[40px] min-h-[56px]",
    "2xl": "min-w-[48px] min-h-[64px]",
  };

  const activeSizeClasses = isMobile ? mobileSizeClasses : sizeClasses;
  const activePinyinClasses = isMobile ? mobilePinyinSizeClasses : pinyinSizeClasses;

  // Desktop: hover
  const handleMouseEnter = useCallback(() => {
    if (!isMobile) setIsRevealed(true);
  }, [isMobile]);

  const handleMouseLeave = useCallback(() => {
    if (!isMobile) setIsRevealed(false);
  }, [isMobile]);

  // Mobile: use touchEnd to toggle, prevent ALL propagation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    isTouching.current = true;
    e.stopPropagation();
  }, [isMobile]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    e.stopPropagation();
    e.preventDefault(); // Prevent synthetic click
    isTouching.current = false;
    setIsRevealed((prev) => !prev);
  }, [isMobile]);

  // Desktop click handler (also acts as fallback)
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // On mobile, touchEnd already handled the toggle — ignore the synthetic click
    if (isMobile) {
      e.preventDefault();
      return;
    }
  }, [isMobile]);

  if (isPunctuation) {
    return (
      <span className={`${activeSizeClasses[size]} text-gray-500`}>
        {char}
      </span>
    );
  }

  return (
    <span
      data-hover-char="true"
      className={`relative inline-flex flex-col items-center group
        ${isMobile ? `cursor-pointer select-none ${mobileTapTargetClasses[size]} justify-end` : "cursor-pointer"}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
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

      {/* Mobile: subtle tap indicator dot */}
      {isMobile && !isRevealed && (
        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-800/50" />
      )}
    </span>
  );
}
