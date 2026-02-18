import { useRef, useState, useEffect, useCallback } from "react";
import { HoverCharacter } from "./HoverCharacter";

interface LandingPageProps {
  onSelectMode: (mode: "browse" | "practice" | "flashcards" | "quiz") => void;
}

type ModeId = "browse" | "practice" | "flashcards" | "quiz";

// ─── Fancy Mode Previews ──────────────────────────────────────────────────────

function BrowsePreview() {
  const [flipped, setFlipped] = useState(false);
  const [learned, setLearned] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setFlipped(true), 1200);
    const t2 = setTimeout(() => setLearned(true), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Glow */}
      <div className="absolute -inset-4 bg-red-600/10 rounded-3xl blur-2xl" />
      <div className="relative bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Toolbar mock */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-800 bg-neutral-950">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
          <div className="ml-3 flex-1 h-6 bg-neutral-800 rounded-md" />
        </div>
        {/* Filter chips */}
        <div className="flex gap-2 px-4 py-3 border-b border-neutral-800/60">
          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-600 text-white">All</span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-800 text-gray-400">HSK 1</span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-800 text-gray-400">HSK 2</span>
          <span className="ml-auto px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-900/40">✓ Learned</span>
        </div>
        {/* Cards grid */}
        <div className="p-4 grid grid-cols-2 gap-3">
          {/* Main featured card */}
          <div className={`col-span-2 rounded-xl border p-4 transition-all duration-700 ${learned ? "border-emerald-800/50 bg-emerald-950/10" : "border-neutral-800 bg-black/30"}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">HSK 1</span>
              <span className="text-xs text-gray-600">Food</span>
            </div>
            <div className="text-center py-2">
              <div className="flex items-end justify-center gap-1">
                {[{ c: "茶", p: "chá" }, { c: "。", p: "" }].map((x, i) => (
                  <HoverCharacter key={i} char={x.c} pinyin={x.p} size="xl" wordId={`lp-b-${i}`} />
                ))}
              </div>
              <div className={`transition-all duration-500 mt-2 ${flipped ? "opacity-100 max-h-10" : "opacity-0 max-h-0"} overflow-hidden`}>
                <p className="text-red-400 text-sm font-medium">chá</p>
                <p className="text-white text-base font-semibold">tea</p>
              </div>
              {!flipped && <p className="text-gray-600 text-xs mt-1">Click to reveal</p>}
            </div>
            <div className={`mt-3 pt-3 border-t border-neutral-800 flex items-center justify-center gap-2 text-xs font-semibold transition-colors duration-500 ${learned ? "text-emerald-400" : "text-gray-600"}`}>
              {learned ? "✓ Learned — Click to reset" : "+ Mark as Learned"}
            </div>
          </div>
          {/* Mini cards */}
          {[{ h: "水", p: "shuǐ", e: "water" }, { h: "书", p: "shū", e: "book" }].map((w) => (
            <div key={w.h} className="rounded-xl border border-neutral-800 bg-black/30 p-3 text-center">
              <div className="flex items-end justify-center">
                <HoverCharacter char={w.h} pinyin={w.p} size="lg" wordId={`lp-b-mini-${w.h}`} />
              </div>
              <p className="text-gray-500 text-xs mt-1">{w.e}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PracticePreview() {
  const [progress, setProgress] = useState(2);
  const [flipped, setFlipped] = useState(false);
  const [glowColor, setGlowColor] = useState<"green" | "red" | null>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setFlipped(true), 1000);
    const t2 = setTimeout(() => { setGlowColor("green"); setProgress(3); }, 2200);
    const t3 = setTimeout(() => setGlowColor(null), 2700);
    const t4 = setTimeout(() => setFlipped(false), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  const glowClass = glowColor === "green"
    ? "border-emerald-500/60 shadow-[0_0_20px_4px_rgba(34,197,94,0.25)]"
    : glowColor === "red"
    ? "border-red-500/60 shadow-[0_0_20px_4px_rgba(239,68,68,0.25)]"
    : "border-neutral-700";

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="absolute -inset-4 bg-orange-600/10 rounded-3xl blur-2xl" />
      <div className="relative space-y-3">
        {/* Progress bar */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Card 3 / 10</span>
            <span className="bg-neutral-800 px-2 py-0.5 rounded">Practice</span>
          </div>
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden flex gap-px">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={`h-full flex-1 transition-all duration-500 rounded-sm ${i < 3 ? "bg-emerald-500" : i === 3 ? "bg-gray-600" : "bg-neutral-700"}`} />
            ))}
          </div>
        </div>
        {/* Flashcard */}
        <div className={`bg-neutral-900 border rounded-2xl shadow-2xl p-6 text-center transition-all duration-300 ${glowClass}`}>
          <div className="absolute top-4 left-4">
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-400 border border-blue-800/50">HSK 2</span>
          </div>
          {/* Front */}
          <div className={`transition-all duration-300 ${flipped ? "opacity-30 scale-75 -translate-y-6" : "opacity-100 scale-100"}`}>
            <div className="flex items-end justify-center gap-1 pt-4">
              {[{ c: "学", p: "xué" }, { c: "习", p: "xí" }].map((x, i) => (
                <HoverCharacter key={i} char={x.c} pinyin={x.p} size="xl" wordId={`lp-p-${i}`} />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className={`h-2.5 rounded-sm transition-all duration-500 ${step <= progress ? "w-7 bg-emerald-500" : "w-6 bg-neutral-800"}`} />
              ))}
              <span className="text-xs text-gray-400 ml-1">{progress}/5 ⭐</span>
            </div>
          </div>
          {/* Back overlay */}
          <div className={`absolute inset-0 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ${flipped ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            <p className="text-red-400 font-medium">xué xí</p>
            <p className="text-white text-2xl font-bold mt-1">to study / learn</p>
            <div className="mt-3 flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className={`h-2.5 rounded-sm transition-all duration-500 ${step <= progress ? "w-7 bg-emerald-500" : "w-6 bg-neutral-800"}`} />
              ))}
              <span className="text-xs text-gray-400 ml-1">{progress}/5 ⭐</span>
            </div>
          </div>
        </div>
        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <div className="h-12 rounded-xl border border-red-900/40 bg-neutral-950 flex items-center justify-center gap-2 text-red-400 text-sm font-bold">
            ✗ Forgot it
          </div>
          <div className="h-12 rounded-xl border border-emerald-900/40 bg-neutral-950 flex items-center justify-center gap-2 text-emerald-400 text-sm font-bold">
            ✓ Got it
          </div>
        </div>
        <div className="h-11 rounded-xl border border-yellow-900/30 bg-neutral-950 flex items-center justify-center gap-2 text-yellow-400 text-sm font-semibold">
          ⭐ Learned it
        </div>
      </div>
    </div>
  );
}

