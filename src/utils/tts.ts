function findChineseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  return (
    voices.find((v) => v.name.includes("Xiaoxiao")) ||
    voices.find((v) => v.name.includes("Huihui")) ||
    voices.find((v) => v.name.includes("Kangkang")) ||
    voices.find((v) => v.name.includes("Google") && v.lang.startsWith("zh")) ||
    voices.find((v) => v.name.toLowerCase().includes("chinese")) ||
    voices.find((v) => v.name.toLowerCase().includes("mandarin")) ||
    voices.find((v) => v.lang === "zh-CN") ||
    voices.find((v) => v.lang === "zh-TW") ||
    voices.find((v) => v.lang.startsWith("zh"))
  );
}

/**
 * Call this once at app mount (no user gesture needed) so voices are already
 * cached by the time the user clicks Play. Critical for Firefox on Windows.
 */
export function primeVoices(): void {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    window.speechSynthesis.getVoices();
  }, { once: true });
}

/**
 * Returns true if at least one Chinese-capable voice is loaded.
 * Returns false if voices are loaded but none match Chinese.
 * Returns null if voices haven't loaded yet.
 */
export function hasChineseVoice(): boolean | null {
  if (!("speechSynthesis" in window)) return false;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  return !!findChineseVoice(voices);
}

/**
 * Speak Chinese text using the Web Speech API.
 *
 * onStart    – fires when the browser confirms playback has begun
 * onEnd      – fires when playback finishes or on non-recoverable error
 * onBoundary – fires at each word boundary with the character offset into `text`
 *
 * Browser differences handled here:
 *
 * Chrome/Edge
 *   • resume() + cancel() reset the engine after natural completion.
 *   • 10 ms delay separates cancel() from speak() to avoid "canceled" errors.
 *   • Leading space gives the audio pipeline time to init before the first char.
 *   • Silent-drop watchdog retries if onstart never fires within 700 ms.
 *
 * Firefox
 *   • speak() MUST be called synchronously within the user gesture — setTimeout
 *     and requestAnimationFrame both break Firefox's per-call activation check.
 *   • cancel() is skipped before first attempt (Firefox has no race condition).
 *   • primeVoices() must be called at app mount so getVoices() returns
 *     synchronously here, allowing the synchronous speak() path to run.
 */
export function speakChinese(
  text: string,
  rate = 0.9,
  onEnd?: () => void,
  onStart?: () => void,
  onBoundary?: (charIndex: number) => void,
): void {
  if (!("speechSynthesis" in window)) return;

  const ss = window.speechSynthesis;
  const isFirefox = /Firefox\//.test(navigator.userAgent);

  if (!isFirefox) {
    try { ss.resume(); } catch {}
    try { ss.cancel(); } catch {}
  }

  let retried = false;

  const attempt = (voice: SpeechSynthesisVoice | undefined, isRetry: boolean) => {
    // Chrome/Edge: prepend a space so the audio pipeline initialises before the
    // first real character (prevents leading-char cutoff). Not needed on Firefox.
    const prefix = isFirefox ? "" : " ";
    const utter = new SpeechSynthesisUtterance(prefix + text);
    utter.lang = "zh-CN";
    utter.rate = voice?.name.includes("Xiaoxiao") ? Math.min(rate, 0.85) : rate;
    utter.pitch = 1.0;
    utter.volume = 1;
    if (voice) utter.voice = voice;

    let started = false;
    utter.onstart = () => { started = true; onStart?.(); };
    utter.onend   = () => { onEnd?.(); };
    utter.onerror = (e: SpeechSynthesisErrorEvent) => {
      console.warn(`[TTS] error="${e.error}" voice="${voice?.name ?? "default"}" retry=${isRetry}`);
      if (e.error === "canceled" || e.error === "interrupted") return;
      doRetry();
    };
    if (onBoundary) {
      utter.onboundary = (e: SpeechSynthesisEvent) => {
        if (e.name === "word") {
          // Subtract prefix length so callers receive an index into the original text.
          onBoundary(Math.max(0, e.charIndex - prefix.length));
        }
      };
    }

    const doSpeak = () => { try { ss.speak(utter); } catch {} };

    if (isFirefox) {
      // Firefox requires speak() to be called synchronously within the user
      // gesture activation. setTimeout (even 0 ms) and requestAnimationFrame
      // both lose the activation context. On retry we are already outside the
      // gesture so a short delay is unavoidable.
      if (isRetry) setTimeout(doSpeak, 50); else doSpeak();
    } else {
      setTimeout(doSpeak, isRetry ? 50 : 10);
    }

    if (!isRetry) {
      setTimeout(() => { if (!started) doRetry(); }, 700);
    }
  };

  const doRetry = () => {
    if (retried) return;
    retried = true;
    setTimeout(() => {
      try { ss.cancel(); } catch {}
      attempt(undefined, true);
    }, 80);
  };

  const go = (voices: SpeechSynthesisVoice[]) => attempt(findChineseVoice(voices), false);

  const voices = ss.getVoices();
  if (voices.length > 0) { go(voices); return; }

  if (isFirefox) {
    // No voices loaded yet but we're still in the gesture context.
    // Speak immediately without a pinned voice — Firefox will use its default.
    // (primeVoices() at app mount means this fallback is rarely reached.)
    attempt(undefined, false);
    return;
  }

  // Chrome/Edge async voice loading (rare — normally voices are cached after
  // the first getVoices() call or a prior primeVoices() call).
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    clearInterval(pollId);
    go(ss.getVoices());
  };

  ss.addEventListener("voiceschanged", finish, { once: true });

  let ticks = 0;
  const pollId = setInterval(() => {
    if (ss.getVoices().length > 0) { finish(); return; }
    if (++ticks >= 20) { clearInterval(pollId); if (!done) { done = true; attempt(undefined, false); } }
  }, 50);
}
