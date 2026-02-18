import { useState, useMemo, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { fetchVocabularyFromSupabase, buildFallbackVocabulary } from "./data/supabaseVocab";
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

type ViewMode = "home" | "browse" | "flashcards" | "quiz" | "practice" | "profile";
type HSKFilter = "all" | 1 | 2;
type StatusFilter = "all" | "learned" | "still-learning";

// ─── Error / fallback screen ──────────────────────────────────────────────────
function ErrorScreen({
  onRetry,
  onUseFallback,
}: {
  onRetry: () => void;
  onUseFallback: () => void;
}) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-5xl">⚠️</div>
      <div className="text-center max-w-md">
        <p className="text-white text-xl font-bold mb-2">Could not load vocabulary</p>
        <p className="text-gray-400 text-sm">
          Unable to reach the database. Check your internet connection or Supabase
          environment variables.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
        >
          Retry
        </button>
        <button
          onClick={onUseFallback}
          className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-gray-200 rounded-xl font-semibold transition-colors"
        >
          Use offline preview (10 words)
        </button>
      </div>
    </div>
  );
}

// ─── Main app content ─────────────────────────────────────────────────────────
function AppContent() {
  const { error: authError, clearError } = useAuth();

  // ── Data loading state — start with fallback immediately (synchronous) ──
  const [vocabulary, setVocabulary] = useState<VocabWord[]>(() => buildFallbackVocabulary());
  const [hsk1Count, setHsk1Count] = useState<number>(() => {
    const fb = buildFallbackVocabulary();
    return fb.filter((w) => w.hskLevel === 1).length;
  });
  const [hsk2Count, setHsk2Count] = useState<number>(() => {
    const fb = buildFallbackVocabulary();
    return fb.filter((w) => w.hskLevel === 2).length;
  });
  const [dataSource, setDataSource] = useState<"supabase" | "fallback">("fallback");
  const [dataError, setDataError] = useState(false);

  // ── UI state ──
  const [viewMode, setViewMode] = useState<ViewMode>("home");
  const [hskFilter, setHskFilter] = useState<HSKFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [flashcardKey, setFlashcardKey] = useState(0);
  const [flashcardStatusFilter, setFlashcardStatusFilter] = useState<FlashcardFilter>("all");
  const [quizKey, setQuizKey] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");

  const learnedState = useLearnedState();
  const { isLearned, toggleLearned, learnedCount } = learnedState;

  // ── Load vocabulary — fallback shown immediately, Supabase upgrades silently ──
  const loadVocabulary = async () => {
    const result = await fetchVocabularyFromSupabase();
    if (result.words.length > 0) {
      setVocabulary(result.words);
      setHsk1Count(result.hsk1Count);
      setHsk2Count(result.hsk2Count);
      setDataSource("supabase");
    }
  };

  const useFallbackData = () => {
    const fallback = buildFallbackVocabulary();
    setVocabulary(fallback);
    setHsk1Count(fallback.filter((w: VocabWord) => w.hskLevel === 1).length);
    setHsk2Count(fallback.filter((w: VocabWord) => w.hskLevel === 2).length);
    setDataSource("fallback");
    setDataError(false);
  };

  useEffect(() => {
    // App already renders with fallback data (set in useState initializer).
    // Try Supabase in the background — silently upgrades if successful.
    fetchVocabularyFromSupabase().then((result) => {
      if (result.words.length > 0) {
        setVocabulary(result.words);
        setHsk1Count(result.hsk1Count);
        setHsk2Count(result.hsk2Count);
        setDataSource("supabase");
      }
      // Supabase unavailable → silently keep fallback, no error shown
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived data ──
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

  const stillLearningCount = vocabulary.length - learnedCount;

  const activeWords = useMemo(() => {
    if (hskFilter === "all") return vocabulary;
    return vocabulary.filter((w) => w.hskLevel === hskFilter);
  }, [vocabulary, hskFilter]);

  const openAuthModal = (mode: "login" | "signup") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  // ── Render error state (only if explicitly triggered) ──
  if (dataError) return <ErrorScreen onRetry={loadVocabulary} onUseFallback={useFallbackData} />;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => { setViewMode("home"); setMobileMenuOpen(false); }}
              className="flex items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600/40"
              title="Go to Home"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-red-600 rounded-xl shadow-lg shadow-red-900/40">
                <span className="text-white text-lg font-bold">汉</span>
              </div>
              <div className="hidden sm:block text-left">
                <h1 className="text-lg font-bold text-white leading-tight">汉语学习</h1>
                <p className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">Chinese Learning</p>
              </div>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                { id: "browse" as ViewMode, label: "📚 Browse" },
                { id: "practice" as ViewMode, label: "🔥 Practice" },
                { id: "flashcards" as ViewMode, label: "🃏 Flashcards" },
                { id: "quiz" as ViewMode, label: "✏️ Quiz" },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === mode.id
                      ? "bg-red-600 text-white shadow-md shadow-red-900/30"
                      : "text-gray-400 hover:bg-neutral-800 hover:text-white"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <AuthHeader onOpenAuth={openAuthModal} onOpenProfile={() => setViewMode("profile")} />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-400 hover:bg-neutral-800"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <div className="md:hidden py-3 border-t border-neutral-800">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "browse" as ViewMode, label: "📚 Browse" },
                  { id: "practice" as ViewMode, label: "🔥 Practice" },
                  { id: "flashcards" as ViewMode, label: "🃏 Flashcards" },
                  { id: "quiz" as ViewMode, label: "✏️ Quiz" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => { setViewMode(mode.id); setMobileMenuOpen(false); }}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === mode.id ? "bg-red-600 text-white" : "text-gray-400 bg-neutral-800"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Stats Banner */}
      <div className="bg-neutral-950 border-b border-neutral-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 sm:gap-6">
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
              {/* Fallback indicator */}
              {dataSource === "fallback" && (
                <span className="text-xs text-yellow-500/80 border border-yellow-800/40 rounded px-2 py-0.5">
                  ⚠ offline preview
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === "home" && (
          <LandingPage onSelectMode={(mode) => setViewMode(mode)} />
        )}

        {viewMode === "profile" && (
          <ProfilePage
            totalWords={vocabulary.length}
            learnedCount={learnedCount}
            stillLearningCount={stillLearningCount}
            onBack={() => setViewMode("browse")}
          />
        )}

        {viewMode === "browse" && (
          <>
            <div className="mb-8 space-y-4">
              {/* Search */}
              <div className="relative max-w-md">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                  { value: "all" as StatusFilter, label: "All Words", icon: "📋" },
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

            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-300">{filteredWords.length}</span> of{" "}
                <span className="font-semibold text-gray-300">{vocabulary.length}</span> words
                {statusFilter !== "all" && (
                  <span className="text-gray-600">
                    {" "}· filtered by{" "}
                    <span className={statusFilter === "learned" ? "text-emerald-400" : "text-red-400"}>
                      {statusFilter === "learned" ? "Learned" : "Still Learning"}
                    </span>
                  </span>
                )}
              </p>
            </div>

            {filteredWords.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWords.map((word) => (
                  <VocabCard
                    key={word.id}
                    word={word}
                    isLearned={isLearned(word.id)}
                    onToggleLearned={toggleLearned}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-5xl mb-4">🔍</p>
                <p className="text-gray-400 text-lg">No words found matching your filters.</p>
                <button
                  onClick={() => { setSearchQuery(""); setHskFilter("all"); setCategoryFilter("all"); setStatusFilter("all"); }}
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
                    onClick={() => { setHskFilter(filter.value); setFlashcardKey((k) => k + 1); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      hskFilter === filter.value ? "bg-red-600 text-white" : "bg-neutral-900 text-gray-400 border border-neutral-800"
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
                    onClick={() => { setFlashcardStatusFilter(filter.value); setFlashcardKey((k) => k + 1); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      flashcardStatusFilter === filter.value
                        ? filter.value === "learned" ? "bg-emerald-700 text-white" : "bg-red-600 text-white"
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
                    onClick={() => { setHskFilter(filter.value); setQuizKey((k) => k + 1); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      hskFilter === filter.value ? "bg-red-600 text-white" : "bg-neutral-900 text-gray-400 border border-neutral-800"
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

      {/* Global auth error toast */}
      {authError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[min(720px,calc(100vw-2rem))]">
          <div className="bg-red-950/70 border border-red-900/60 backdrop-blur-md rounded-2xl shadow-2xl px-4 py-3 flex items-start gap-3">
            <div className="mt-0.5 text-red-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86l-8.02 14A2 2 0 004.0 21h16a2 2 0 001.73-3.14l-8.02-14a2 2 0 00-3.46 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-200">Action failed</p>
              <p className="text-sm text-red-200/80 mt-0.5 break-words">{authError}</p>
            </div>
            <button
              onClick={clearError}
              className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-xl text-red-200/70 hover:text-red-100 hover:bg-red-900/30 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-neutral-950 border-t border-neutral-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              🇨🇳 汉语学习 — Chinese Language Learning — HSK 1 & 2 Vocabulary
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {vocabulary.length} words • ✅ {learnedCount} learned • 📖 {stillLearningCount} still learning
              {dataSource === "fallback" && " · offline preview"}
            </p>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
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
