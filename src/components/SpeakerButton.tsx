interface SpeakerButtonProps {
  text: string;
  size?: "sm" | "md" | "lg";
}

// Helper to find the best Chinese voice
function findChineseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  return (
    voices.find(v => v.name.includes("Xiaoxiao")) ||
    voices.find(v => v.name.includes("Google") && v.lang.startsWith("zh")) ||
    voices.find(v => v.name.toLowerCase().includes("neural") && v.lang.startsWith("zh")) ||
    voices.find(v => v.name.toLowerCase().includes("online") && v.lang.startsWith("zh")) ||
    voices.find(v => v.lang === "zh-CN") ||
    voices.find(v => v.lang.startsWith("zh"))
  );
}

// Speak text with better Firefox support
function speakText(text: string) {
  if (!("speechSynthesis" in window)) return;

  const synth = window.speechSynthesis;

  // Firefox can sometimes get stuck in a paused state, especially after cancel()
  try {
    synth.cancel();
    synth.resume();
  } catch {
    // ignore
  }

  const speak = () => {
    // Ensure active (Firefox)
    try {
      synth.resume();
    } catch {
      // ignore
    }

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "zh-CN";
    utter.rate = 0.9;
    utter.pitch = 1.0;
    utter.volume = 1.0;

    const voices = synth.getVoices();
    const preferredVoice = findChineseVoice(voices);

    // Only force a voice if we found a Chinese one.
    // Forcing an incompatible voice can cause silence on some Firefox installs.
    if (preferredVoice && preferredVoice.lang?.toLowerCase().startsWith("zh")) {
      utter.voice = preferredVoice;
      if (preferredVoice.name.includes("Xiaoxiao")) utter.rate = 0.85;
    }

    utter.onerror = (e) => {
      // eslint-disable-next-line no-console
      console.warn("Speech synthesis error:", e);
    };

    synth.speak(utter);
  };

  const voices = synth.getVoices();

  if (voices.length > 0) {
    speak();
    return;
  }

  // Firefox: voices may not be loaded yet, wait for voiceschanged.
  const handleVoicesChanged = () => {
    synth.removeEventListener("voiceschanged", handleVoicesChanged);
    // Give Firefox a tick to settle
    setTimeout(() => speak(), 50);
  };

  synth.addEventListener("voiceschanged", handleVoicesChanged);

  // Fallback: speak anyway after a short delay (some browsers never fire voiceschanged)
  setTimeout(() => {
    synth.removeEventListener("voiceschanged", handleVoicesChanged);
    speak();
  }, 250);
}

export function SpeakerButton({ text, size = "sm" }: SpeakerButtonProps) {
  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    speakText(text);
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
