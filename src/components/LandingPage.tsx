import { useRef, useState, useEffect, useCallback } from "react";
import type { ReactElement, ReactNode } from "react";
import { HoverCharacter } from "./HoverCharacter";
import { useIsMobile } from "../hooks/useIsMobile";

// Logo image (ham.png) — imported via glob so the build doesn't fail if missing
const logoImages = import.meta.glob("../assets/ham.png", { eager: true, import: "default" }) as Record<string, string>;
const logoImage = Object.values(logoImages)[0] ?? null;

// Background images (expected in src/assets/):
//  - landscape.(jpg|jpeg|png|webp)  (desktop)
//  - portrait.(jpg|jpeg|png|webp)   (mobile)
//
// We intentionally use `import.meta.glob` so the app still compiles even if the
// images are not present (preview/sandbox). If missing, we fall back to black.
//
// NOTE: paths + filenames are case-sensitive.
const desktopBgExact = import.meta.glob("../assets/landscape.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const mobileBgExact = import.meta.glob("../assets/portrait.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const DESKTOP_BG_ASSET = Object.values(desktopBgExact)[0] ?? null;
const MOBILE_BG_ASSET = Object.values(mobileBgExact)[0] ?? null;

interface LandingPageProps {
  onSelectMode: (mode: "browse" | "practice" | "sentences" | "flashcards" | "quiz") => void;
}

type ModeId = "browse" | "practice" | "sentences" | "flashcards" | "quiz";

type SectionId = "hero" | ModeId | "footer";

function PreviewFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative rounded-[1.35rem] border-2 border-white/30 shadow-2xl ring-1 ring-white/10 overflow-hidden bg-neutral-950/80">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-neutral-950/80">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <span className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <div className="ml-3 text-xs text-gray-300 truncate">{title}</div>
          <div className="ml-auto w-20 h-6 rounded-md bg-white/5" />
        </div>
        <div className="bg-neutral-900/50">{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Previews (stylized to match the real UI)
// ─────────────────────────────────────────────────────────────────────────────

function BrowsePreview() {
  const [flipped, setFlipped] = useState(false);
  const [examplesOpen, setExamplesOpen] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFlipped(true), 1100);
    const t2 = setTimeout(() => setExamplesOpen(true), 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <PreviewFrame title="Browse · Vocabulary">
      <div className="p-4">
        <div className="flex gap-2 mb-4">
          <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-600 text-white">All</span>
          <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-neutral-900 border border-neutral-800 text-gray-400">HSK 1</span>
          <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-neutral-900 border border-neutral-800 text-gray-400">HSK 2</span>
          <span className="ml-auto px-3 py-1 rounded-lg text-xs font-semibold bg-neutral-900 border border-neutral-800 text-gray-400">Search</span>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 overflow-hidden shadow-xl">
          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                  HSK 1
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  ✓ Learned
                </span>
              </div>
              <span className="text-xs text-gray-600 font-medium">Greetings</span>
            </div>

            <div className="text-center py-3">
              <div className="inline-flex items-end gap-1">
                {[
                  { c: "你", p: "nǐ" },
                  { c: "好", p: "hǎo" },
                ].map((x, i) => (
                  <HoverCharacter key={`bp-${i}`} char={x.c} pinyin={x.p} size="xl" wordId={`bp-${i}`} />
                ))}
              </div>

              <div className={`transition-all duration-500 overflow-hidden ${flipped ? "max-h-28 opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <p className="text-red-400 text-sm font-medium">nǐ hǎo</p>
                  <span className="w-7 h-7 rounded-full border border-neutral-700 bg-neutral-800/70" />
                </div>
                <p className="text-white text-lg font-semibold mt-1">hello, hi</p>
              </div>
              {!flipped && <p className="text-gray-600 text-xs mt-2">Click to reveal meaning</p>}
            </div>
          </div>

          <div className="border-t border-neutral-800">
            <div className="px-5 py-3 text-sm font-medium text-gray-400 flex items-center justify-between">
              <span>Examples (3)</span>
              <span className={`transition-transform ${examplesOpen ? "rotate-180" : ""}`}>⌄</span>
            </div>
            <div className={`transition-all duration-500 overflow-hidden ${examplesOpen ? "max-h-48" : "max-h-0"}`}>
              <div className="px-5 pb-4">
                <div className="p-3 bg-black/40 rounded-xl border border-neutral-800 flex items-start gap-2">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-end gap-0.5 mb-1">
                      {[
                        { c: "你", p: "nǐ" },
                        { c: "好", p: "hǎo" },
                        { c: "，", p: "" },
                        { c: "我", p: "wǒ" },
                        { c: "是", p: "shì" },
                        { c: "小", p: "xiǎo" },
                        { c: "明", p: "míng" },
                        { c: "。", p: "" },
                      ].map((x, i) => (
                        <HoverCharacter key={`bp-ex-${i}`} char={x.c} pinyin={x.p} size="sm" wordId={`bp-ex-${i}`} />
                      ))}
                    </div>
                    <p className="text-gray-400 text-xs">Hello, I'm Xiaoming.</p>
                  </div>
                  <span className="w-7 h-7 rounded-full border border-neutral-700 bg-neutral-800/70" />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-800 grid grid-cols-2">
            <div className="py-3 text-xs font-semibold text-gray-500 text-center hover:bg-neutral-800/60">Learned — Click to reset</div>
            <div className="py-3 text-xs font-semibold text-gray-500 text-center hover:bg-neutral-800/60">Show Examples</div>
          </div>
        </div>
      </div>
    </PreviewFrame>
  );
}

function PracticePreview() {
  const [progress, setProgress] = useState(2);
  const [flipped, setFlipped] = useState(false);
  const [pulse, setPulse] = useState<"got" | null>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setFlipped(true), 900);
    const t2 = setTimeout(() => {
      setPulse("got");
      setProgress(3);
    }, 2100);
    const t3 = setTimeout(() => setPulse(null), 2550);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const ring = pulse === "got" ? "ring-2 ring-emerald-500/40" : "";
  const border = pulse === "got" ? "border-emerald-500/60" : "border-neutral-800";

  return (
    <PreviewFrame title="Practice · Session">
      <div className="p-4">
        <div className="mb-3 bg-neutral-950 border border-neutral-800 rounded-xl p-3">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Card 3 of 10</span>
            <span className="bg-neutral-800 px-2 py-0.5 rounded">Practice</span>
          </div>
          <div className={`h-2 bg-neutral-800 rounded-full overflow-hidden flex ${ring}`}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`h-full flex-1 ${i === 2 ? "bg-green-500" : i < 2 ? "bg-green-700" : "bg-neutral-700"} ${i > 0 ? "border-l border-black/20" : ""}`}
              />
            ))}
          </div>
        </div>

        <div
          className={`relative rounded-3xl border ${border} bg-neutral-900 shadow-2xl overflow-hidden transition-all duration-300 ${
            pulse === "got" ? "shadow-[0_0_26px_6px_rgba(34,197,94,0.25)]" : ""
          }`}
          style={{ height: 520 }}
        >
          <div className="absolute top-5 left-6 flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-400 border border-blue-800/50">HSK 2</span>
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-950/60 border border-emerald-800/40">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </div>
          <div className="absolute top-5 right-6 text-xs text-gray-600 font-medium">Education</div>

          <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 ${flipped ? "opacity-30 scale-75 -translate-y-10" : "opacity-100"}`}>
            <div className="flex items-end gap-2 justify-center">
              {[
                { c: "学", p: "xué" },
                { c: "习", p: "xí" },
              ].map((x, i) => (
                <HoverCharacter key={`pp-${i}`} char={x.c} pinyin={x.p} size="2xl" wordId={`pp-${i}`} />
              ))}
            </div>
            <div className="mt-5 w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700" />

            <div className="mt-7 flex items-center gap-3">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    className={`h-3 rounded-sm transition-all duration-500 ${
                      step <= progress ? "w-7 bg-emerald-500" : "w-6 bg-neutral-800 border border-neutral-700"
                    }`}
                  />
                ))}
              </div>
              <span className={`text-xs font-semibold ${progress === 5 ? "text-yellow-400" : "text-gray-500"}`}>
                {progress}/5 <span className={progress === 5 ? "text-yellow-300" : "text-gray-600"}>⭐</span>
              </span>
            </div>
            <p className="text-gray-600 text-sm mt-5">Tap to reveal · Hover for pinyin</p>
          </div>

          <div className={`absolute inset-0 pt-36 px-8 transition-all duration-300 ${flipped ? "opacity-100" : "opacity-0 pointer-events-none translate-y-6"}`}>
            <p className="text-red-400 text-xl font-medium text-center">xué xí</p>
            <p className="text-white text-3xl font-bold text-center mt-1">to study / learn</p>

            <div className="mt-6 flex justify-center">
              <div className="p-3 bg-black/40 rounded-xl border border-neutral-800 w-full">
                <div className="flex flex-wrap items-end gap-0.5 mb-2 justify-center">
                  {[
                    { c: "我", p: "wǒ" },
                    { c: "在", p: "zài" },
                    { c: "学", p: "xué" },
                    { c: "习", p: "xí" },
                    { c: "汉", p: "hàn" },
                    { c: "语", p: "yǔ" },
                    { c: "。", p: "" },
                  ].map((x, i) => (
                    <HoverCharacter key={`pp-ex-${i}`} char={x.c} pinyin={x.p} size="sm" wordId={`pp-ex-${i}`} />
                  ))}
                </div>
                <p className="text-gray-400 text-xs text-center">I am studying Chinese.</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    className={`h-3 rounded-sm transition-all duration-500 ${
                      step <= progress ? "w-7 bg-emerald-500" : "w-6 bg-neutral-800 border border-neutral-700"
                    }`}
                  />
                ))}
              </div>
              <span className={`text-xs font-semibold ${progress === 5 ? "text-yellow-400" : "text-gray-500"}`}>
                {progress}/5 <span className={progress === 5 ? "text-yellow-300" : "text-gray-600"}>⭐</span>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="h-12 rounded-xl bg-neutral-900 border border-red-900/40 flex items-center justify-center gap-2 text-red-400 font-bold">✗ Forgot it</div>
          <div className="h-12 rounded-xl bg-neutral-900 border border-emerald-900/40 flex items-center justify-center gap-2 text-emerald-400 font-bold">✓ Got it</div>
        </div>
        <div className="mt-3 h-11 rounded-xl bg-neutral-950 border border-yellow-900/30 flex items-center justify-center gap-2 text-yellow-400 font-semibold">
          ⭐ Learned it
        </div>
      </div>
    </PreviewFrame>
  );
}

