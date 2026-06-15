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
 * onStart fires when the browser confirms playback has begun (utter.onstart).
 * onEnd   fires when playback finishes naturally or on a non-recoverable error.
 *
 * Design notes:
 * – Always call resume() before cancel() so Chrome/Edge un-sticks itself after
 *   natural playback ends (their engine can silently refuse new speak() calls
 *   until resume() is called, even when paused===false).
 * – "canceled"/"interrupted" onerror codes are swallowed; they are triggered
 *   by our own cancel() and never indicate a real failure.
 * – On first failure with any other error code, we retry once without a pinned
 *   voice (browser picks its own default) to recover from transient cloud-voice
 *   errors (Microsoft Xiaoxiao Online requires Azure connectivity).
 * – Delay before speak() is 10 ms on Chrome/Edge (just enough to break the
 *   synchronous cancel→speak frame) and 50 ms on Firefox.
 * – Voice loading uses both the voiceschanged event and a 50 ms poll, since
 *   Firefox can be slow to expose voices via getVoices() after the event fires.
 */
export function speakChinese(
  text: string,
  rate = 0.9,
  onEnd?: () => void,
  onStart?: () => void,
): void {
  if (!("speechSynthesis" in window)) return;

  const ss = window.speechSynthesis;
  const isFirefox = navigator.userAgent.includes("Firefox");

  // Always resume first, even if paused===false. Chrome/Edge can get into a
  // state after natural playback where new speak() calls are silently dropped;
  // resume() forces the engine back to a ready state.
  try { ss.resume(); } catch {}
  try { ss.cancel(); } catch {}

  const attempt = (voice: SpeechSynthesisVoice | undefined, isRetry: boolean) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "zh-CN";
    utter.rate = voice?.name.includes("Xiaoxiao") ? Math.min(rate, 0.85) : rate;
    utter.pitch = 1.0;
    utter.volume = 1;
    if (voice) utter.voice = voice;

    utter.onstart = () => { onStart?.(); };
    utter.onend   = () => { onEnd?.(); };
    utter.onerror = (e: SpeechSynthesisErrorEvent) => {
      console.warn(`[TTS] error="${e.error}" voice="${voice?.name ?? "default"}" retry=${isRetry}`);
      if (e.error === "canceled" || e.error === "interrupted") return;
      if (!isRetry) {
        // Retry without a pinned voice; cancel first to reset engine state.
        setTimeout(() => {
          try { ss.resume(); } catch {}
          try { ss.cancel(); } catch {}
          attempt(undefined, true);
        }, 100);
      } else {
        onEnd?.(); // Both attempts failed — reset caller state.
      }
    };

    // 10 ms on Chrome/Edge: just enough to break the cancel→speak sync frame.
    // 50 ms on Firefox: Firefox's synthesis pipeline needs a bit more runway.
    const delay = isRetry ? 50 : (isFirefox ? 50 : 10);
    setTimeout(() => { try { ss.speak(utter); } catch {} }, delay);
  };

  const go = (voices: SpeechSynthesisVoice[]) => attempt(findChineseVoice(voices), false);

  let voices = ss.getVoices();
  if (voices.length > 0) { go(voices); return; }

  // Voices not yet loaded. Poll every 50 ms (Firefox can expose voices slowly
  // even after voiceschanged fires) and fall back to no-voice after ~1 s.
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
    voices = ss.getVoices();
    if (voices.length > 0) { finish(); return; }
    if (++ticks >= 20) { // 1 second of polling
      clearInterval(pollId);
      if (!done) { done = true; attempt(undefined, false); }
    }
  }, 50);
}
