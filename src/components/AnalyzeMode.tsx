import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import type { VocabWord } from "../data/vocabulary";
import { buildDictionarySet, buildLookupMap, enrichTokens } from "../utils/analyzeUtils";
import { segmentText, type Token } from "../utils/segment";
import { HoverCharacter } from "./HoverCharacter";
import { useCardStore, type CustomCard } from "../hooks/useCardStore";
import { useIsMobile } from "../hooks/useIsMobile";
import { useAuth } from "../contexts/AuthContext";
import { speakChinese, primeVoices } from "../utils/tts";
import { useTtsVoiceCheck } from "../hooks/useTtsVoiceCheck";
import { TtsVoiceWarning } from "./TtsVoiceWarning";

interface AnalyzeModeProps {
  vocabulary: VocabWord[];
  onPremiumRequired: () => void;
  onNavigateToSupport?: () => void;
}

let _persistedText = "";
let _persistedTokens: EnrichedToken[] = [];

interface EnrichedToken extends Token {
  wordId: string;
  vocabMatches: VocabWord[];
}

const RATES = [0.75, 1, 1.25] as const;
type Rate = (typeof RATES)[number];
const LONG_PRESS_MS = 480;

// ── Dictionary Panel ──────────────────────────────────────────────────────────

interface DictPanelProps {
  token: EnrichedToken | null;
  store: ReturnType<typeof useCardStore>;
  isPremium: boolean;
  isLoggedIn: boolean;
  onClose: () => void;
  onReadFromHere: () => void;
  onPremiumRequired: () => void;
}

