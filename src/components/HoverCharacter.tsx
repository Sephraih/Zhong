import { useState } from "react";

interface HoverCharacterProps {
  char: string;
  pinyin: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function HoverCharacter({ char, pinyin, size = "md" }: HoverCharacterProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isPunctuation = /^[。，！？、；：""''（）《》…—\s.!?,;:'"()\-]$/.test(char);

  const sizeClasses: Record<string, string> = {
    sm: "text-lg",
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

  if (isPunctuation) {
    return <span className={`${sizeClasses[size]} text-gray-500`}>{char}</span>;
  }

  return (
    <span
      className="relative inline-flex flex-col items-center cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      <span
        className={`${pinyinSizeClasses[size]} text-red-400 font-medium transition-all duration-200 ${
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
        }`}
        style={{ minHeight: size === "2xl" ? "2rem" : size === "xl" ? "1.5rem" : size === "lg" ? "1.25rem" : "1rem" }}
      >
        {pinyin}
      </span>
      <span
        className={`${sizeClasses[size]} transition-colors duration-200 ${
          isHovered ? "text-red-400" : "text-white"
        }`}
      >
        {char}
      </span>
    </span>
  );
}
