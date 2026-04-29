import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getAccessibleLevels,
  getHskBadgeClasses,
  AVAILABLE_LEVELS,
} from "../utils/hskAccess";

interface ProfilePageProps {
  totalWords: number;
  learnedCount: number;
  stillLearningCount: number;
  onBack: () => void;
}

export function ProfilePage({ totalWords, learnedCount, stillLearningCount, onBack }: ProfilePageProps) {
  const { user, accountTier, purchasedLevels, purchasePremium, changeEmail, changePassword, deleteAccount, exportMyData, isCheckingOut, error: authError, clearError } = useAuth();

  const [premiumPrice, setPremiumPrice] = useState<string>("$9.99");

  // Account deletion UI
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Change email UI
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailPassword, setEmailPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  
  // Check if user just confirmed an email change
  useEffect(() => {
    const emailChanged = sessionStorage.getItem("hamhao_email_changed");
    if (emailChanged) {
      sessionStorage.removeItem("hamhao_email_changed");
      setEmailSuccess("Your email address has been successfully updated!");
      setEmailOpen(true);
    }
  }, []);

  // Change password UI
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Fetch Premium price from Stripe
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/billing", { headers: { "Cache-Control": "no-cache" } });
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          console.warn("[ProfilePage] Billing API did not return JSON");
          return;
        }

        if (!res.ok || !data.premium) return;

        if (cancelled) return;

        const formatted = `$${(data.premium / 100).toFixed(2)}`;
        setPremiumPrice(formatted);
      } catch (err) {
        console.warn("[ProfilePage] Could not fetch billing prices:", err);
        // Keep fallback price
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

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

      {/* Existing grid with Account Status, Unlocked Levels, and Learning Progress */}
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

      {/* Purchase Section - Only Premium */}
      {!isPremium && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white">Upgrade Your Account</h3>
          
          {authError && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 text-sm flex items-center justify-between">
              <span>{authError}</span>
              <button onClick={clearError} className="text-red-400 hover:text-red-200 ml-4">✕</button>
            </div>
          )}

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
                  Unlock all available HSK levels + future content.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {AVAILABLE_LEVELS.map((level) => (
                    <span key={level} className={`px-2 py-0.5 rounded text-xs font-medium ${getHskBadgeClasses(level)}`}>
                      HSK {level}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-center md:text-right">
                <div className="text-3xl font-bold text-white">{premiumPrice}</div>
                <div className="text-sm text-gray-400 mb-3">one-time payment</div>
                <button
                  onClick={purchasePremium}
                  disabled={isCheckingOut}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-yellow-900/30 disabled:opacity-60 disabled:cursor-wait"
                >
                  {isCheckingOut ? "Redirecting to Stripe..." : "Upgrade to Premium"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium User Message */}
      {isPremium && (
        <div className="bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border border-yellow-600/30 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">⭐</div>
          <h3 className="text-xl font-bold text-white mb-2">You're a Premium Member!</h3>
          <p className="text-gray-400">
            You have access to all current HSK levels, including all future content. :)
          </p>
        </div>
      )}

      {/* Rest of your file (Account Settings, Your Data, Danger Zone) remains unchanged */}
      {/* ... [All the account settings, change email, password, export 