function DictPanel({ token, store, isPremium, isLoggedIn, onClose, onReadFromHere, onPremiumRequired }: DictPanelProps) {
  const [savedCard, setSavedCard] = useState(false);
  useEffect(() => { setSavedCard(false); }, [token?.text]);

  if (!token || !token.isHanzi) return null;
  const word = token.vocabMatches[0];

  const hskBadgeColors: Record<number, string> = {
    1: "bg-emerald-900/60 text-emerald-300 border-emerald-700/40",
    2: "bg-blue-900/60 text-blue-300 border-blue-700/40",
    3: "bg-purple-900/60 text-purple-300 border-purple-700/40",
    4: "bg-yellow-900/60 text-yellow-300 border-yellow-700/40",
    5: "bg-orange-900/60 text-orange-300 border-orange-700/40",
    6: "bg-red-900/60 text-red-300 border-red-700/40",
  };

  // HSK 2+ words require premium; non-HSK words are always saveable
  const requiresPremium = word && word.hskLevel > 1 && !isPremium;

  const handleAddToCards = () => {
    if (requiresPremium) {
      onPremiumRequired();
      return;
    }
    const draft: Omit<CustomCard, "id" | "createdAt"> = {
      hanzi: token.text,
      pinyin: token.pinyin,
      english: word?.english ?? "",
      learned: false,
      examples: [],
    };
    store.addCard(draft);
    setSavedCard(true);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <span className="text-5xl text-white font-medium">{token.text}</span>
          <p className="text-red-400 text-lg mt-1">{token.pinyin || "—"}</p>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-xl p-1">✕</button>
      </div>

      {word ? (
        <>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {word.hskLevel && (
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${hskBadgeColors[word.hskLevel] ?? ""}`}>
                HSK {word.hskLevel}
              </span>
            )}
            {word.category && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-gray-400 border border-neutral-700">
                {word.category}
              </span>
            )}
          </div>
          <p className="text-white font-medium mb-4">{word.english}</p>

          {word.examples.length > 0 && (
            <div className="space-y-3 mb-4 flex-1 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Examples</p>
              {word.examples.slice(0, 3).map((ex, i) => (
                <div key={i} className="bg-neutral-800/60 rounded-xl p-3">
                  <div className="flex flex-wrap gap-0.5 mb-1">
                    {ex.pinyinWords.map((pw, j) => (
                      <HoverCharacter key={j} char={pw.char} pinyin={pw.pinyin} size="sm" wordId={`dict_${token.text}_${i}`} />
                    ))}
                  </div>
                  <p className="text-gray-500 text-xs">{ex.english}</p>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-500 text-sm mb-4">Not found in HSK vocabulary</p>
      )}

      <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-neutral-800">
        <button
          onClick={onReadFromHere}
          className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-sm font-medium rounded-xl border border-neutral-700 transition-colors"
        >
          ▶ Read from here
        </button>
        {savedCard ? (
          <div className="w-full py-2 text-center text-emerald-400 text-sm font-medium">✓ Saved to My Cards</div>
        ) : requiresPremium ? (
          <button
            onClick={onPremiumRequired}
            className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 border border-yellow-700/40 text-yellow-400 text-sm font-semibold rounded-xl transition-colors"
          >
            🔒 Unlock Premium to add
          </button>
        ) : !isLoggedIn ? (
          <button
            onClick={onPremiumRequired}
            className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-400 text-sm font-semibold rounded-xl transition-colors border border-neutral-700"
          >
            Sign in to save cards
          </button>
        ) : (
          <button
            onClick={handleAddToCards}
            className="w-full py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            + Add to My Cards
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AnalyzeMode({ vocabulary, onPremiumRequired, onNavigateToSupport }: AnalyzeModeProps) {
  const store = useCardStore();
  const isMobile = useIsMobile();
  const { user, accountTier } = useAuth();
  const isLoggedIn = !!user;
  const isPremium = accountTier === "premium";

  const dictionarySet = useMemo(() => buildDictionarySet(vocabulary), [vocabulary]);
  const lookupMap = useMemo(() => buildLookupMap(vocabulary), [vocabulary]);

  const [inputText, setInputText] = useState(_persistedText);
  const [tokens, setTokens] = useState<EnrichedToken[]>(_persistedTokens);
  const [analyzed, setAnalyzed] = useState(_persistedTokens.length > 0);
  const [selectedToken, setSelectedToken] = useState<EnrichedToken | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);
  const [rate, setRate] = useState<Rate>(1);
  const [showDrawer, setShowDrawer] = useState(false);
  const noChineseVoice = useTtsVoiceCheck();

  // ── Interaction state ─────────────────────────────────────────────────────
  // Desktop: pointer position for click-vs-drag detection
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  // Mobile: long press detection
  const lpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lpStartPos = useRef<{ x: number; y: number } | null>(null);
  // When a long press fires, suppress the subsequent touchend on HoverCharacter
  const suppressNextTouchEnd = useRef(false);

  const handleTokenClick = useCallback((token: EnrichedToken) => {
    if (!token.isHanzi) return;
    setSelectedToken(token);
    if (isMobile) setShowDrawer(true);
  }, [isMobile]);

  const cancelLongPress = () => {
    if (lpTimer.current) { clearTimeout(lpTimer.current); lpTimer.current = null; }
    lpStartPos.current = null;
  };

  // ── Analysis ──────────────────────────────────────────────────────────────

  const analyze = useCallback(() => {
    if (!inputText.trim()) return;
    const raw = segmentText(inputText, dictionarySet);
    const enriched = enrichTokens(raw, lookupMap);
    const result: EnrichedToken[] = enriched.map((t, i) => ({
      ...t,
      wordId: `${i}_${t.text}`,
      vocabMatches: t.isHanzi ? (lookupMap.get(t.text) ?? []) : [],
    }));
    setTokens(result);
    setAnalyzed(true);
    _persistedText = inputText;
    _persistedTokens = result;
  }, [inputText, dictionarySet, lookupMap]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); analyze(); }
  };

  // ── TTS ───────────────────────────────────────────────────────────────────

  // Tracks word position when paused so Resume can restart from the same token.
  const pausedAtRef = useRef<string | null>(null);

  // Speak from a given wordId (or from the beginning if null).
  const speakFrom = useCallback((startWordId: string | null) => {
    const idx = startWordId ? tokens.findIndex((t) => t.wordId === startWordId) : -1;
    const slice = tokens.slice(idx < 0 ? 0 : idx);
    const charMap: string[] = [];
    slice.forEach((t) => { for (let i = 0; i < t.text.length; i++) charMap.push(t.wordId); });
    speakChinese(
      slice.map((t) => t.text).join(""), rate,
      () => { setIsPlaying(false); setPlayingWordId(null); },
      () => setIsPlaying(true),
      (ci) => { const id = charMap[ci]; if (id !== undefined) setPlayingWordId(id); },
    );
  }, [tokens, rate]);

  const handlePlayAll = () => speakFrom(null);

  const handlePause = () => {
    // cancel() stops audio immediately; pause() waits for the current audio
    // chunk to drain which feels slow. We record the last highlighted word
    // so Resume can restart from the same position.
    pausedAtRef.current = playingWordId;
    window.speechSynthesis.cancel();
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
    speakFrom(pausedAtRef.current);
    pausedAtRef.current = null;
  };

  const handleStop = () => {
    pausedAtRef.current = null;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setPlayingWordId(null);
  };

  const handleReadFromHere = useCallback(() => {
    if (!selectedToken) return;
    speakFrom(selectedToken.wordId);
    if (isMobile) setShowDrawer(false);
  }, [selectedToken, speakFrom, isMobile]);

  const closePanel = () => { setSelectedToken(null); setShowDrawer(false); };

  useEffect(() => {
    primeVoices();
    return () => { window.speechSynthesis.cancel(); cancelLongPress(); };
  }, []);

  // ── Token event handlers ─────────────────────────────────────────────────
  //
  // Desktop: click-to-open dictionary.
  //   onPointerDownCapture + onPointerUpCapture (capture phase → fires before
  //   HoverCharacter's onClick → stopPropagation).
  //
  // Mobile: long press (480 ms) → opens dictionary.
  //   Short tap → HoverCharacter handles it (pinyin toggle).
  //   Key insight: we need CAPTURE handlers because HoverCharacter calls
  //   stopPropagation() in both touchStart and touchEnd.
  //   – onTouchStartCapture: start timer
  //   – onTouchMoveCapture: cancel timer if finger moved (scroll)
  //   – onTouchEndCapture:
  //       if suppressNextTouchEnd set → stop propagation (HoverCharacter
  //         won't toggle) and reset flag
  //       else → cancel pending timer (was a short tap; let HoverCharacter fire)

  const makeTokenHandlers = useCallback((token: EnrichedToken) => {
    if (!token.isHanzi) return {};

    if (isMobile) {
      return {
        onTouchStartCapture: (e: React.TouchEvent) => {
          cancelLongPress();
          const touch = e.touches[0];
          lpStartPos.current = { x: touch.clientX, y: touch.clientY };
          lpTimer.current = setTimeout(() => {
            lpTimer.current = null;
            lpStartPos.current = null;
            suppressNextTouchEnd.current = true;
            handleTokenClick(token);
          }, LONG_PRESS_MS);
        },
        onTouchMoveCapture: (e: React.TouchEvent) => {
          if (!lpTimer.current || !lpStartPos.current) return;
          const t = e.touches[0];
          const dx = Math.abs(t.clientX - lpStartPos.current.x);
          const dy = Math.abs(t.clientY - lpStartPos.current.y);
          if (dx > 8 || dy > 8) cancelLongPress();
        },
        onTouchEndCapture: (e: React.TouchEvent) => {
          if (suppressNextTouchEnd.current) {
            // Long press already fired — prevent HoverCharacter's pinyin toggle
            e.stopPropagation();
            e.preventDefault();
            suppressNextTouchEnd.current = false;
          } else {
            // Short press — cancel the pending timer; HoverCharacter handles it
            cancelLongPress();
          }
        },
        onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
      };
    }

    // Desktop
    return {
      onPointerDownCapture: (e: React.PointerEvent) => {
        pointerStart.current = { x: e.clientX, y: e.clientY };
      },
      onPointerUpCapture: (e: React.PointerEvent) => {
        if (!pointerStart.current) return;
        const dx = Math.abs(e.clientX - pointerStart.current.x);
        const dy = Math.abs(e.clientY - pointerStart.current.y);
        pointerStart.current = null;
        if (dx < 12 && dy < 12) handleTokenClick(token);
      },
    };
  }, [isMobile, handleTokenClick]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">🔍 Analyze</h2>
        <p className="text-gray-400 text-sm">Paste Chinese text to reveal pinyin, look up words, and listen</p>
      </div>

      {!analyzed ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={"Paste Chinese text here…\n\nExample: 你好，我叫小明，我是学生。"}
            rows={8}
            className="w-full bg-transparent text-white text-lg placeholder-gray-600 resize-none focus:outline-none leading-relaxed"
          />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-800">
            <p className="text-gray-600 text-xs">Ctrl+Enter to analyze</p>
            <button
              onClick={analyze}
              disabled={!inputText.trim()}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Analyze →
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 min-w-0">
            {/* TTS controls */}
            {noChineseVoice && <TtsVoiceWarning onMoreInfo={onNavigateToSupport} />}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 mb-3 flex items-center gap-2 flex-wrap">
              {!isPlaying ? (
                <button
                  onClick={handlePlayAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  Play All
                </button>
              ) : isPaused ? (
                <>
                  <button
                    onClick={handleResume}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    Resume
                  </button>
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" /></svg>
                    Stop
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handlePause}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="5" y="5" width="4" height="14" /><rect x="15" y="5" width="4" height="14" /></svg>
                    Pause
                  </button>
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" /></svg>
                    Stop
                  </button>
                </>
              )}
              <div className="flex gap-1">
                {RATES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRate(r)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      rate === r ? "bg-neutral-700 border-neutral-600 text-white" : "bg-transparent border-neutral-800 text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {r}×
                  </button>
                ))}
              </div>
              <div className="ml-auto">
                <button
                  onClick={() => { setAnalyzed(false); setSelectedToken(null); _persistedTokens = []; }}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  ← Edit text
                </button>
              </div>
            </div>

            {/* Token rendering */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
              <div className="flex flex-wrap gap-x-0.5 gap-y-5 leading-none">
                {tokens.map((token, i) => {
                  if (!token.isHanzi) {
                    return (
                      <span key={i} className="text-gray-400 text-2xl self-end pb-1">
                        {token.text}
                      </span>
                    );
                  }
                  const chars = token.text.split("");
                  const pinyins = token.pinyin ? token.pinyin.split(" ") : [];
                  return (
                    <div
                      key={i}
                      {...makeTokenHandlers(token)}
                      className={`inline-flex items-end gap-0.5 rounded-lg p-0.5 transition-colors select-none ${
                        playingWordId === token.wordId
                          ? "bg-amber-400/25 ring-1 ring-amber-400/50"
                          : selectedToken?.wordId === token.wordId
                          ? "bg-red-600/20 ring-1 ring-red-600/40"
                          : isMobile
                          ? ""
                          : "hover:bg-neutral-800/60 cursor-pointer"
                      }`}
                    >
                      {chars.map((char, ci) => (
                        <HoverCharacter
                          key={ci}
                          char={char}
                          pinyin={pinyins[ci] ?? ""}
                          size="lg"
                          wordId={token.wordId}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
              <p className="text-gray-600 text-xs mt-4">
                {isMobile
                  ? "Tap to reveal pinyin · Long press to look up in dictionary"
                  : "Hover characters for pinyin · Click to look up in dictionary"}
              </p>
            </div>
          </div>

          {/* Desktop dictionary panel */}
          {!isMobile && (
            <div className="lg:w-72 flex-shrink-0">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 lg:sticky lg:top-4 min-h-48">
                {selectedToken ? (
                  <DictPanel token={selectedToken} store={store} isPremium={isPremium} isLoggedIn={isLoggedIn} onClose={closePanel} onReadFromHere={handleReadFromHere} onPremiumRequired={onPremiumRequired} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-600 text-sm text-center">
                    <span className="text-3xl mb-2">👆</span>
                    Click a word to see its definition
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile bottom drawer */}
      {isMobile && showDrawer && selectedToken && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={closePanel} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-900 border-t border-neutral-800 rounded-t-2xl p-5 pb-8 max-h-[70vh] overflow-y-auto">
            <div className="w-10 h-1 bg-neutral-700 rounded-full mx-auto mb-4" />
            <DictPanel token={selectedToken} store={store} isPremium={isPremium} isLoggedIn={isLoggedIn} onClose={closePanel} onReadFromHere={handleReadFromHere} onPremiumRequired={onPremiumRequired} />
          </div>
        </>
      )}
    </div>
  );
}
