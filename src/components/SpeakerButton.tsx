interface SpeakerButtonProps {
  text: string;
  size?: "sm" | "md" | "lg";
}

// Helper to find the best Chinese voice
function findChineseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  // Priority order for best Chinese voices
  return (
    voices.find(v => v.name.includes("Xiaoxiao")) ||
    voices.find(v => v.name.includes("Huihui")) ||
    voices.find(v => v.name.includes("Kangkang")) ||
    voices.find(v => v.name.includes("Google") && v.lang.startsWith("zh")) ||
    voices.find(v => v.name.toLowerCase().includes("chinese")) ||
    voices.find(v => v.name.toLowerCase().includes("mandarin")) ||
    voices.find(v => v.lang === "zh-CN") ||
    voices.find(v => v.lang === "zh-TW") ||
    voices.find(v => v.lang.startsWith("zh"))
  );
}

// Speak text with comprehensive browser support (including Firefox)
function speakText(text: string) {
  if (!("speechSynthesis" in window)) {
    console.warn("Speech synthesis not supported in this browser");
    return;
  }
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  // Firefox fix: speechSynthesis can get "stuck" - resume if paused
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
  
  const doSpeak = (voice: SpeechSynthesisVoice | undefined) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "zh-CN";
    utter.rate = 0.9;
    utter.pitch = 1.0;
    utter.volume = 1.0; // Explicitly set maximum volume

    if (voice) {
      utter.voice = voice;
      if (voice.name.includes("Xiaoxiao")) utter.rate = 0.85;
    }

    // Debug: log voice info
    console.log("TTS: Speaking with voice:", voice?.name || "default", "lang:", utter.lang);

    // Event handlers for debugging
    utter.onstart = () => console.log("TTS: Started speaking");
    utter.onend = () => console.log("TTS: Finished speaking");
    utter.onerror = (event) => {
      console.warn("TTS: Speech synthesis error:", event.error);
      // Firefox: try again without specific voice on error
      if (voice && event.error !== "canceled") {
        console.log("TTS: Retrying without specific voice...");
        const fallbackUtter = new SpeechSynthesisUtterance(text);
        fallbackUtter.lang = "zh-CN";
        fallbackUtter.volume = 1.0;
        window.speechSynthesis.speak(fallbackUtter);
      }
    };

    // Firefox fix: wrap in try-catch and use setTimeout
    try {
      // Cancel any stuck speech first
      window.speechSynthesis.cancel();
      
      // Small delay helps Firefox process the speech request
      setTimeout(() => {
        // Resume if paused (Firefox bug)
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        
        window.speechSynthesis.speak(utter);
        
        // Firefox: periodically check if stuck and resume
        let checkCount = 0;
        const checkInterval = setInterval(() => {
          checkCount++;
          if (window.speechSynthesis.paused && window.speechSynthesis.speaking) {
            console.log("TTS: Resuming paused speech...");
            window.speechSynthesis.resume();
          }
          if (checkCount > 30 || !window.speechSynthesis.speaking) {
            clearInterval(checkInterval);
          }
        }, 100);
      }, 50);
    } catch (err) {
      console.warn("TTS: Speech synthesis failed:", err);
    }
  };

  // Get voices
  let voices = window.speechSynthesis.getVoices();
  
  if (voices.length > 0) {
    // Voices already loaded (Chrome, Safari typically)
    doSpeak(findChineseVoice(voices));
  } else {
    // Firefox and some browsers: voices load asynchronously
    let hasSpoken = false;
    
    const attemptSpeak = () => {
      if (hasSpoken) return;
      hasSpoken = true;
      voices = window.speechSynthesis.getVoices();
      doSpeak(findChineseVoice(voices));
    };
    
    // Method 1: Listen for voiceschanged event
    const onVoicesChanged = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      attemptSpeak();
    };
    window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
    
    // Method 2: Poll for voices (some Firefox versions need this)
    let pollCount = 0;
    const pollInterval = setInterval(() => {
      pollCount++;
      voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        clearInterval(pollInterval);
        window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
        attemptSpeak();
      } else if (pollCount > 20) {
        // After 1 second, give up polling and try to speak anyway
        clearInterval(pollInterval);
        window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
        // Try to speak without a specific voice (browser default)
        if (!hasSpoken) {
          hasSpoken = true;
          doSpeak(undefined);
        }
      }
    }, 50);
    
    // Method 3: Immediate fallback for Firefox desktop
    // Firefox desktop sometimes has voices but getVoices() returns empty initially
    setTimeout(() => {
      voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        clearInterval(pollInterval);
        window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
        attemptSpeak();
      } else if (!hasSpoken && navigator.userAgent.includes("Firefox")) {
        // Firefox fallback: try speaking without voice selection
        // The browser should use its default Chinese voice
        clearInterval(pollInterval);
        window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
        hasSpoken = true;
        doSpeak(undefined);
      }
    }, 200);
  }
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
