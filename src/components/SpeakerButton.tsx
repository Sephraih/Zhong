interface SpeakerButtonProps {
  text: string;
  size?: "sm" | "md" | "lg";
}

export function SpeakerButton({ text, size = "sm" }: SpeakerButtonProps) {
  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "zh-CN";
      utter.rate = 0.9;
      utter.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      
      const preferredVoice = 
        voices.find(v => v.name.includes("Xiaoxiao")) ||
        voices.find(v => v.name.includes("Google") && v.lang.startsWith("zh")) ||
        voices.find(v => v.name.toLowerCase().includes("neural") && v.lang.startsWith("zh")) ||
        voices.find(v => v.name.toLowerCase().includes("online") && v.lang.startsWith("zh")) ||
        voices.find(v => v.lang === "zh-CN") ||
        voices.find(v => v.lang.startsWith("zh"));

      if (preferredVoice) {
        utter.voice = preferredVoice;
        if (preferredVoice.name.includes("Xiaoxiao")) utter.rate = 0.85;
      }

      window.speechSynthesis.speak(utter);
    }
  };

  const sizeClasses: Record<string, string> = {
    sm: "w-7 h-7",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const iconSizes: Record<string, string> = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <button
      onClick={handleSpeak}
      title="Listen to pronunciation"
      className={`${sizeClasses[size]} inline-flex items-center justify-center rounded-full bg-neutral-800 hover:bg-red-900/60 text-gray-400 hover:text-red-400 transition-all duration-200 border border-neutral-700 hover:border-red-700/60 shrink-0 cursor-pointer active:scale-90`}
    >
      <svg
        className={iconSizes[size]}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.788v6.424a.5.5 0 00.757.429l4.964-3.212a.5.5 0 000-.858L7.257 8.36a.5.5 0 00-.757.429z"
        />
      </svg>
    </button>
  );
}