function FlashcardPreview() {
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [unknown] = useState(0);
  const [card, setCard] = useState(0);
  const cards = [
    { h: "明天", p: "míng tiān", e: "tomorrow", parts: [{ c: "明", p: "míng" }, { c: "天", p: "tiān" }] },
    { h: "朋友", p: "péng yǒu", e: "friend", parts: [{ c: "朋", p: "péng" }, { c: "友", p: "yǒu" }] },
  ];
  const current = cards[card % cards.length];

  useEffect(() => {
    const t1 = setTimeout(() => setFlipped(true), 1000);
    const t2 = setTimeout(() => { setKnown(k => k + 1); setFlipped(false); setCard(c => c + 1); }, 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const progress = ((card) / 8) * 100;

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="absolute -inset-4 bg-blue-600/10 rounded-3xl blur-2xl" />
      <div className="relative space-y-3">
        {/* Progress */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Card {card + 1} of 8</span>
            <span>✅ {known} · ❌ {unknown}</span>
          </div>
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
        {/* Card */}
        <div className="relative bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl h-48 flex flex-col items-center justify-center overflow-hidden">
          {/* Glow top-right */}
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
          <div className="absolute top-3 left-4">
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">HSK 1</span>
          </div>
          <div className={`flex flex-col items-center transition-all duration-300 ${flipped ? "opacity-30 scale-75 -translate-y-6" : ""}`}>
            <div className="flex items-end justify-center gap-1">
              {current.parts.map((x, i) => (
                <HoverCharacter key={`${card}-${i}`} char={x.c} pinyin={x.p} size="xl" wordId={`lp-f-${card}-${i}`} />
              ))}
            </div>
            {!flipped && <p className="text-gray-600 text-xs mt-3">Tap to reveal</p>}
          </div>
          {flipped && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/95">
              <p className="text-red-400 font-medium">{current.p}</p>
              <p className="text-white text-xl font-bold mt-1">{current.e}</p>
            </div>
          )}
        </div>
        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <div className="h-12 rounded-xl border border-red-900/40 bg-neutral-950 flex items-center justify-center text-red-400 text-sm font-semibold">❌ Still Learning</div>
          <div className="h-12 rounded-xl border border-emerald-900/40 bg-neutral-950 flex items-center justify-center text-emerald-400 text-sm font-semibold">✅ I Know This</div>
        </div>
      </div>
    </div>
  );
}

function QuizPreview() {
  const [selected, setSelected] = useState<number | null>(null);
  const correct = 0;
  const options = ["Tomorrow", "Yesterday", "Morning", "Night"];

  useEffect(() => {
    const t1 = setTimeout(() => setSelected(0), 1200);
    return () => clearTimeout(t1);
  }, []);

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="absolute -inset-4 bg-yellow-600/10 rounded-3xl blur-2xl" />
      <div className="relative space-y-3">
        {/* Progress */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Question 4 of 10</span>
            <span>Score: 3/3</span>
          </div>
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full" style={{ width: "40%" }} />
          </div>
        </div>
        {/* Question card */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl p-6 text-center relative overflow-hidden">
          <div className="absolute -top-6 -left-6 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl" />
          <p className="text-xs text-gray-500 mb-3">What does this mean?</p>
          <div className="flex items-end justify-center gap-1">
            {[{ c: "明", p: "míng" }, { c: "天", p: "tiān" }].map((x, i) => (
              <HoverCharacter key={i} char={x.c} pinyin={x.p} size="xl" wordId={`lp-q-${i}`} />
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-3">Hover / tap characters for pinyin</p>
        </div>
        {/* Options */}
        <div className="space-y-2">
          {options.map((opt, idx) => {
            let cls = "h-11 rounded-xl border flex items-center px-4 text-sm transition-all duration-300 ";
            if (selected === null) {
              cls += "border-neutral-800 bg-neutral-950/50 text-gray-300";
            } else if (idx === correct) {
              cls += "border-emerald-600/60 bg-emerald-950/40 text-emerald-300 font-semibold";
            } else if (idx === selected && idx !== correct) {
              cls += "border-red-600/60 bg-red-950/40 text-red-300";
            } else {
              cls += "border-neutral-800/40 bg-neutral-950/30 text-gray-600";
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
    </div>
  );
}

// ─── Section data ─────────────────────────────────────────────────────────────

interface SectionConfig {
  id: ModeId | "hero";
  label: string;
  color: string;
}

const SECTIONS: SectionConfig[] = [
  { id: "hero", label: "Home", color: "bg-gray-400" },
  { id: "browse", label: "Browse", color: "bg-red-500" },
  { id: "practice", label: "Practice", color: "bg-orange-500" },
  { id: "flashcards", label: "Flashcards", color: "bg-blue-500" },
  { id: "quiz", label: "Quiz", color: "bg-yellow-500" },
];

// ─── Scroll helpers ───────────────────────────────────────────────────────────

function useActiveSection(containerRef: React.RefObject<HTMLDivElement>) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onScroll = () => {
      const children = Array.from(container.children) as HTMLElement[];
      const mid = container.scrollTop + container.clientHeight / 2;
      let found = 0;
      children.forEach((el, i) => {
        if (el.offsetTop <= mid) found = i;
      });
      setActive(found);
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [containerRef]);

  return active;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LandingPage({ onSelectMode }: LandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null!);
  const active = useActiveSection(containerRef);

  const scrollTo = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const children = Array.from(container.children) as HTMLElement[];
    if (children[index]) {
      children[index].scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const scrollNext = useCallback(() => scrollTo(Math.min(active + 1, SECTIONS.length - 1)), [active, scrollTo]);
  const scrollPrev = useCallback(() => scrollTo(Math.max(active - 1, 0)), [active, scrollTo]);

  return (
    <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
      {/* Dot nav */}
      <div className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2.5">
        {SECTIONS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => scrollTo(i)}
            title={s.label}
            className={`rounded-full transition-all duration-300 ${
              active === i
                ? `w-3 h-3 ${s.color} shadow-lg`
                : "w-2 h-2 bg-neutral-600 hover:bg-neutral-400"
            }`}
          />
        ))}
      </div>

      {/* Scroll container */}
      <div
        ref={containerRef}
        className="h-[calc(100dvh-4rem)] overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {/* ── HERO ── */}
        <section
          className="snap-start h-[calc(100dvh-4rem)] flex flex-col items-center justify-center relative overflow-hidden px-4"
          style={{ scrollSnapAlign: "start" }}
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-black to-neutral-950" />
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-600/8 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-red-400/6 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600 rounded-3xl shadow-2xl shadow-red-900/50 mb-8">
              <span className="text-white text-4xl font-bold">汉</span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white leading-none">
              Learn Mandarin
            </h1>
            <p className="mt-3 text-xl sm:text-2xl font-light text-red-400">
              One focused session at a time.
            </p>
            <p className="mt-5 text-gray-400 max-w-lg mx-auto leading-relaxed">
              HSK vocabulary with real example sentences, per-character pinyin hover, audio, and multiple study modes.
            </p>

            {/* Live pinyin demo */}
            <div className="mt-8 inline-flex items-end gap-2 px-6 py-4 rounded-2xl bg-neutral-900/80 border border-neutral-700 shadow-xl">
              {[{ c: "你", p: "nǐ" }, { c: "好", p: "hǎo" }, { c: "！", p: "" }].map((x, i) => (
                <HoverCharacter key={i} char={x.c} pinyin={x.p} size="xl" wordId={`hero-${i}`} />
              ))}
              <span className="ml-3 text-xs text-gray-500 self-center">← hover / tap</span>
            </div>

            {/* Stats */}
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              {["450+ Words", "1000+ Examples", "4 Study Modes", "HSK 1 & 2"].map((s) => (
                <span key={s} className="px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800">{s}</span>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => onSelectMode("practice")}
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors shadow-lg shadow-red-900/30"
              >
                Start Practicing
              </button>
              <button
                onClick={() => scrollTo(1)}
                className="px-6 py-3 rounded-xl bg-neutral-900 border border-neutral-700 text-gray-200 hover:bg-neutral-800 transition-colors"
              >
                Explore Modes ↓
              </button>
            </div>
          </div>

          {/* Scroll down indicator */}
          <button
            onClick={scrollNext}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-600 hover:text-gray-300 transition-colors animate-bounce"
          >
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </section>

        {/* ── MODE SECTIONS ── */}
        {(
          [
            {
              id: "browse" as ModeId,
              icon: "📚",
              title: "Browse",
              subtitle: "Search. Filter. Learn.",
              description: "Explore the full HSK vocabulary with fast filtering by level, category, and learning status. Flip cards for meanings, expand example sentences, and hover or tap any character for its pinyin reading.",
              bullets: ["Filter by HSK level, category, learned/still-learning", "Click cards to reveal pinyin + English", "Expand 1–3 real Tatoeba example sentences per word", "Hover (desktop) or tap (mobile) for per-character pinyin"],
              gradient: "from-red-950/20 via-black to-black",
              accent: "red",
              Preview: BrowsePreview,
            },
            {
              id: "practice" as ModeId,
              icon: "🔥",
              title: "Practice",
              subtitle: "Short sessions. Real progress.",
              description: "A focused 10-card session mixing new words with review. A 5-level mastery bar tracks confidence per word. Mark words Learned when you're ready to clear them from the session.",
              bullets: ["10 cards per session: 8 new + 2 review", "0–5 progress bar per word with visual feedback", "Got it / Forgot it adjusts difficulty", "Swipe gestures on mobile (left / right / up)"],
              gradient: "from-orange-950/20 via-black to-black",
              accent: "orange",
              Preview: PracticePreview,
            },
            {
              id: "flashcards" as ModeId,
              icon: "🃏",
              title: "Flashcards",
              subtitle: "Fast repetition. Instant recall.",
              description: "Drill through shuffled cards at your own pace. Mark each word as Learned or Still Learning. Filter by HSK level or learning status to focus your session.",
              bullets: ["Tap card to reveal meaning + examples", "I Know This / Still Learning tracking", "Filter by learned / still-learning status", "Swipe left or right on mobile"],
              gradient: "from-blue-950/20 via-black to-black",
              accent: "blue",
              Preview: FlashcardPreview,
            },
            {
              id: "quiz" as ModeId,
              icon: "✏️",
              title: "Quiz",
              subtitle: "Test your recall.",
              description: "10-question multiple choice quizzes to keep your knowledge honest. Hover or tap the hanzi to check pinyin before answering.",
              bullets: ["10 questions per round", "4 answer options per question", "Instant feedback: green correct / red wrong", "Score tracking with emoji rating"],
              gradient: "from-yellow-950/15 via-black to-black",
              accent: "yellow",
              Preview: QuizPreview,
            },
          ] as const
        ).map((mode, idx) => {
          const isEven = idx % 2 === 0;
          const accentColor: Record<string, string> = {
            red: "text-red-400",
            orange: "text-orange-400",
            blue: "text-blue-400",
            yellow: "text-yellow-400",
          };
          const bulletColor: Record<string, string> = {
            red: "bg-red-500/60",
            orange: "bg-orange-500/60",
            blue: "bg-blue-500/60",
            yellow: "bg-yellow-500/60",
          };
          const btnColor: Record<string, string> = {
            red: "bg-red-600 hover:bg-red-700 shadow-red-900/30",
            orange: "bg-orange-600 hover:bg-orange-700 shadow-orange-900/30",
            blue: "bg-blue-600 hover:bg-blue-700 shadow-blue-900/30",
            yellow: "bg-yellow-600 hover:bg-yellow-700 shadow-yellow-900/30",
          };

          return (
            <section
              key={mode.id}
              className={`snap-start h-[calc(100dvh-4rem)] flex items-center relative overflow-hidden bg-gradient-to-b ${mode.gradient}`}
              style={{ scrollSnapAlign: "start" }}
            >
              {/* Decorative blur */}
              <div className={`absolute -top-20 ${isEven ? "-right-20" : "-left-20"} w-72 h-72 rounded-full blur-3xl opacity-20`}
                style={{ background: mode.accent === "red" ? "#dc2626" : mode.accent === "orange" ? "#ea580c" : mode.accent === "blue" ? "#2563eb" : "#ca8a04" }}
              />

              <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${isEven ? "" : "lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1"}`}>
                  {/* Text */}
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <span className="text-4xl">{mode.icon}</span>
                      <span className={`text-xs font-bold tracking-widest uppercase ${accentColor[mode.accent]}`}>Study Mode</span>
                    </div>
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
                      {mode.title}
                    </h2>
                    <p className={`mt-2 text-lg font-semibold ${accentColor[mode.accent]}`}>{mode.subtitle}</p>
                    <p className="mt-4 text-gray-400 leading-relaxed max-w-lg">{mode.description}</p>

                    <ul className="mt-6 space-y-2.5">
                      {mode.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-3 text-sm text-gray-400">
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${bulletColor[mode.accent]}`} />
                          {b}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-8 flex flex-wrap gap-3">
                      <button
                        onClick={() => onSelectMode(mode.id)}
                        className={`px-6 py-3 rounded-xl text-white font-semibold transition-colors shadow-lg ${btnColor[mode.accent]}`}
                      >
                        Open {mode.title} →
                      </button>
                    </div>
                  </div>

                  {/* Preview */}
                  <div>
                    <mode.Preview />
                  </div>
                </div>
              </div>

              {/* Scroll buttons */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
                {idx > 0 && (
                  <button
                    onClick={scrollPrev}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors px-3 py-1.5 rounded-full bg-neutral-900/60 border border-neutral-800 hover:border-neutral-600"
                  >
                    <svg className="w-3.5 h-3.5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    {SECTIONS[idx].label}
                  </button>
                )}
                {idx < 3 && (
                  <button
                    onClick={scrollNext}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors px-3 py-1.5 rounded-full bg-neutral-900/60 border border-neutral-800 hover:border-neutral-600 animate-pulse"
                  >
                    {SECTIONS[idx + 2]?.label}
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>
            </section>
          );
        })}

        {/* ── FOOTER CTA ── */}
        <section
          className="snap-start h-[calc(100dvh-4rem)] flex items-center justify-center relative overflow-hidden bg-black"
          style={{ scrollSnapAlign: "start" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-950/10 via-black to-black" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/5 rounded-full blur-3xl" />

          <div className="relative z-10 text-center max-w-2xl mx-auto px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl shadow-xl shadow-red-900/40 mb-6">
              <span className="text-white text-2xl font-bold">汉</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white">Ready to start?</h2>
            <p className="mt-4 text-gray-400">Pick a mode and begin your first session. Progress is saved locally.</p>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "browse" as ModeId, icon: "📚", label: "Browse", color: "border-red-900/40 hover:border-red-700/60 hover:bg-red-950/20" },
                { id: "practice" as ModeId, icon: "🔥", label: "Practice", color: "border-orange-900/40 hover:border-orange-700/60 hover:bg-orange-950/20" },
                { id: "flashcards" as ModeId, icon: "🃏", label: "Flashcards", color: "border-blue-900/40 hover:border-blue-700/60 hover:bg-blue-950/20" },
                { id: "quiz" as ModeId, icon: "✏️", label: "Quiz", color: "border-yellow-900/40 hover:border-yellow-700/60 hover:bg-yellow-950/20" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => onSelectMode(m.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl bg-neutral-900 border transition-all ${m.color}`}
                >
                  <span className="text-2xl">{m.icon}</span>
                  <span className="text-sm font-semibold text-gray-200">{m.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={scrollPrev}
              className="mt-10 text-xs text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1 mx-auto"
            >
              <svg className="w-3 h-3 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Back to top
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
