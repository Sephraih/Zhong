import { useState, useMemo, useEffect, useRef, useCallback, useTransition } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import {
  buildFallbackVocabulary,
  fetchVocabularyFromSupabase,
  loadCachedSupabaseVocabulary,
} from "./data/supabaseVocab";
import type { VocabWord } from "./data/vocabulary";
import { VocabCard } from "./components/VocabCard";
import { FlashcardMode } from "./components/FlashcardMode";
import type { FlashcardFilter } from "./components/FlashcardMode";
import { QuizMode } from "./components/QuizMode";
import { PracticeMode } from "./components/PracticeMode";
import { useLearnedState } from "./hooks/useLearnedState";
import { AuthModal } from "./components/AuthModal";
import { AuthHeader } from "./components/AuthHeader";
import { ProfilePage } from "./components/ProfilePage";
import { LandingPage } from "./components/LandingPage";
import { AppBackground } from "./components/AppBackground";
import { useIsMobile } from "./hooks/useIsMobile";

// Mobile-only compact user button
function MobileUserButton({
  onOpenAuth,
  onOpenProfile,
}: {
  onOpenAuth: (mode: "login" | "signup") => void;
  onOpenProfile: () => void;
}) {
  const { user, isPremium } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (!user) {
    return (
      <button
        onClick={() => onOpenAuth("login")}
        className="sm:hidden w-9 h-9 flex items-center justify-center rounded-full bg-neutral-800 border border-neutral-700 text-gray-400 hover:text-white hover:border-neutral-600 transition-all"
        title="Sign in"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="sm:hidden relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${
          isPremium
            ? "bg-gradient-to-br from-yellow-500 to-yellow-700 text-black"
            : "bg-gradient-to-br from-red-600 to-red-800 text-white"
        }`}
        title="Profile"
      >
        <span className="text-sm font-bold">{user.email?.charAt(0).toUpperCase()}</span>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 mt-2 w-40 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl z-20 overflow-hidden">
            <button
              onClick={() => {
                setShowMenu(false);
                onOpenProfile();
              }}
              className="w-full px-4 py-3 text-left text-sm text-gray-200 hover:bg-neutral-800 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </button>
          </div>
        </>
      )}
    </div>
  );
}

type ViewMode = "home" | "browse" | "flashcards" | "quiz" | "practice" | "profile";
type HSKFilter = "all" | 1 | 2;
type StatusFilter = "all" | "learned" | "still-learning";

const FALLBACK_VOCABULARY = buildFallbackVocabulary();

function signature(words: VocabWord[]): string {
  if (!words.length) return "0";
  const first = words[0]?.id ?? 0;
  const last = words[words.length - 1]?.id ?? 0;
  return `${words.length}:${first}:${last}`;
}

function AppContent() {
  const isMobile = useIsMobile();
  const [isPending, startTransition] = useTransition();

  // 1) Load from localStorage cache synchronously if present.
  // 2) Otherwise show fallback immediately.
  const initial = useMemo(() => {
    const cached = loadCachedSupabaseVocabulary();
    if (cached?.words?.length) {
      return { words: cached.words, source: "supabase" as const };
    }
    return { words: FALLBACK_VOCABULARY, source: "fallback" as const };
  }, []);

  const [vocabulary, setVocabulary] = useState<VocabWord[]>(initial.words);
  const [dataSource, setDataSource] = useState<"fallback" | "supabase">(initial.source);
  const sigRef = useRef(signature(initial.words));
  const hadSupabaseCacheRef = useRef(initial.source === "supabase");

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");

  // Mobile: auto-hide header on scroll down, show on scroll up
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  const handleScroll = useCallback(() => {
    if (!isMobile) return;
    const currentY = window.scrollY;
    if (currentY > lastScrollY.current && currentY > 60) {
      setHeaderVisible(false);
    } else if (currentY < lastScrollY.current) {
      setHeaderVisible(true);
    }
    lastScrollY.current = currentY;
  }, [isMobile]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Stable viewport height for mobile cards:
  // Mobile browser chrome (address bar) can change the effective viewport height while scrolling,
  // which causes dvh/vh based layouts to jitter. We set a stable CSS var once and only update on
  // orientation changes.
  useEffect(() => {
    const setInnerH = () => {
      document.documentElement.style.setProperty("--app-inner-h", `${window.innerHeight}px`);
    };

    setInnerH();

    if (isMobile) {
      const onOrientation = () => {
        // give the browser a moment to settle
        setTimeout(setInnerH, 250);
      };
      window.addEventListener("orientationchange", onOrientation);
      return () => {
        window.removeEventListener("orientationchange", onOrientation);
      };
    }

    // Desktop/tablet: keep it updated with resize.
    window.addEventListener("resize", setInnerH);
    return () => {
      window.removeEventListener("resize", setInnerH);
    };
  }, [isMobile]);

  // Background refresh:
  // - If we started from cache, bypass cache to fetch fresh data.
  // - If we started from fallback, use cache if available.
  // Avoid redundant swaps by comparing signatures.
  useEffect(() => {
    let cancelled = false;

    const loadFromSupabase = async () => {
      try {
        const result = await fetchVocabularyFromSupabase({
          bypassCache: hadSupabaseCacheRef.current,
        });

        if (cancelled) return;
        if (result.source !== "supabase" || result.words.length === 0) return;

        const nextSig = signature(result.words);
        if (nextSig === sigRef.current) return;

        sigRef.current = nextSig;
        startTransition(() => {
          setVocabulary(result.words);
          setDataSource("supabase");
        });
      } catch (err) {
        console.warn("[App] Supabase fetch failed, keeping current data:", err);
      }
    };

    loadFromSupabase();

    return () => {
      cancelled = true;
    };
  }, [startTransition]);

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>("home");
  const [hskFilter, setHskFilter] = useState<HSKFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [flashcardKey, setFlashcardKey] = useState(0);
  const [flashcardStatusFilter, setFlashcardStatusFilter] = useState<FlashcardFilter>("all");
  const [quizKey, setQuizKey] = useState(0);

  // Browse pagination (major perf win)
  const [browsePage, setBrowsePage] = useState(1);
  const browsePageSize = isMobile ? 18 : 30;

  const learnedState = useLearnedState();
  const { isLearned, toggleLearned, learnedCount } = learnedState;

  const hsk1Count = useMemo(() => vocabulary.filter((w) => w.hskLevel === 1).length, [vocabulary]);
  const hsk2Count = useMemo(() => vocabulary.filter((w) => w.hskLevel === 2).length, [vocabulary]);

  const stillLearningCount = vocabulary.length - learnedCount;

  const categories = useMemo(() => {
    const cats = new Set<string>();
    vocabulary.forEach((w) => cats.add(w.category));
    return Array.from(cats).sort();
  }, [vocabulary]);

  const filteredWords = useMemo(() => {
    return vocabulary.filter((word) => {
      if (hskFilter !== "all" && word.hskLevel !== hskFilter) return false;
      if (categoryFilter !== "all" && word.category !== categoryFilter) return false;
      if (statusFilter === "learned" && !isLearned(word.id)) return false;
      if (statusFilter === "still-learning" && isLearned(word.id)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          word.hanzi.includes(searchQuery) ||
          word.pinyin.toLowerCase().includes(q) ||
          word.english.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [vocabulary, hskFilter, categoryFilter, searchQuery, statusFilter, isLearned]);

  // Reset pagination when the user changes filters/search.
  useEffect(() => {
    setBrowsePage(1);
  }, [hskFilter, categoryFilter, searchQuery, statusFilter]);

  const visibleWords = useMemo(() => {
    return filteredWords.slice(0, browsePage * browsePageSize);
  }, [filteredWords, browsePage, browsePageSize]);

  const canLoadMore = visibleWords.length < filteredWords.length;

  const activeWords = useMemo(() => {
    if (hskFilter === "all") return vocabulary;
    return vocabulary.filter((w) => w.hskLevel === hskFilter);
  }, [vocabulary, hskFilter]);

  const openAuthModal = (mode: "login" | "signup") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const navigate = (mode: ViewMode) => {
    setViewMode(mode);

    // Mobile UX: when switching modes, reset scroll position.
    // Otherwise the new mode renders at whatever scrollY the landing page was at.
    if (isMobile) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      });
    }
  };

  // Show background on all modes except home (landing page has its own background)
  const showAppBackground = viewMode !== "home";

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Global background for all modes except landing page */}
      {showAppBackground && <AppBackground darken />}
      {/* Header — hides on scroll down on mobile */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-xl border-b border-neutral-800 transition-all duration-300 ${
          showAppBackground ? "bg-neutral-950/80" : "bg-neutral-950/90"
        } ${
          !headerVisible && isMobile
            ? "-translate-y-full opacity-0 pointer-events-none"
            : "translate-y-0 opacity-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => {
                navigate("home");
              }}
              className="flex items-center gap-2 sm:gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600/40"
              title="Go to Home"
            >
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-red-600 rounded-xl shadow-lg shadow-red-900/40">
                <span className="text-white text-sm sm:text-lg font-bold">汉</span>
              </div>
              <div className="hidden sm:block text-left">
                <h1 className="text-lg font-bold text-white leading-tight">汉语学习</h1>
                <p className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">Chinese Learning</p>
              </div>
            </button>

            {/* Mode Nav — visible on both mobile and desktop */}
            <nav className="flex items-center gap-0.5 sm:gap-1">
              {[
                { id: "browse" as ViewMode, label: "Browse", icon: "📚" },
                { id: "practice" as ViewMode, label: "Practice", icon: "🔥" },
                { id: "flashcards" as ViewMode, label: "Cards", icon: "🃏" },
                { id: "quiz" as ViewMode, label: "Quiz", icon: "✏️" },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => navigate(mode.id)}
                  className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    viewMode === mode.id
                      ? "bg-red-600 text-white shadow-md shadow-red-900/30"
                      : "text-gray-400 hover:bg-neutral-800 hover:text-white"
                  }`}
                  title={mode.label}
                >
                  {/* Show only icon on mobile, icon+label on desktop */}
                  <span className="sm:hidden">{mode.icon}</span>
                  <span className="hidden sm:inline">{mode.icon} {mode.label}</span>
                </button>
              ))}
            </nav>

            {/* Auth Section — compact on mobile */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Desktop: full auth header */}
              <div className="hidden sm:block">
                <AuthHeader onOpenAuth={openAuthModal} onOpenProfile={() => navigate("profile")} />
              </div>
              
              {/* Mobile: small user icon */}
              <MobileUserButton onOpenAuth={openAuthModal} onOpenProfile={() => navigate("profile")} />
            </div>
          </div>
        </div>
      </header>

      {/* Stats Banner */}
      <div className={`border-b border-neutral-800/60 relative z-10 ${showAppBackground ? "bg-neutral-950/70 backdrop-blur-sm" : "bg-neutral-950"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 sm:gap-6 items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30" />
                <span className="text-sm text-gray-500">
                  HSK 1: <span className="font-bold text-gray-300">{hsk1Count}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/30" />
                <span className="text-sm text-gray-500">
                  HSK 2: <span className="font-bold text-gray-300">{hsk2Count}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/30" />
                <span className="text-sm text-gray-500">
                  Total: <span className="font-bold text-gray-300">{vocabulary.length}</span>
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-gray-600">|</span>
                <span className="text-sm text-gray-500">
                  ✅ Learned: <span className="font-bold text-emerald-400">{learnedCount}</span>
                </span>
                <span className="text-sm text-gray-500">
                  📖 Learning: <span className="font-bold text-red-400">{stillLearningCount}</span>
                </span>
              </div>

              {/* Data source indicator */}
              {dataSource === "fallback" && (
                <span className="hidden sm:inline-flex text-xs text-yellow-600 bg-yellow-950/50 px-2 py-0.5 rounded-full border border-yellow-800/50">
                  ⚡ Preview
                </span>
              )}

              {isPending && (
                <span className="hidden sm:inline-flex text-xs text-gray-400 bg-neutral-900 px-2 py-0.5 rounded-full border border-neutral-800">
                  Syncing…
                </span>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <div className="w-32 h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${vocabulary.length > 0 ? (learnedCount / vocabulary.length) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {vocabulary.length > 0 ? Math.round((learnedCount / vocabulary.length) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {viewMode === "home" && <LandingPage onSelectMode={(mode) => navigate(mode)} />}

        {viewMode === "profile" && (
          <ProfilePage
            totalWords={vocabulary.length}
            learnedCount={learnedCount}
            stillLearningCount={stillLearningCount}
            onBack={() => navigate("browse")}
          />
        )}

        {viewMode === "browse" && (
          <>
            {/* Filters */}
            <div className="mb-8 space-y-4">
              {/* Search */}
              <div className="relative max-w-md">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search in Chinese, Pinyin, or English..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/50 transition-all"
                />
              </div>

              {/* Level + Status filters */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider self-center mr-1">Level:</span>
                {[
                  { value: "all" as HSKFilter, label: "All Levels" },
                  { value: 1 as HSKFilter, label: `HSK 1 (${hsk1Count})` },
                  { value: 2 as HSKFilter, label: `HSK 2 (${hsk2Count})` },
                ].map((filter) => (
                  <button
                    key={String(filter.value)}
                    onClick={() => setHskFilter(filter.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      hskFilter === filter.value
                        ? "bg-red-600 text-white shadow-sm"
                        : "bg-neutral-900 text-gray-400 border border-neutral-800 hover:border-red-800/60 hover:text-white"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}

                <div className="w-px h-6 bg-neutral-800 self-center mx-1" />

                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider self-center mr-1">Status:</span>
                {[
                  { value: "all" as StatusFilter, label: `All Words (${vocabulary.length})`, icon: "📋" },
                  { value: "still-learning" as StatusFilter, label: `Still Learning (${stillLearningCount})`, icon: "📖" },
                  { value: "learned" as StatusFilter, label: `Learned (${learnedCount})`, icon: "✅" },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      statusFilter === filter.value
                        ? filter.value === "learned"
                          ? "bg-emerald-700 text-white shadow-sm"
                          : "bg-red-600 text-white shadow-sm"
                        : "bg-neutral-900 text-gray-400 border border-neutral-800 hover:border-red-800/60 hover:text-white"
                    }`}
                  >
                    {filter.icon} {filter.label}
                  </button>
                ))}
              </div>

              {/* Category filter */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider self-center mr-1">Category:</span>
                <button
                  onClick={() => setCategoryFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    categoryFilter === "all"
                      ? "bg-red-600 text-white shadow-sm"
                      : "bg-neutral-900 text-gray-400 border border-neutral-800 hover:border-red-800/60 hover:text-white"
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      categoryFilter === cat
                        ? "bg-red-600 text-white shadow-sm"
                        : "bg-neutral-900 text-gray-400 border border-neutral-800 hover:border-red-800/60 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Results count */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-300">{visibleWords.length}</span> of{" "}
                <span className="font-semibold text-gray-300">{filteredWords.length}</span> results
              </p>
              {filteredWords.length > browsePageSize && (
                <p className="text-xs text-gray-600">(Paged for performance)</p>
              )}
            </div>

            {/* Word Grid */}
            {filteredWords.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleWords.map((word) => (
                    <VocabCard
                      key={word.id}
                      word={word}
                      isLearned={isLearned(word.id)}
                      onToggleLearned={toggleLearned}
                    />
                  ))}
                </div>

                {canLoadMore && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={() => setBrowsePage((p) => p + 1)}
                      className="px-6 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-gray-200 hover:border-neutral-700 hover:bg-neutral-800 transition-colors"
                    >
                      Load more
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-5xl mb-4">🔍</p>
                <p className="text-gray-400 text-lg">No words found matching your filters.</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setHskFilter("all");
                    setCategoryFilter("all");
                    setStatusFilter("all");
                  }}
                  className="mt-4 text-red-400 font-medium hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </>
        )}

        {viewMode === "practice" && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">🔥 Practice Session</h2>
            </div>
            <PracticeMode allWords={vocabulary} learnedState={learnedState} />
          </div>
        )}

        {viewMode === "flashcards" && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">🃏 Flashcard Mode</h2>
              <p className="text-gray-400">Tap to reveal · Hover characters for pinyin</p>

              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider self-center mr-1">Level:</span>
                {[
                  { value: "all" as HSKFilter, label: "All" },
                  { value: 1 as HSKFilter, label: `HSK 1 (${hsk1Count})` },
                  { value: 2 as HSKFilter, label: `HSK 2 (${hsk2Count})` },
                ].map((filter) => (
                  <button
                    key={String(filter.value)}
                    onClick={() => {
                      setHskFilter(filter.value);
                      setFlashcardKey((k) => k + 1);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      hskFilter === filter.value
                        ? "bg-red-600 text-white"
                        : "bg-neutral-900 text-gray-400 border border-neutral-800"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-2 mt-3">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider self-center mr-1">Words:</span>
                {[
                  { value: "all" as FlashcardFilter, label: "All Words", icon: "📋" },
                  { value: "still-learning" as FlashcardFilter, label: "Still Learning", icon: "📖" },
                  { value: "learned" as FlashcardFilter, label: "Learned", icon: "✅" },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      setFlashcardStatusFilter(filter.value);
                      setFlashcardKey((k) => k + 1);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      flashcardStatusFilter === filter.value
                        ? filter.value === "learned"
                          ? "bg-emerald-700 text-white"
                          : "bg-red-600 text-white"
                        : "bg-neutral-900 text-gray-400 border border-neutral-800"
                    }`}
                  >
                    {filter.icon} {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <FlashcardMode
              key={`fc-${flashcardKey}`}
              words={activeWords}
              learnedState={learnedState}
              wordStatusFilter={flashcardStatusFilter}
            />
          </div>
        )}

        {viewMode === "quiz" && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">✏️ Quiz Mode</h2>
              <p className="text-gray-400">Test your knowledge with multiple choice questions!</p>

              <div className="flex justify-center gap-2 mt-4">
                {[
                  { value: "all" as HSKFilter, label: "All" },
                  { value: 1 as HSKFilter, label: `HSK 1 (${hsk1Count})` },
                  { value: 2 as HSKFilter, label: `HSK 2 (${hsk2Count})` },
                ].map((filter) => (
                  <button
                    key={String(filter.value)}
                    onClick={() => {
                      setHskFilter(filter.value);
                      setQuizKey((k) => k + 1);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      hskFilter === filter.value
                        ? "bg-red-600 text-white"
                        : "bg-neutral-900 text-gray-400 border border-neutral-800"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <QuizMode key={`quiz-${quizKey}`} words={activeWords} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t border-neutral-800 mt-16 relative z-10 ${showAppBackground ? "bg-neutral-950/80 backdrop-blur-sm" : "bg-neutral-950"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">🇨🇳 汉语学习 — Chinese Language Learning — HSK 1 & 2 Vocabulary</p>
            <p className="text-xs text-gray-600 mt-1">
              {vocabulary.length} words • ✅ {learnedCount} learned • 📖 {stillLearningCount} still learning
              {dataSource === "fallback" && " • ⚡ Preview mode"}
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} initialMode={authModalMode} />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
