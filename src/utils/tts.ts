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
 * Speak Chinese text using the Web Speech API.
 *
 * onStart fires when the browser confirms speech has begun (utter.onstart).
 * onEnd   fires when speech finishes naturally or on a real error.
 *
 * "canceled" and "interrupted" are NOT forwarded to onEnd because they are
 * triggered by our own cancel() call or a subsequent speak() replacing this
 * one — neither is a real failure.
 *
 * If the first attempt errors with any other code (e.g. "synthesis-failed" or
 * "network" from an online Microsoft voice), we automatically retry once
 * without pinning a specific voice, letting the browser fall back to whatever
 * it can use. This handles transient cloud-voice failures.
 */
export function speakChinese(
  text: string,
  rate = 0.9,
  onEnd?: () => void,
  onStart?: () => void,
): void {
  if (!("speechSynthesis" in window)) return;

  const ss = window.speechSynthesis;

  // Resume before cancel: Chrome on Windows can get stuck in a paused state.
  if (ss.paused) { try { ss.resume(); } catch {} }
  try { ss.cancel(); } catch {}

  const attempt = (voice: SpeechSynthesisVoice | undefined, isRetry: boolean) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "zh-CN";
    utter.rate = voice?.name.includes("Xiaoxiao") ? Math.min(rate, 0.85) : rate;
    utter.pitch = 1.0;
    utter.volume = 1;
    if (voice) utter.voice = voice;

    utter.onstart = () => { onStart?.(); };
    utter.onend  = () => { onEnd?.(); };
    utter.onerror = (e: SpeechSynthesisErrorEvent) => {
      console.warn(`[TTS] error="${e.error}" voice="${voice?.name ?? "default"}" retry=${isRetry}`);
      if (e.error === "canceled" || e.error === "interrupted") return;
      if (!isRetry) {
        // First failure: retry without a pinned voice (browser picks its default).
        console.warn("[TTS] retrying without specific voice…");
        setTimeout(() => attempt(undefined, true), 100);
      } else {
        // Second failure: give up and reset caller state.
        onEnd?.();
      }
    };

    // 150 ms lets Chrome on Windows fully process the preceding cancel() before
    // the new utterance is queued. Retry uses 100 ms (cancel already settled).
    setTimeout(() => { try { ss.speak(utter); } catch {} }, isRetry ? 100 : 150);
  };

  let voices = ss.getVoices();
  if (voices.length > 0) {
    attempt(findChineseVoice(voices), false);
    return;
  }

  // Voices not yet loaded — wait for voiceschanged or fall back after 200 ms.
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    voices = ss.getVoices();
    attempt(findChineseVoice(voices), false);
  };

  ss.addEventListener("voiceschanged", go, { once: true });
  setTimeout(() => {
    voices = ss.getVoices();
    if (voices.length > 0 && !done) go();
    else if (!done) { done = true; attempt(undefined, false); }
  }, 200);
}
