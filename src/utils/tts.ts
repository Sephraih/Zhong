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
  if ("speechSynthesis" in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", () => {
      window.speechSynthesis.getVoices(); // cache on event too
    }, { once: true });
  }
}

/**
 * Speak Chinese text using the Web Speech API.
 *
 * onStart – fires when the browser confirms playback has begun (utter.onstart)
 * onEnd   – fires when playback finishes naturally or on non-recoverable error
 *
 * Browser differences handled here:
 *
 * Chrome/Edge
 *   • resume() before cancel() resets the engine after natural completion
 *     (Chrome silently drops new speak() calls after onend without this).
 *   • 10 ms delay breaks the synchronous cancel→speak frame that caused
 *     "canceled" errors.
 *   • Leading   (NBSP) gives the audio pipeline one frame to initialise
 *     before the first real syllable, preventing the leading-character cutoff.
 *   • Silent-drop watchdog: if onstart hasn't fired 700 ms after speak(),
 *     the utterance was quietly dropped — retry with the browser default voice.
 *
 * Firefox
 *   • speak() called inside setTimeout() breaks Firefox's per-call user-gesture
 *     requirement; requestAnimationFrame() stays within the gesture context.
 *   • Firefox does not have the cancel→speak race condition, so cancel() is
 *     skipped before the first attempt to avoid interfering with its pipeline.
 *   • Voices load asynchronously; primeVoices() should be called at mount so
 *     they are cached by the time the user clicks Play.
 */
export function speakChinese(
  text: string,
  rate = 0.9,
  onEnd?: () => void,
  onStart?: () => void,
): void {
  if (!("speechSynthesis" in window)) return;

  const ss = window.speechSynthesis;
  const isFirefox = /Firefox\//.test(navigator.userAgent);

  // Chrome/Edge: resume() un-sticks the engine after natural playback ends,
  // then cancel() clears any leftover queue.
  // Firefox: skip both — they can interfere with Firefox's own pipeline init.
  if (!isFirefox) {
    try { ss.resume(); } catch {}
    try { ss.cancel(); } catch {}
  }

  let retried = false;

  const attempt = (voice: SpeechSynthesisVoice | undefined, isRetry: boolean) => {
    // Prepend NBSP on Chrome/Edge: gives the audio subsystem one animation frame
    // to initialise before the first real character, preventing the leading-char
    // cutoff. Omit on Firefox where it is unnecessary.
    const utter = new SpeechSynthesisUtterance((isFirefox ? "" : " ") + text);
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

    const doSpeak = () => { try { ss.speak(utter); } catch {} };

    if (isFirefox) {
      // requestAnimationFrame keeps us within Firefox's user-gesture activation.
      // On retry (no longer in gesture context), fall back to a short setTimeout.
      if (isRetry) setTimeout(doSpeak, 50); else requestAnimationFrame(doSpeak);
    } else {
      // 10 ms separates cancel() from speak() without noticeable latency.
      // Retry gets 50 ms to let the cancel() in doRetry() settle first.
      setTimeout(doSpeak, isRetry ? 50 : 10);
    }

    // Chrome/Edge silent-drop watchdog: if onstart never fires within 700 ms
    // the utterance was quietly discarded — retry once with the default voice.
    if (!isRetry) {
      setTimeout(() => { if (!started) doRetry(); }, 700);
    }
  };

  const doRetry = () => {
    if (retried) return; // at most one retry per speakChinese() call
    retried = true;
    setTimeout(() => {
      try { ss.cancel(); } catch {}
      attempt(undefined, true);
    }, 80);
  };

  const go = (voices: SpeechSynthesisVoice[]) => attempt(findChineseVoice(voices), false);

  const voices = ss.getVoices();
  if (voices.length > 0) { go(voices); return; }

  // Voices not yet loaded (first page load, especially Firefox).
  // Poll every 50 ms for up to 1 s; voiceschanged fires first on most browsers.
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
