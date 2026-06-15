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

export function speakChinese(text: string, rate = 0.9, onEnd?: () => void): void {
  if (!("speechSynthesis" in window)) return;

  const ss = window.speechSynthesis;

  // Resume before cancel: Chrome on Windows can get stuck in a paused state;
  // resuming first unsticks the engine, then cancel clears any queued speech.
  if (ss.paused) { try { ss.resume(); } catch {} }
  try { ss.cancel(); } catch {}

  const doSpeak = (voice: SpeechSynthesisVoice | undefined) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "zh-CN";
    utter.rate = voice?.name.includes("Xiaoxiao") ? Math.min(rate, 0.85) : rate;
    utter.pitch = 1.0;
    utter.volume = 1;
    if (voice) utter.voice = voice;
    if (onEnd) {
      utter.onend = onEnd;
      // "canceled" fires when cancel() hits our own utterance (Chrome race condition).
      // "interrupted" fires when a newer speak() call replaces this one.
      // Neither means a real failure — don't reset UI state for them.
      utter.onerror = (e: SpeechSynthesisErrorEvent) => {
        if (e.error !== "canceled" && e.error !== "interrupted") onEnd();
      };
    }
    // 150 ms gives Chrome on Windows enough time to fully process cancel()
    // before the new utterance is queued; 50 ms was consistently too short.
    setTimeout(() => {
      try { ss.speak(utter); } catch {}
    }, 150);
  };

  let voices = ss.getVoices();
  if (voices.length > 0) {
    doSpeak(findChineseVoice(voices));
    return;
  }

  // Voices not yet loaded — wait for voiceschanged or fall back after 200 ms
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    voices = ss.getVoices();
    doSpeak(findChineseVoice(voices));
  };

  ss.addEventListener("voiceschanged", go, { once: true });
  setTimeout(() => {
    voices = ss.getVoices();
    if (voices.length > 0 && !done) go();
    else if (!done) { done = true; doSpeak(undefined); }
  }, 200);
}