function FlashcardPreview() {
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [card, setCard] = useState(0);
  const cards = [
    { parts: [{ c: "谢", p: "xiè" }, { c: "谢", p: "xiè" }], p: "xiè xiè", e: "thank you" },
    { parts: [{ c: "明", p: "míng" }, { c: "天", p: "tiān" }], p: "míng tiān", e: "tomorrow" },
  ];
  const current = cards[card % cards.length];

  useEffect(() => {
    const t1 = setTimeout(() => setFlipped(true), 900);
    const t2 = setTimeout(() => {
      setKnown((k) => k + 1);
      setFlipped(false);
      setCard((c) => c + 1);
    }, 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <PreviewFrame title="Flashcards · Drill">
      <div className="p-4 space-y-3">
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Card {card + 1} of 8</span>
            <span>✅ {known} · ❌ 0</span>
          </div>
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-500" style={{ width: `${((card + 1) / 8) * 100}%` }} />
          </div>
        </div>

        <div className="relative bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden" style={{ height: 420 }}>
          <div className="absolute top-5 left-6 flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">HSK 1</span>
          </div>
          <div className="absolute top-5 right-6 text-xs text-gray-600 font-medium">Basics</div>

          <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 ${flipped ? "opacity-30 scale-75 -translate-y-10" : "opacity-100"}`}>
            <div className="flex items-end gap-2 justify-center">
              {current.parts.map((x, i) => (
                <HoverCharacter key={`fp-${card}-${i}`} char={x.c} pinyin={x.p} size="2xl" wordId={`fp-${card}-${i}`} />
              ))}
            </div>
            <div className="mt-4 w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700" />
            {!flipped && <p className="text-gray-600 text-sm mt-8">Tap to reveal · Hover for pinyin</p>}
          </div>

          <div className={`absolute inset-0 pt-36 px-8 bg-neutral-900/95 transition-all duration-300 ${flipped ? "opacity-100" : "opacity-0 pointer-events-none translate-y-6"}`}>
            <p className="text-red-400 text-xl font-medium text-center">{current.p}</p>
            <p className="text-white text-3xl font-bold text-center mt-1">{current.e}</p>
            <div className="mt-6 p-3 bg-black/40 rounded-xl border border-neutral-800">
              <div className="flex flex-wrap items-end gap-0.5 mb-2 justify-center">
                {[
                  { c: "谢", p: "xiè" },
                  { c: "谢", p: "xiè" },
                  { c: "！", p: "" },
                ].map((x, i) => (
                  <HoverCharacter key={`fp-ex-${i}`} char={x.c} pinyin={x.p} size="sm" wordId={`fp-ex-${i}`} />
                ))}
              </div>
              <p className="text-gray-400 text-xs text-center">Thanks!</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="h-12 rounded-xl bg-neutral-900 border border-red-900/40 flex items-center justify-center text-red-400 font-semibold">❌ Still Learning</div>
          <div className="h-12 rounded-xl bg-neutral-900 border border-emerald-900/40 flex items-center justify-center text-emerald-400 font-semibold">✅ I Know This</div>
        </div>
      </div>
    </PreviewFrame>
  );
}

function QuizPreview() {
  const [selected, setSelected] = useState<number | null>(null);
  const correct = 1;
  const options = ["yesterday", "tomorrow", "morning", "night"];

  useEffect(() => {
    const t1 = setTimeout(() => setSelected(1), 1100);
    return () => clearTimeout(t1);
  }, []);

  return (
    <PreviewFrame title="Quiz · Multiple Choice">
      <div className="p-4 space-y-3">
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Question 4 of 10</span>
            <span>Score: 3/3</span>
          </div>
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full" style={{ width: "40%" }} />
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-7 text-center">
          <p className="text-xs text-gray-500 mb-4">What does this mean?</p>
          <div className="flex items-end justify-center gap-2">
            {[
              { c: "明", p: "míng" },
              { c: "天", p: "tiān" },
            ].map((x, i) => (
              <HoverCharacter key={`qp-${i}`} char={x.c} pinyin={x.p} size="2xl" wordId={`qp-${i}`} />
            ))}
          </div>
          <p className="text-gray-600 text-xs mt-3">Hover / tap characters for pinyin</p>
        </div>

        <div className="space-y-2">
          {options.map((opt, idx) => {
            let cls = "w-full h-12 rounded-xl border px-4 text-sm flex items-center transition-all duration-200 ";
            if (selected === null) {
              cls += "bg-neutral-950 border-neutral-800 text-gray-200 hover:bg-neutral-900";
            } else if (idx === correct) {
              cls += "bg-emerald-950/40 border-emerald-600/60 text-emerald-300 font-semibold";
            } else if (idx === selected) {
              cls += "bg-red-950/40 border-red-600/60 text-red-300";
            } else {
              cls += "bg-neutral-950/30 border-neutral-800/40 text-gray-600";
            }
            return (
              <div key={opt} className={cls}>
                <span className="mr-3 text-gray-600 font-mono text-xs">{String.fromCharCode(65 + idx)}.</span>
                {opt}
                {selected !== null && idx === correct && <span className="ml-auto text-emerald-400">✓</span>}
              </div>
            );
          })}
        </div>
      </div>
    </PreviewFrame>
  );
}

function SentencesPreview() {
  const [flipped, setFlipped] = useState(false);
  const [progress, setProgress] = useState(2);
  const [pulse, setPulse] = useState<"got" | null>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setFlipped(true), 900);
    const t2 = setTimeout(() => {
      setPulse("got");
      setProgress(3);
    }, 2100);
    const t3 = setTimeout(() => setPulse(null), 2550);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const ring = pulse === "got" ? "ring-2 ring-emerald-500/40" : "";
  const border = pulse === "got" ? "border-emerald-500/60" : "border-neutral-800";

  return (
    <PreviewFrame title="Sentences · Practice">
      <div className="p-4">
        <div className="mb-3 bg-neutral-950 border border-neutral-800 rounded-xl p-3">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Sentence 3 of 10</span>
            <span className="bg-neutral-800 px-2 py-0.5 rounded">Sentences</span>
          </div>
          <div className={`h-2 bg-neutral-800 rounded-full overflow-hidden flex ${ring}`}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`h-full flex-1 ${i === 2 ? "bg-green-500" : i < 2 ? "bg-green-700" : "bg-neutral-700"} ${i > 0 ? "border-l border-black/20" : ""}`}
              />
            ))}
          </div>
        </div>

        <div
          className={`relative rounded-3xl border ${border} bg-neutral-900 shadow-2xl overflow-hidden transition-all duration-300 ${
            pulse === "got" ? "shadow-[0_0_26px_6px_rgba(34,197,94,0.25)]" : ""
          }`}
          style={{ height: 420 }}
        >
          <div className="absolute top-5 left-6 flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">HSK 1</span>
          </div>
          <div className="absolute top-5 right-6 text-xs text-gray-600 font-medium">From: 学习</div>

          <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 ${flipped ? "opacity-30 scale-75 -translate-y-10" : "opacity-100"}`}>
            <div className="flex flex-wrap items-end gap-1 justify-center px-6">
              {[
                { c: "我", p: "wǒ" },
                { c: "在", p: "zài" },
                { c: "学", p: "xué" },
                { c: "习", p: "xí" },
                { c: "汉", p: "hàn" },
                { c: "语", p: "yǔ" },
                { c: "。", p: "" },
              ].map((x, i) => (
                <HoverCharacter key={`sp-${i}`} char={x.c} pinyin={x.p} size="xl" wordId={`sp-${i}`} />
              ))}
            </div>
            <div className="mt-5 w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700" />

            <div className="mt-6 flex items-center gap-3">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    className={`h-3 rounded-sm transition-all duration-500 ${
                      step <= progress ? "w-7 bg-emerald-500" : "w-6 bg-neutral-800 border border-neutral-700"
                    }`}
                  />
                ))}
              </div>
              <span className={`text-xs font-semibold ${progress === 5 ? "text-yellow-400" : "text-gray-500"}`}>
                {progress}/5 <span className={progress === 5 ? "text-yellow-300" : "text-gray-600"}>⭐</span>
              </span>
            </div>
            <p className="text-gray-600 text-sm mt-5">Tap to reveal · Hover for pinyin</p>
          </div>

          <div className={`absolute inset-0 pt-28 px-8 transition-all duration-300 ${flipped ? "opacity-100" : "opacity-0 pointer-events-none translate-y-6"}`}>
            <p className="text-white text-2xl font-bold text-center">I am studying Chinese.</p>
            
            <div className="mt-6 flex flex-wrap items-end gap-1 justify-center">
              {[
                { c: "我", p: "wǒ" },
                { c: "在", p: "zài" },
                { c: "学", p: "xué" },
                { c: "习", p: "xí" },
                { c: "汉", p: "hàn" },
                { c: "语", p: "yǔ" },
                { c: "。", p: "" },
              ].map((x, i) => (
                <HoverCharacter key={`sp-back-${i}`} char={x.c} pinyin={x.p} size="lg" wordId={`sp-back-${i}`} />
              ))}
            </div>
            <p className="text-red-400 text-sm font-medium text-center mt-2">wǒ zài xué xí hàn yǔ.</p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    className={`h-3 rounded-sm transition-all duration-500 ${
                      step <= progress ? "w-7 bg-emerald-500" : "w-6 bg-neutral-800 border border-neutral-700"
                    }`}
                  />
                ))}
              </div>
              <span className={`text-xs font-semibold ${progress === 5 ? "text-yellow-400" : "text-gray-500"}`}>
                {progress}/5 <span className={progress === 5 ? "text-yellow-300" : "text-gray-600"}>⭐</span>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="h-12 rounded-xl bg-neutral-900 border border-red-900/40 flex items-center justify-center gap-2 text-red-400 font-bold">✗ Forgot it</div>
          <div className="h-12 rounded-xl bg-neutral-900 border border-emerald-900/40 flex items-center justify-center gap-2 text-emerald-400 font-bold">✓ Got it</div>
        </div>
        <div className="mt-3 h-11 rounded-xl bg-neutral-950 border border-yellow-900/30 flex items-center justify-center gap-2 text-yellow-400 font-semibold">
          ⭐ Remove from Session
        </div>
      </div>
    </PreviewFrame>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface SectionConfig {
  id: SectionId;
  label: string;
  color: string;
}

