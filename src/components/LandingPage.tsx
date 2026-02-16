interface LandingPageProps {
  onSelectMode: (mode: "browse" | "practice" | "flashcards" | "quiz") => void;
}

const modes = [
  {
    id: "browse" as const,
    title: "Browse",
    subtitle: "Explore HSK 1–2 vocabulary",
    description:
      "Search and filter the full list, flip cards for meanings, and study example sentences with hover pinyin.",
    icon: "📚",
    accent: "border-red-900/40 hover:border-red-700/50",
  },
  {
    id: "practice" as const,
    title: "Practice",
    subtitle: "Balanced mixed sessions",
    description:
      "A focused session that mixes new words with review. Use \u201CGot it\u201D and \u201CForgot it\u201D to adjust what you're learning.",
    icon: "🔥",
    accent: "border-red-900/40 hover:border-red-700/50",
  },
  {
    id: "flashcards" as const,
    title: "Flashcards",
    subtitle: "Fast repetition",
    description:
      "Quickly drill words, mark what you know, and reinforce pronunciation with per-character pinyin hover + audio.",
    icon: "🃏",
    accent: "border-red-900/40 hover:border-red-700/50",
  },
  {
    id: "quiz" as const,
    title: "Quiz",
    subtitle: "Check your recall",
    description:
      "Multiple-choice questions to test meanings and keep your progress honest.",
    icon: "✏️",
    accent: "border-red-900/40 hover:border-red-700/50",
  },
];

export function LandingPage({ onSelectMode }: LandingPageProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center py-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl shadow-lg shadow-red-900/40 mb-5">
          <span className="text-white text-2xl font-bold">汉</span>
        </div>
        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
          Learn Mandarin the practical way
        </h2>
        <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
          HSK 1–2 vocabulary with examples, hover pinyin, and audio. Choose a mode below to start.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-12">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelectMode(m.id)}
            className={`text-left bg-neutral-900 rounded-2xl border ${m.accent} p-5 shadow-lg hover:shadow-xl transition-all`}
          >
            <div className="flex items-center justify-between">
              <div className="text-3xl">{m.icon}</div>
              <div className="text-xs text-gray-600">Open →</div>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-bold text-white">{m.title}</h3>
              <p className="text-sm text-red-400 font-medium mt-0.5">{m.subtitle}</p>
              <p className="text-sm text-gray-400 mt-3 leading-relaxed">{m.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-white">Tips</h3>
        <ul className="mt-3 space-y-2 text-sm text-gray-400">
          <li>• Hover Chinese characters anywhere to see pinyin.</li>
          <li>• Use the speaker icon to hear pronunciation (best voices in Edge/Chrome).</li>
          <li>• Mark words learned to focus your sessions.</li>
        </ul>
      </div>
    </div>
  );
}
