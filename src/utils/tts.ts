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
 * Speak Chinese text with automatic async voice loading.
 * Uses the same robust pattern as SpeakerButton to handle browsers where
 * getVoices() returns empty on first call.
 */
export function speakChinese(text: string, rate = 0.9, onEnd?: () => void): void {
  if (!("speechSynthesis" in window)) return;

  try { window.speechSynthesis.cancel(); } catch {}
  if (window.speechSynthesis.paused) window.speechSynthesis.resume();

  const doSpeak = (voice: SpeechSynthesisVoice | undefined) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "zh-CN";
    utter.rate = voice?.name.includes("Xiaoxiao") ? Math.min(rate, 0.85) : rate;
    utter.pitch = 1.0;
    utter.volume = 1;
    if (voice) utter.voice = voice;
    if (onEnd) utter.onend = onEnd;
    try { window.speechSynthesis.speak(utter); } catch {}
  };

  let voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    doSpeak(findChineseVoice(voices));
    return;
  }

  // Voices not yet loaded — wait for them
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    voices = window.speechSynthesis.getVoices();
    doSpeak(findChineseVoice(voices));
  };

  window.speechSynthesis.addEventListener("voiceschanged", go, { once: true });
  setTimeout(() => {
    voices = window.speechSynthesis.getVoices();
    if (voices.length > 0 && !done) go();
    else if (!done) { done = true; doSpeak(undefined); }
  }, 200);
}