const SECTIONS: SectionConfig[] = [
  { id: "hero", label: "Home", color: "bg-gray-400" },
  { id: "browse", label: "Browse", color: "bg-red-500" },
  { id: "practice", label: "Practice", color: "bg-orange-500" },
  { id: "sentences", label: "Sentences", color: "bg-teal-500" },
  { id: "flashcards", label: "Flashcards", color: "bg-blue-500" },
  { id: "quiz", label: "Quiz", color: "bg-yellow-500" },
  { id: "footer", label: "Start", color: "bg-gray-400" },
];

function useActiveSection(containerRef: React.RefObject<HTMLDivElement | null>, enabled: boolean) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setActive(0);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      const children = Array.from(container.children) as HTMLElement[];
      const mid = container.scrollTop + container.clientHeight / 2;
      let found = 0;
      children.forEach((el, i) => {
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;
        if (mid >= top && mid <= bottom) found = i;
      });
      setActive(found);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => container.removeEventListener("scroll", onScroll);
  }, [containerRef, enabled]);

  return active;
}

function ModeSectionDesktop({
  id,
  icon,
  title,
  subtitle,
  description,
  bullets,
  Preview,
  onSelectMode,
  onPrev,
  onNext,
  swap,
}: {
  id: ModeId;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  Preview: () => ReactElement;
  onSelectMode: (id: ModeId) => void;
  onPrev: () => void;
  onNext: () => void;
  swap: boolean;
}) {
  const accentText =
    id === "browse" ? "text-red-400" : id === "practice" ? "text-orange-400" : id === "sentences" ? "text-teal-400" : id === "flashcards" ? "text-blue-400" : "text-yellow-400";
  const bulletDot =
    id === "browse" ? "bg-red-500/60" : id === "practice" ? "bg-orange-500/60" : id === "sentences" ? "bg-teal-500/60" : id === "flashcards" ? "bg-blue-500/60" : "bg-yellow-500/60";
  const btn =
    id === "browse"
      ? "bg-red-600 hover:bg-red-700 shadow-red-900/30"
      : id === "practice"
      ? "bg-orange-600 hover:bg-orange-700 shadow-orange-900/30"
      : id === "sentences"
      ? "bg-teal-600 hover:bg-teal-700 shadow-teal-900/30"
      : id === "flashcards"
      ? "bg-blue-600 hover:bg-blue-700 shadow-blue-900/30"
      : "bg-yellow-600 hover:bg-yellow-700 shadow-yellow-900/30";

  return (
    <section className="snap-center min-h-[calc(100dvh-4rem)] flex items-center relative overflow-hidden pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 lg:px-8">
        <div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
            swap ? "lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1" : ""
          }`}
        >
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-4xl">{icon}</span>
              <span className={`text-xs font-bold tracking-widest uppercase ${accentText}`}>Study Mode</span>
            </div>
            <h2 className="text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">{title}</h2>
            <p className={`mt-2 text-lg font-semibold ${accentText}`}>{subtitle}</p>
            <p className="mt-4 text-gray-400 leading-relaxed max-w-lg">{description}</p>

            <ul className="mt-6 space-y-2.5">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-gray-300">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${bulletDot}`} />
                  {b}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => onSelectMode(id)}
                className={`px-6 py-3 rounded-xl text-white font-semibold transition-colors shadow-lg ${btn}`}
              >
                Open {title} →
              </button>
            </div>
          </div>

          <button type="button" onClick={() => onSelectMode(id)} className="group block text-left w-full" aria-label={`Open ${title}`}>
            <div className="relative">
              <div className="absolute -inset-2 rounded-[2rem] bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Preview />
            </div>
          </button>
        </div>
      </div>

      <div className="absolute bottom-[max(4rem,calc(env(safe-area-inset-bottom)+2rem))] left-1/2 -translate-x-1/2 flex items-center gap-6">
        <button
          onClick={onPrev}
          className="group flex items-center justify-center w-12 h-12 rounded-full bg-transparent border-2 border-neutral-500 text-neutral-400 hover:border-white hover:text-white transition-all"
          title="Previous section"
        >
          {/* Up arrow */}
          <svg className="w-6 h-6 rotate-180 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button
          onClick={onNext}
          className="group flex items-center justify-center w-12 h-12 rounded-full bg-transparent border-2 border-red-500 text-red-500 hover:border-red-400 hover:text-red-400 hover:bg-red-500/10 transition-all animate-pulse hover:animate-none"
          title="Next section"
        >
          {/* Down arrow */}
          <svg className="w-6 h-6 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </section>
  );
}

