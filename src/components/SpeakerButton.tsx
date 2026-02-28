interface SpeakerButtonProps {
  text: string;
  size?: "sm" | "md" | "lg";
}

// Firefox often returns an empty voice list initially; this helper waits briefly for voices to load.
let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

function getVoicesAsync(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return Promise.resolve([]);

  if (voicesPromise) return voicesPromise;

  voicesPromise = new Promise<SpeechSynthesisVoice[]>((resolve) => {
    const synth = window.speechSynthesis;

    const tryResolve = () => {
      const v = synth.getVoices();
      if (v && v.length > 0) {
        cleanup();
        resolve(v);
        return true;
      }
      return false;
    };

    const onVoicesChanged = () => {
      if (tryResolve()) return;
    };

    let interval: number | null = null;
    const timeout = window.setTimeout(() => {
      cleanup();
      resolve(synth.getVoices() || []);
    }, 1200);

    const cleanup = () => {
      synth.removeEventListener?.("voiceschanged", onVoicesChanged);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anySynth = synth as any;
      if (anySynth.onvoiceschanged === onVoicesChanged) anySynth.onvoiceschanged = null;
      if (interval !== null) window.clearInterval(interval);
      window.clearTimeout(timeout);
    };

    // Trigger loading in some browsers
    synth.getVoices();

    // Prefer addEventListener when available
    if (synth.addEventListener) synth.addEventListener("voiceschanged", onVoicesChanged);
    // Fallback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (synth as any).onvoiceschanged = onVoicesChanged;

    interval = window.setInterval(() => {
      tryResolve();
    }, 100);

    // If already available, resolve immediately
    tryResolve();
  });

  return voicesPromise;
}

async function speakChinese(text: string) {
  if (!("speechSynthesis" in window)) return;

  const synth = window.speechSynthesis;

  // In Firefox, synth can be "paused" until resumed.
  try {
    synth.cancel();
    synth.resume();
  } catch {
    // ignore
  }

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "zh-CN";
  utter.rate = 0.9;
  utter.pitch = 1.0;

  const voices = await getVoicesAsync();

  const preferredVoice =
    voices.find((v) => v.name.includes("Xiaoxiao")) ||
    voices.find((v) => v.name.includes("Google") && v.lang.startsWith("zh")) ||
    voices.find((v) => v.name.toLowerCase().includes("neural") && v.lang.startsWith("zh")) ||
    voices.find((v) => v.name.toLowerCase().includes("online") && v.lang.startsWith("zh")) ||
    voices.find((v) => v.lang === "zh-CN") ||
    voices.find((v) => v.lang.startsWith("zh"));

  // Only set a voice if we actually found one. Some browsers behave oddly if you set a voice
  // with a mismatched language.
  if (preferredVoice) {
    utter.voice = preferredVoice;
    if (preferredVoice.name.includes("Xiaoxiao")) utter.rate = 0.85;
  }

  synth.speak(utter);
}

export function SpeakerButton({ text, size = "sm" }: SpeakerButtonProps) {
  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    void speakChinese(text);
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
