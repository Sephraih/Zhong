import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

interface ProfilePageProps {
  totalWords: number;
  learnedCount: number;
  stillLearningCount: number;
  onBack: () => void;
}

interface SubscriptionData {
  status?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean | null;
  stripe_price_id?: string | null;
}

// Use VITE_API_BASE only during local development.
const API_URL = import.meta.env.DEV ? (import.meta.env.VITE_API_BASE || "") : "";
const apiUrl = (path: string) => (API_URL ? `${API_URL}${path}` : path);

export function ProfilePage({ totalWords, learnedCount, stillLearningCount, onBack }: ProfilePageProps) {
  const { user, isPremium, startCheckout, error, isCheckingOut } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubscription = async () => {
      if (!user) return;
      const token = localStorage.getItem("hanyu_auth_token");
      if (!token) return;

      try {
        const res = await fetch(apiUrl(`/api/subscription`), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
          },
        });
        if (res.ok) {
          const data = await res.json();
          setSubscription(data.subscription || null);
        }
      } catch {
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    };

    loadSubscription();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-white mb-2">Sign in to view your profile</h2>
        <p className="text-gray-400">Your progress and subscription details will appear here.</p>
      </div>
    );
  }

  const learnedPercent = totalWords > 0 ? Math.round((learnedCount / totalWords) * 100) : 0;
  const learningPercent = totalWords > 0 ? Math.round((stillLearningCount / totalWords) * 100) : 0;

  const nextBilling = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : null;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">👤 Your Profile</h2>
          <p className="text-gray-400">Manage your learning progress and subscription.</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-semibold bg-neutral-900 text-gray-300 rounded-lg border border-neutral-800 hover:border-neutral-700 hover:text-white transition-colors"
        >
          ← Back to Learning
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {error && (
          <div className="lg:col-span-3 mb-2 p-3 bg-red-950/50 border border-red-900/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Subscription</h3>
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                isPremium
                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/50"
                  : "bg-neutral-800 text-gray-400 border-neutral-700"
              }`}
            >
              {isPremium ? "Premium Active" : "Free Plan"}
            </span>
            {isPremium && (
              <span className="text-xs text-emerald-300">⭐</span>
            )}
          </div>

          {loading ? (
            <p className="text-gray-500 text-sm">Loading subscription details...</p>
          ) : isPremium ? (
            <div className="space-y-2 text-sm text-gray-400">
              <p>
                Status: <span className="text-gray-200 capitalize">{subscription?.status || "active"}</span>
              </p>
              <p>
                Next billing date: <span className="text-gray-200">{nextBilling || "—"}</span>
              </p>
              <p>
                Auto-renew: <span className="text-gray-200">{subscription?.cancel_at_period_end ? "No" : "Yes"}</span>
              </p>
            </div>
          ) : (
            <div>
              <p className="text-gray-500 text-sm mb-4">Upgrade to unlock premium features.</p>
              <button
                onClick={startCheckout}
                disabled={isCheckingOut}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-900/60 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
              >
                {isCheckingOut ? "Redirecting to Stripe..." : "Upgrade to Premium"}
              </button>
            </div>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-lg">
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

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Account</h3>
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
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">User ID</p>
              <p className="text-gray-500 text-xs break-all">{user.id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