function ModeSectionMobile({
  id,
  icon,
  title,
  subtitle,
  description,
  bullets,
  Preview,
  onSelectMode,
}: {
  id: ModeId;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  Preview: () => ReactElement;
  onSelectMode: (id: ModeId) => void;
}) {
  const accentText =
    id === "browse" ? "text-red-400" : id === "practice" ? "text-orange-400" : id === "sentences" ? "text-teal-400" : id === "flashcards" ? "text-blue-400" : "text-yellow-400";
  const btn =
    id === "browse"
      ? "bg-red-600 hover:bg-red-700 shadow-red-900/30"
      : id === "practice"
      ? "bg-orange-600 hover:bg-orange-700 shadow-orange-900/30"
      : id === "sentences"
      ? "bg-teal-600 hover:bg-teal-700 shadow-teal-900/30"
      : id === "flashcards"
      ? "bg-blue-600 hover:bg-blue-700 shadow-blue-900/30"
      : "bg-yellow-600 hover:bg-yellow-700 shadow-yellow-900/30";

  return (
    <section id={id} className="relative overflow-hidden py-14">
      <div className="relative z-10 max-w-md mx-auto px-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{icon}</span>
          <span className={`text-xs font-bold tracking-widest uppercase ${accentText}`}>Study Mode</span>
        </div>

        <h2 className="text-4xl font-black text-white tracking-tight leading-none">{title}</h2>
        <p className={`mt-2 text-base font-semibold ${accentText}`}>{subtitle}</p>
        <p className="mt-4 text-gray-400 leading-relaxed">{description}</p>

        <ul className="mt-5 space-y-2 text-sm text-gray-300">
          {bullets.slice(0, 4).map((b) => (
            <li key={b} className="flex items-start gap-2">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-white/20" />
              {b}
            </li>
          ))}
        </ul>

        {/* Preview (smaller on mobile) */}
        <button
          type="button"
          onClick={() => onSelectMode(id)}
          className="mt-7 block w-full"
          aria-label={`Open ${title}`}
        >
          <div className="max-w-sm mx-auto origin-top scale-[0.86]">
            <Preview />
          </div>
        </button>

        {/* Open button after the preview (mobile-first order) */}
        <button
          onClick={() => onSelectMode(id)}
          className={`mt-4 w-full px-6 py-3 rounded-xl text-white font-semibold transition-colors shadow-lg ${btn}`}
        >
          Open {title} →
        </button>
      </div>
    </section>
  );
}

