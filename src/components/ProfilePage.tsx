import { useAuth } from "../contexts/AuthContext";
import { 
  getAccessibleLevels, 
  getHskBadgeClasses, 
  AVAILABLE_LEVELS, 
  COMING_SOON_LEVELS 
} from "../utils/hskAccess";

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

const PREMIUM_PRICE = "$19.99";

export function ProfilePage({ totalWords, learnedCount, stillLearningCount, onBack }: ProfilePageProps) {
  const { user, accountTier, purchasedLevels, purchaseLevel, purchasePremium, isCheckingOut, error, clearError } = useAuth();

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-white mb-2">Sign in to view your profile</h2>
        <p className="text-gray-400">Your progress and subscription details will appear here.</p>
      </div>
    );
  }

  const isPremium = accountTier === 'premium';
  const accessibleLevels = getAccessibleLevels({
    isLoggedIn: true,
    accountTier,
    purchasedLevels,
  });

  const learnedPercent = totalWords > 0 ? Math.round((learnedCount / totalWords) * 100) : 0;
  const learningPercent = totalWords > 0 ? Math.round((stillLearningCount / totalWords) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto">
      {error && (
        <div className="mb-6 p-4 rounded-2xl border border-red-900/50 bg-red-950/30 text-red-200 flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold">Purchase error</p>
            <p className="text-sm text-red-200/80 mt-1 break-words">{error}</p>
            <p className="text-xs text-red-200/60 mt-2">
              Tip: If this is running locally, Vercel serverless routes (/api/...) may not be available.
            </p>
          </div>
          <button
            onClick={clearError}
            className="shrink-0 px-3 py-1.5 rounded-lg text-sm bg-red-900/30 hover:bg-red-900/50 border border-red-900/40"
          >
            Close
          </button>
        </div>
      )}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">👤 Your Profile</h2>
          <p className="text-gray-400">Manage your learning progress and unlock more levels.</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-semibold bg-neutral-900 text-gray-300 rounded-lg border border-neutral-800 hover:border-neutral-700 hover:text-white transition-colors"
        >
          ← Back to Learning
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Account Status */}
        <div className="bg-neutral-900/80 backdrop-blur border border-neutral-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Account Status</h3>
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${
                isPremium
                  ? "bg-gradient-to-r from-yellow-600 to-amber-600 text-white border-yellow-500"
                  : "bg-neutral-800 text-gray-400 border-neutral-700"
              }`}
            >
              {isPremium ? "⭐ Premium" : "Free Plan"}
            </span>
          </div>
          
          <div className="space-y-2 text-sm text-gray-400">
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

        {/* Unlocked Levels */}
        <div className="bg-neutral-900/80 backdrop-blur border border-neutral-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Unlocked Levels</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {AVAILABLE_LEVELS.map((level) => {
              const isUnlocked = accessibleLevels.includes(level);
              return (
                <span
                  key={level}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                    isUnlocked
                      ? getHskBadgeClasses(level)
                      : "bg-neutral-800 text-gray-600 border border-neutral-700"
                  }`}
                >
                  {isUnlocked ? "✓ " : "🔒 "}HSK {level}
                </span>
              );
            })}
          </div>
          
          {/* Coming Soon Levels */}
          <div className="pt-3 border-t border-neutral-800">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Coming Soon</p>
            <div className="flex flex-wrap gap-2">
              {COMING_SOON_LEVELS.map((level) => (
                <span
                  key={level}
                  className="px-2 py-1 rounded text-xs font-medium bg-neutral-800/50 text-gray-500 border border-neutral-700/50"
                >
                  HSK {level}
                </span>
              ))}
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
            <div className="text-xs text-gray-500 pt-2">
              Total words available: <span className="text-gray-300 font-semibold">{totalWords}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Section */}
      {!isPremium && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white">Unlock More Levels</h3>
          <p className="text-sm text-gray-500">
            Purchases open Stripe Checkout in a new page. If nothing happens, check the error banner above.
          </p>
          
          {/* Premium Card */}
          <div className="bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border-2 border-yellow-600/50 rounded-2xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-3 right-3 px-2 py-1 bg-yellow-600 text-white text-xs font-bold rounded">
              BEST VALUE
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h4 className="text-2xl font-bold text-white flex items-center gap-2">
                  ⭐ Premium Bundle
                </h4>
                <p className="text-gray-300 mt-1">
                  Unlock all current and future HSK levels (1-9)
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[...AVAILABLE_LEVELS, ...COMING_SOON_LEVELS].map((level) => (
                    <span key={level} className={`px-2 py-0.5 rounded text-xs font-medium ${getHskBadgeClasses(level)}`}>
                      HSK {level}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-center md:text-right">
                <div className="text-3xl font-bold text-white">{PREMIUM_PRICE}</div>
                <div className="text-sm text-gray-400 mb-3">one-time payment</div>
                <button
                  onClick={purchasePremium}
                  disabled={isCheckingOut}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 disabled:from-yellow-900/50 disabled:to-amber-900/50 disabled:text-gray-300 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all shadow-lg shadow-yellow-900/30"
                >
                  {isCheckingOut ? "Redirecting…" : "Upgrade to Premium"}
                </button>
              </div>
            </div>
          </div>

          {/* Individual Level Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AVAILABLE_LEVELS.filter(l => l > 1).map((level) => {
              const isOwned = accessibleLevels.includes(level);
              const price = LEVEL_PRICES[level];
              
              return (
                <div
                  key={level}
                  className={`rounded-2xl p-5 shadow-lg border ${
                    isOwned
                      ? "bg-neutral-900/50 border-neutral-700"
                      : "bg-neutral-900/80 border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getHskBadgeClasses(level)}`}>
                      HSK {level}
                    </span>
                    {isOwned && (
                      <span className="text-emerald-400 text-sm font-medium">✓ Owned</span>
                    )}
                  </div>
                  
                  {isOwned ? (
                    <p className="text-gray-500 text-sm">You have access to this level</p>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-white mb-3">{price}</div>
                      <button
                        onClick={() => purchaseLevel(level)}
                        disabled={isCheckingOut}
                        className={`w-full py-2.5 rounded-xl font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                          level === 2
                            ? "bg-blue-600 hover:bg-blue-500 text-white"
                            : level === 3
                            ? "bg-purple-600 hover:bg-purple-500 text-white"
                            : "bg-orange-600 hover:bg-orange-500 text-white"
                        }`}
                      >
                        {isCheckingOut ? "Redirecting…" : `Purchase HSK ${level}`}
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Premium User Message */}
      {isPremium && (
        <div className="bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border border-yellow-600/30 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">⭐</div>
          <h3 className="text-xl font-bold text-white mb-2">You're a Premium Member!</h3>
          <p className="text-gray-400">
            You have access to all HSK levels (1-9), including all future content.
          </p>
        </div>
      )}
    </div>
  );
}
