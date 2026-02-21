import { useAuth } from "../contexts/AuthContext";

interface ProfilePageProps {
  totalWords: number;
  learnedCount: number;
  stillLearningCount: number;
  onBack: () => void;
}

const LEVEL_PRICES: Record<number, string> = {
  2: "$4.99",
  3: "$6.99",
  4: "$9.99",
};

const LEVEL_COLORS: Record<number, string> = {
  1: "bg-emerald-600",
  2: "bg-blue-600",
  3: "bg-purple-600",
  4: "bg-orange-600",
  5: "bg-pink-600",
  6: "bg-cyan-600",
  7: "bg-yellow-600",
  8: "bg-red-600",
  9: "bg-indigo-600",
};

export function ProfilePage({ totalWords, learnedCount, stillLearningCount, onBack }: ProfilePageProps) {
  const { user, accountTier, purchasedLevels, purchaseLevel, purchasePremium } = useAuth();

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-white mb-2">Sign in to view your profile</h2>
        <p className="text-gray-400">Your progress and purchases will appear here.</p>
      </div>
    );
  }

  const isPremium = accountTier === 'premium';
  const learnedPercent = totalWords > 0 ? Math.round((learnedCount / totalWords) * 100) : 0;
  const learningPercent = totalWords > 0 ? Math.round((stillLearningCount / totalWords) * 100) : 0;

  // Available levels in the database (1-4 now, 5-9 coming soon)
  const availableLevels = [1, 2, 3, 4];
  const comingSoonLevels = [5, 6, 7, 8, 9];

  const hasAccess = (level: number) => {
    if (isPremium) return true;
    return purchasedLevels.includes(level);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">👤 Your Profile</h2>
          <p className="text-gray-400">Manage your learning progress and unlock more content.</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-semibold bg-neutral-900 text-gray-300 rounded-lg border border-neutral-800 hover:border-neutral-700 hover:text-white transition-colors"
        >
          ← Back to Learning
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Account Tier */}
        <div className="bg-neutral-900/80 backdrop-blur border border-neutral-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Account</h3>
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                isPremium
                  ? "bg-gradient-to-r from-yellow-600 to-amber-600 text-white border-yellow-500"
                  : "bg-neutral-800 text-gray-400 border-neutral-700"
              }`}
            >
              {isPremium ? "⭐ Premium" : "Free Account"}
            </span>
          </div>

          <div className="space-y-3 text-sm text-gray-400">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
              <p className="text-gray-200 font-medium break-all">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Member since</p>
              <p className="text-gray-200 font-medium">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Learning Progress */}
        <div className="bg-neutral-900/80 backdrop-blur border border-neutral-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Learning Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Learned</span>
                <span className="text-emerald-400">{learnedCount} · {learnedPercent}%</span>
              </div>
              <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                  style={{ width: `${learnedPercent}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Still Learning</span>
                <span className="text-red-400">{stillLearningCount} · {learningPercent}%</span>
              </div>
              <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-500"
                  style={{ width: `${learningPercent}%` }}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Total words: <span className="text-gray-300 font-semibold">{totalWords}</span>
            </div>
          </div>
        </div>

        {/* Unlocked Levels */}
        <div className="bg-neutral-900/80 backdrop-blur border border-neutral-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Unlocked Levels</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {availableLevels.map((level) => (
              <span
                key={level}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                  hasAccess(level)
                    ? `${LEVEL_COLORS[level]} text-white`
                    : "bg-neutral-800 text-gray-600"
                }`}
              >
                {hasAccess(level) ? "✓" : "🔒"} HSK {level}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {comingSoonLevels.map((level) => (
              <span
                key={level}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-neutral-800/50 text-gray-600 border border-dashed border-neutral-700"
              >
                HSK {level}
                <span className="ml-1 text-xs">Soon</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Upgrade Section */}
      {!isPremium && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">🚀 Unlock More Content</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Individual Level Cards */}
            {[2, 3, 4].map((level) => {
              const owned = hasAccess(level);
              return (
                <div
                  key={level}
                  className={`bg-neutral-900/80 backdrop-blur border rounded-xl p-5 ${
                    owned ? "border-emerald-800/50" : "border-neutral-800"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-10 h-10 rounded-lg ${LEVEL_COLORS[level]} flex items-center justify-center text-white font-bold`}>
                      {level}
                    </span>
                    <div>
                      <div className="font-semibold text-white">HSK Level {level}</div>
                      <div className="text-xs text-gray-500">
                        {level === 2 ? "~300 words" : level === 3 ? "~600 words" : "~1200 words"}
                      </div>
                    </div>
                  </div>
                  
                  {owned ? (
                    <div className="text-emerald-400 text-sm font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Unlocked
                    </div>
                  ) : (
                    <button
                      onClick={() => purchaseLevel(level)}
                      className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      Unlock for {LEVEL_PRICES[level]}
                    </button>
                  )}
                </div>
              );
            })}

            {/* Premium Card */}
            <div className="bg-gradient-to-br from-yellow-900/30 to-amber-900/30 border border-yellow-700/50 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-600 text-white text-xs font-bold rounded">
                BEST VALUE
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-white font-bold">
                  ⭐
                </span>
                <div>
                  <div className="font-semibold text-white">Premium</div>
                  <div className="text-xs text-yellow-400">All levels forever</div>
                </div>
              </div>
              
              <p className="text-xs text-gray-400 mb-3">
                Unlock HSK 1-9 + all future content
              </p>
              
              <button
                onClick={() => purchasePremium()}
                className="w-full py-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white rounded-lg text-sm font-bold transition-colors"
              >
                Upgrade for $19.99
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Badge */}
      {isPremium && (
        <div className="bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-700/50 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">⭐</div>
          <h3 className="text-xl font-bold text-white mb-1">Premium Member</h3>
          <p className="text-yellow-400 text-sm">You have access to all HSK levels, now and forever!</p>
        </div>
      )}
    </div>
  );
}