// Speech bubble messages
const HAMHAO_MESSAGES = [
  {
    type: "english" as const,
    text: "Hello, I'm HamHao! Please learn Chinese with me.",
  },
  {
    type: "chinese" as const,
    text: "你好，我是HamHao！请跟我学中文吧！",
    pinyinWords: [
      { char: "你", pinyin: "nǐ" },
      { char: "好", pinyin: "hǎo" },
      { char: "，", pinyin: "" },
      { char: "我", pinyin: "wǒ" },
      { char: "是", pinyin: "shì" },
      { char: "H", pinyin: "" },
      { char: "a", pinyin: "" },
      { char: "m", pinyin: "" },
      { char: "H", pinyin: "" },
      { char: "a", pinyin: "" },
      { char: "o", pinyin: "" },
      { char: "！", pinyin: "" },
      { char: "请", pinyin: "qǐng" },
      { char: "跟", pinyin: "gēn" },
      { char: "我", pinyin: "wǒ" },
      { char: "学", pinyin: "xué" },
      { char: "中", pinyin: "zhōng" },
      { char: "文", pinyin: "wén" },
      { char: "吧", pinyin: "ba" },
      { char: "！", pinyin: "" },
    ],
  },
];

function HamHaoSpeechBubble({ 
  message, 
  onClose,
  isMobile 
}: { 
  message: typeof HAMHAO_MESSAGES[number]; 
  onClose: () => void;
  isMobile: boolean;
}) {
  const [hoveredChar, setHoveredChar] = useState<number | null>(null);
  
  return (
    <div 
      className={`absolute z-50 ${
        isMobile 
          ? "top-full left-1/2 -translate-x-1/2 mt-3" 
          : "left-full top-1/2 -translate-y-1/2 ml-3"
      }`}
      style={{ animation: "fadeInUp 0.3s ease-out" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Speech bubble - wider to reduce vertical space */}
      <div className="relative bg-white text-neutral-900 rounded-2xl px-5 py-4 shadow-xl min-w-[300px] max-w-[340px]">
        {/* Arrow - points up on mobile, left on desktop */}
        {isMobile ? (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-white" />
        ) : (
          <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-white" />
        )}
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 w-6 h-6 bg-neutral-800 text-white rounded-full flex items-center justify-center text-xs hover:bg-neutral-700 transition-colors shadow-lg"
        >
          ✕
        </button>
        
        {/* Message content */}
        {message.type === "english" ? (
          <p className="text-sm font-medium leading-relaxed text-neutral-800">
            {message.text} 🐹
          </p>
        ) : (
          <div>
            {/* Chinese characters with inline pinyin on hover/tap */}
            <div className="flex flex-wrap items-end gap-0.5">
              {message.pinyinWords.map((pw, i) => {
                const isPunct = /^[，！。？、]$/.test(pw.char);
                const isLetter = /^[a-zA-Z]$/.test(pw.char);
                const isHovered = hoveredChar === i;
                
                // All elements get the same structure for alignment
                // Chinese characters: have pinyin space + character
                // Punctuation/letters: have empty pinyin space + character
                
                if (isPunct) {
                  return (
                    <span key={i} className="inline-flex flex-col items-center">
                      <span className="h-4">{/* spacer for alignment */}</span>
                      <span className="text-lg text-neutral-500 leading-none">{pw.char}</span>
                    </span>
                  );
                }
                
                if (isLetter) {
                  return (
                    <span key={i} className="inline-flex flex-col items-center">
                      <span className="h-4">{/* spacer for alignment */}</span>
                      <span className="text-lg font-bold text-red-500 leading-none">{pw.char}</span>
                    </span>
                  );
                }
                
                return (
                  <span
                    key={i}
                    className="inline-flex flex-col items-center cursor-pointer"
                    onMouseEnter={() => setHoveredChar(i)}
                    onMouseLeave={() => setHoveredChar(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setHoveredChar(isHovered ? null : i);
                    }}
                  >
                    {/* Pinyin - shows on hover */}
                    <span 
                      className={`text-[10px] text-red-500 font-medium h-4 leading-none flex items-end transition-opacity duration-200 ${
                        isHovered ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      {pw.pinyin}
                    </span>
                    {/* Character */}
                    <span 
                      className={`text-lg leading-none transition-colors duration-200 ${
                        isHovered ? "text-red-500" : "text-neutral-800"
                      }`}
                    >
                      {pw.char}
                    </span>
                  </span>
                );
              })}
              {/* Hamster emoji with same structure */}
              <span className="inline-flex flex-col items-center ml-1">
                <span className="h-4">{/* spacer for alignment */}</span>
                <span className="text-lg leading-none">🐹</span>
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-2">
              (Hover/tap characters for pinyin)
            </p>
          </div>
        )}
        
        {/* Language indicator */}
        <div className="mt-3 pt-2 border-t border-neutral-200 flex items-center justify-between">
          <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
            {message.type === "english" ? "🇬🇧 English" : "🇨🇳 中文"}
          </span>
          <span className="text-[10px] text-red-400 font-medium">
            Tap HamHao again!
          </span>
        </div>
      </div>
    </div>
  );
}

export function LandingPage({ onSelectMode }: LandingPageProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const active = useActiveSection(containerRef, !isMobile);
  
  // HamHao mascot interaction state
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  
  const handleHamHaoClick = useCallback(() => {
    if (!showSpeechBubble) {
      // First click - show English message
      setShowSpeechBubble(true);
      setMessageIndex(0);
    } else {
      // Check if we've shown all messages
      const nextIndex = messageIndex + 1;
      if (nextIndex >= HAMHAO_MESSAGES.length) {
        // All messages shown, close the bubble
        setShowSpeechBubble(false);
        setMessageIndex(0);
      } else {
        // Show next message
        setMessageIndex(nextIndex);
      }
    }
  }, [showSpeechBubble, messageIndex]);
  
  const handleCloseSpeechBubble = useCallback(() => {
    setShowSpeechBubble(false);
    setMessageIndex(0);
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      if (isMobile) return;
      const container = containerRef.current;
      if (!container) return;
      const children = Array.from(container.children) as HTMLElement[];
      const el = children[index];
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    },
    [isMobile]
  );

  const scrollNext = useCallback(() => scrollToIndex(Math.min(active + 1, SECTIONS.length - 1)), [active, scrollToIndex]);
  const scrollPrev = useCallback(() => scrollToIndex(Math.max(active - 1, 0)), [active, scrollToIndex]);

  const modes = [
    {
      id: "browse" as ModeId,
      icon: "📚",
      title: "Browse",
      subtitle: "Search. Filter. Learn.",
      description:
        "Explore the full HSK vocabulary with fast filtering by level, category, and learning status.",
      bullets: [
        "Filter by HSK level, category, learned/still-learning",
        "Click cards to reveal pinyin + English",
        "Expand 1–3 real example sentences per word",
        "Hover (desktop) or tap (mobile) for per-character pinyin",
      ],
      Preview: BrowsePreview,
    },
    {
      id: "practice" as ModeId,
      icon: "🔥",
      title: "Practice",
      subtitle: "Short sessions. Real progress.",
      description:
        "A focused 10-card session mixing new words with review, plus a 0–5 mastery bar per word.",
      bullets: [
        "10 cards per session: 8 new + 2 review",
        "0–5 progress bar per word with feedback",
        "Got it / Forgot it adjusts difficulty",
        "Learned it removes the word from the session",
      ],
      Preview: PracticePreview,
    },
    {
      id: "sentences" as ModeId,
      icon: "💬",
      title: "Sentences",
      subtitle: "Context is everything.",
      description:
        "Practice with real example sentences from the vocabulary. Learn words in context for better retention.",
      bullets: [
        "10 random sentences per session",
        "Chinese ↔ English direction toggle",
        "Per-character pinyin on hover/tap",
        "Audio pronunciation for full sentences",
      ],
      Preview: SentencesPreview,
    },
    {
      id: "flashcards" as ModeId,
      icon: "🃏",
      title: "Flashcards",
      subtitle: "Fast repetition. Instant recall.",
      description:
        "Drill through shuffled cards at your own pace. Mark each word as Learned or Still Learning.",
      bullets: [
        "Tap card to reveal meaning + examples",
        "I Know This / Still Learning tracking",
        "Filter by learned / still-learning status",
        "Audio pronunciation with one tap",
      ],
      Preview: FlashcardPreview,
    },
    {
      id: "quiz" as ModeId,
      icon: "✏️",
      title: "Quiz",
      subtitle: "Test your recall.",
      description:
        "10-question multiple choice quizzes with instant feedback.",
      bullets: [
        "10 questions per round",
        "4 answer options per question",
        "Instant feedback: green correct / red wrong",
        "Hover/tap hanzi to reveal pinyin",
      ],
      Preview: QuizPreview,
    },
  ];

  const hero = (
    <section id="hero" className={isMobile ? "relative overflow-hidden py-16" : "snap-center min-h-[calc(100dvh-4rem)] flex items-center justify-center relative overflow-hidden px-4 pb-[max(2rem,env(safe-area-inset-bottom))]"}>
      <div className="absolute top-1/4 left-1/4 w-56 h-56 bg-red-600/10 rounded-full blur-2xl" />
      <div className="absolute bottom-1/4 right-1/4 w-44 h-44 bg-red-400/8 rounded-full blur-2xl" />

      <div className={isMobile ? "relative z-10 text-center max-w-md mx-auto px-4" : "relative z-10 text-center max-w-3xl mx-auto"}>
        {/* Interactive HamHao mascot */}
        <div className="relative inline-block mb-8">
          <button
            onClick={handleHamHaoClick}
            className="relative group focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded-3xl transition-transform hover:scale-105 active:scale-95"
            title="Click me!"
          >
            {logoImage ? (
              <img
                src={logoImage}
                alt="HamHao - Click me!"
                className="w-20 h-20 rounded-3xl shadow-2xl shadow-red-900/50 object-cover cursor-pointer"
              />
            ) : (
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600 rounded-3xl shadow-2xl shadow-red-900/50 cursor-pointer">
                <span className="text-white text-4xl font-bold">汉</span>
              </div>
            )}
            {/* Pulsing indicator to show it's clickable */}
            {!showSpeechBubble && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[10px] items-center justify-center font-bold">?</span>
              </span>
            )}
          </button>
          
          {/* Speech bubble */}
          {showSpeechBubble && (
            <HamHaoSpeechBubble 
              message={HAMHAO_MESSAGES[messageIndex]} 
              onClose={handleCloseSpeechBubble}
              isMobile={isMobile}
            />
          )}
        </div>

        <h1 className={isMobile ? "text-5xl font-black tracking-tight text-white leading-none" : "text-5xl sm:text-7xl font-black tracking-tight text-white leading-none"}>
          Learn Mandarin
        </h1>
        <p className="mt-3 text-xl font-light text-red-400">One focused session at a time.</p>
        <div className="mt-5 inline-block rounded-2xl bg-neutral-950/80 border border-white/15 px-5 py-4">
          <p className="text-gray-100 leading-relaxed">
            HSK vocabulary with real example sentences, per-character pinyin hover, audio, and multiple study modes.
          </p>
        </div>

        <div className="mt-8 inline-flex items-end gap-2 px-6 py-4 rounded-2xl bg-neutral-900/80 border border-neutral-700 shadow-xl">
          {[{ c: "你", p: "nǐ" }, { c: "好", p: "hǎo" }, { c: "！", p: "" }].map((x, i) => (
            <HoverCharacter key={`hero-${i}`} char={x.c} pinyin={x.p} size="xl" wordId={`hero-${i}`} />
          ))}
          <span className="ml-3 text-xs text-gray-500 self-center">← hover / tap</span>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-gray-200">
          {[
            "All the words you need!",
            "Thousands of Examples",
            "Various Study Modes",
            "HSK 3.0 Conform",
          ].map((s) => (
            <span
              key={s}
              className="px-3 py-1.5 rounded-full bg-neutral-950/55 border border-white/10"
            >
              {s}
            </span>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => onSelectMode("practice")}
            className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors shadow-lg shadow-red-900/30"
          >
            Start Practicing
          </button>
          {isMobile ? (
            <button
              onClick={() => onSelectMode("browse")}
              className="px-6 py-3 rounded-xl bg-neutral-900 border border-neutral-700 text-gray-200 hover:bg-neutral-800 transition-colors"
            >
              Browse words
            </button>
          ) : (
            <button
              onClick={() => scrollToIndex(1)}
              className="px-6 py-3 rounded-xl bg-neutral-900 border border-neutral-700 text-gray-200 hover:bg-neutral-800 transition-colors"
            >
              Explore Modes ↓
            </button>
          )}
        </div>
      </div>

      {!isMobile && (
        <button
          onClick={scrollNext}
          className="group absolute bottom-[max(6rem,calc(env(safe-area-inset-bottom)+4rem))] left-1/2 -translate-x-1/2 flex items-center justify-center w-14 h-14 rounded-full bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-500/10 hover:border-red-400 hover:text-red-400 transition-all animate-bounce hover:animate-none"
          title="Scroll to explore modes"
        >
          <svg className="w-7 h-7 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </section>
  );

  const footer = (
    <section id="footer" className={isMobile ? "relative overflow-hidden py-16" : "snap-center min-h-[calc(100dvh-4rem)] flex items-center justify-center relative overflow-hidden pb-[max(2rem,env(safe-area-inset-bottom))]"}>
      <div className={isMobile ? "relative z-10 text-center max-w-md mx-auto px-4" : "relative z-10 text-center max-w-2xl mx-auto px-4"}>
        {logoImage ? (
          <img
            src={logoImage}
            alt="HamHao Logo"
            className="w-16 h-16 rounded-2xl shadow-xl shadow-red-900/40 mb-6 object-cover"
          />
        ) : (
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl shadow-xl shadow-red-900/40 mb-6">
            <span className="text-white text-2xl font-bold">汉</span>
          </div>
        )}
        <h2 className="text-4xl sm:text-5xl font-black text-white">Ready to start?</h2>
        <p className="mt-4 text-gray-400">Pick a mode and begin your first session. Progress is saved locally.</p>

        <div className="mt-10 grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { id: "browse" as ModeId, icon: "📚", label: "Browse", cls: "border-red-900/40 hover:border-red-700/60 hover:bg-red-950/20" },
            { id: "practice" as ModeId, icon: "🔥", label: "Practice", cls: "border-orange-900/40 hover:border-orange-700/60 hover:bg-orange-950/20" },
            { id: "sentences" as ModeId, icon: "💬", label: "Sentences", cls: "border-teal-900/40 hover:border-teal-700/60 hover:bg-teal-950/20" },
            { id: "flashcards" as ModeId, icon: "🃏", label: "Cards", cls: "border-blue-900/40 hover:border-blue-700/60 hover:bg-blue-950/20" },
            { id: "quiz" as ModeId, icon: "✏️", label: "Quiz", cls: "border-yellow-900/40 hover:border-yellow-700/60 hover:bg-yellow-950/20" },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => onSelectMode(m.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl bg-neutral-900 border transition-all ${m.cls}`}
            >
              <span className="text-2xl">{m.icon}</span>
              <span className="text-sm font-semibold text-gray-200">{m.label}</span>
            </button>
          ))}
        </div>

        {!isMobile && (
          <button
            onClick={() => scrollToIndex(0)}
            className="mt-10 text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1 mx-auto"
          >
            <svg className="w-3 h-3 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Back to top
          </button>
        )}
      </div>
    </section>
  );

  return (
    <div className="relative w-screen -ml-[calc((100vw-100%)/2)] -mt-8 overflow-x-hidden z-10">
      {/*
        Fixed viewport background (NOT tied to scroll height).
        This prevents the mobile image from becoming extremely zoomed (because the old
        absolute background covered the entire tall scroll area and `cover` scaled to that height).
        It also ensures the background spans the full viewport width on desktop.
      */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* Image layer */}
        {(isMobile ? MOBILE_BG_ASSET : DESKTOP_BG_ASSET) ? (
          <img
            src={(isMobile ? MOBILE_BG_ASSET : DESKTOP_BG_ASSET) as string}
            alt="Chinese landscape background"
            className="w-full h-full object-cover"
            style={{
              objectPosition: isMobile ? "50% 15%" : "50% 50%",
              opacity: 0.85,
              filter: "saturate(1.05) contrast(1.05)",
            }}
            draggable={false}
          />
        ) : null}

        {/* Gradient overlay for readability (works even if the image is missing) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/55 to-black/90" />
      </div>

      {/* Desktop-only dot nav */}
      {!isMobile && (
        <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-2.5 hidden sm:flex">
          {SECTIONS.slice(0, SECTIONS.length - 0).map((s, i) => (
            <button
              key={s.id}
              onClick={() => scrollToIndex(i)}
              title={s.label}
              className={`rounded-full transition-all duration-300 ${
                active === i
                  ? `w-3 h-3 ${s.color} shadow-lg`
                  : "w-2 h-2 bg-neutral-600 hover:bg-neutral-400"
              }`}
            />
          ))}
        </div>
      )}

      {isMobile ? (
        <div>
          {hero}
          {modes.map((m) => (
            <ModeSectionMobile
              key={m.id}
              id={m.id}
              icon={m.icon}
              title={m.title}
              subtitle={m.subtitle}
              description={m.description}
              bullets={m.bullets}
              Preview={m.Preview}
              onSelectMode={onSelectMode}
            />
          ))}
          {footer}
        </div>
      ) : (
        <div
          ref={containerRef}
          className="h-[calc(100dvh-4rem)] overflow-y-auto snap-y snap-mandatory scroll-smooth overscroll-y-contain scrollbar-hide"
          style={{ 
            scrollSnapType: "y mandatory",
            scrollbarWidth: "none", /* Firefox */
            msOverflowStyle: "none", /* IE/Edge */
          }}
        >
          {hero}
          {modes.map((m, idx) => (
            <ModeSectionDesktop
              key={m.id}
              id={m.id}
              icon={m.icon}
              title={m.title}
              subtitle={m.subtitle}
              description={m.description}
              bullets={m.bullets}
              Preview={m.Preview}
              onSelectMode={onSelectMode}
              onPrev={scrollPrev}
              onNext={scrollNext}
              swap={idx % 2 === 1}
            />
          ))}
          {footer}
        </div>
      )}
    </div>
  );
}
