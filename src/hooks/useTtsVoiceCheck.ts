import { useState, useEffect } from "react";
import { hasChineseVoice } from "../utils/tts";

export function useTtsVoiceCheck(): boolean {
  const [noVoice, setNoVoice] = useState(false);

  useEffect(() => {
    const check = () => { if (hasChineseVoice() === false) setNoVoice(true); };

    if (hasChineseVoice() === null) {
      window.speechSynthesis?.addEventListener("voiceschanged", check, { once: true });
      setTimeout(check, 1000);
    } else {
      check();
    }
  }, []);

  return noVoice;
}
