import { useState, useMemo, useCallback } from "react";
import type { VocabWord } from "../data/vocabulary";
import {
  SYLLABLE_TABLE,
  INITIALS,
  TONES,
  TONE_DISPLAY,
  buildSyllable,
  randomSyllable,
  type Tone,
} from "../utils/pinyinChart";
import { extractPinyinForChar } from "../utils/pinyinUtils";
import { speakChinese } from "../utils/tts";

interface PinyinModeProps {
  vocabulary: VocabWord[];
}

const INITIAL_DISPLAY: Record<string, string> = { "": "zero" };

function getInitialLabel(initial: string) {
  return initial === "" ? "∅" : initial;
}

// Build syllable → example hanzi map from vocabulary
function buildHanziMap(words: VocabWord[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const word of words) {
    const chars = word.hanzi.split("");
    for (let i = 0; i < chars.length; i++) {
      const syllable = extractPinyinForChar(word.pinyin, i, chars.length);
      if (syllable && !map.has(syllable)) {
        map.set(syllable, chars[i]);
      }
    }
  }
  return map;
}

function speakSyllable(syllable: string, hanziMap: Map<string, string>) {
  // Speak the example hanzi character (not the tone-marked pinyin text),
  // because zh-CN TTS reads pinyin as Latin letters without tones.
  const hanzi = hanziMap.get(syllable) ?? syllable;
  speakChinese(hanzi, 0.75);
}

export function PinyinMode({ vocabulary }: PinyinModeProps) {
  const hanziMap = useMemo(() => buildHanziMap(vocabulary), [vocabulary]);

  const [selectedInitial, setSelectedInitial] = useState<string>("b");
  const [selectedFinal, setSelectedFinal] = useState<string>("a");
  const [selectedTone, setSelectedTone] = useState<Tone>(1);

  const finals = useMemo(() => SYLLABLE_TABLE[selectedInitial] ?? [], [selectedInitial]);

  const handleInitialSelect = useCallback(
    (initial: string) => {
      setSelectedInitial(initial);
      const newFinals = SYLLABLE_TABLE[initial] ?? [];
      setSelectedFinal(newFinals[0] ?? "");
      setSelectedTone(1);
    },
    []
  );

  const handleFinalSelect = useCallback((final: string) => {
    setSelectedFinal(final);
    setSelectedTone(1);
  }, []);

  const syllable = useMemo(
    () => buildSyllable(selectedInitial, selectedFinal, selectedTone),
    [selectedInitial, selectedFinal, selectedTone]
  );

  const exampleHanzi = hanziMap.get(syllable);

  const handlePlay = useCallback(() => {
    speakSyllable(syllable, hanziMap);
  }, [syllable, hanziMap]);

  const handleRandom = useCallback(() => {
    const { initial, final, tone } = randomSyllable();
    setSelectedInitial(initial);
    setSelectedFinal(final);
    setSelectedTone(tone);
    // Speak after state settles
    setTimeout(() => {
      const s = buildSyllable(initial, final, tone);
      speakSyllable(s, hanziMap);
    }, 50);
  }, [hanziMap]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">🔤 Pinyin Builder</h2>
        <p className="text-gray-400">Select an initial, final, and tone to build a syllable</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Pickers */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-4 lg:w-80">

          {/* Initial */}
          <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Initial</p>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
              {INITIALS.map((initial) => (
                <button
                  key={initial}
                  onClick={() => handleInitialSelect(initial)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-mono font-medium transition-all border ${
                    selectedInitial === initial
                      ? "bg-red-600 border-red-500 text-white"
                      : "bg-neutral-800 border-neutral-700 text-gray-300 hover:border-neutral-600 hover:text-white"
                  }`}
                >
                  {getInitialLabel(initial)}
                </button>
              ))}
            </div>
          </div>

          {/* Final */}
          <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Final</p>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
              {finals.map((final) => (
                <button
                  key={final}
                  onClick={() => handleFinalSelect(final)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-mono font-medium transition-all border ${
                    selectedFinal === final
                      ? "bg-red-600 border-red-500 text-white"
                      : "bg-neutral-800 border-neutral-700 text-gray-300 hover:border-neutral-600 hover:text-white"
                  }`}
                >
                  {final}
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tone</p>
            <div className="flex gap-2">
              {TONES.map((tone, i) => (
                <button
                  key={tone}
                  onClick={() => setSelectedTone(tone)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border ${
                    selectedTone === tone
                      ? "bg-red-600 border-red-500 text-white"
                      : "bg-neutral-800 border-neutral-700 text-gray-300 hover:border-neutral-600 hover:text-white"
                  }`}
                >
                  {TONE_DISPLAY[i]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Display card */}
        <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-6 min-h-64">
          <div className="text-center">
            <p className="text-8xl font-bold text-red-400 font-mono tracking-widest mb-2">
              {syllable}
            </p>
            {exampleHanzi ? (
              <p className="text-6xl text-white mt-4">{exampleHanzi}</p>
            ) : (
              <p className="text-gray-600 text-sm mt-4">No example character found</p>
            )}
            <p className="text-gray-500 text-sm mt-3">
              {selectedInitial === "" ? "zero initial" : `initial: ${selectedInitial}`}
              {" · "}
              {`final: ${selectedFinal}`}
              {" · "}
              {`tone ${selectedTone === 5 ? "neutral (·)" : selectedTone}`}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play
            </button>
            <button
              onClick={handleRandom}
              className="flex items-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-gray-200 font-semibold rounded-xl border border-neutral-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Random
            </button>
          </div>
        </div>
      </div>

      {/* Quick reference */}
      <div className="mt-8 bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tone marks quick reference</p>
        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
          {["ā á ǎ à — a", "ē é ě è — e", "ī í ǐ ì — i", "ō ó ǒ ò — o", "ū ú ǔ ù — u", "ǖ ǘ ǚ ǜ — ü"].map((ref) => (
            <span key={ref} className="font-mono">{ref}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
