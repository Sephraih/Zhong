import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getAccessibleLevels,
  getHskBadgeClasses,
  AVAILABLE_LEVELS,
  COMING_SOON_LEVELS,
} from "../utils/hskAccess";

interface ProfilePageProps {
  totalWords: number;
  learnedCount: number;
  stillLearningCount: number;
  onBack: () => void;
}

type StripePrices = {
  premium: string | null;
  hsk2: string | null;
  hsk3: string | null;
  hsk4: string | null;
};

const FALLBACK_LEVEL_PRICES: Record<number, string> = {
  2: "$4.99",
  3: "$6.99",
  4: "$9.99",
};

const FALLBACK_PREMIUM_PRICE = "$19.99";

export function ProfilePage({ totalWords, learnedCount, stillLearningCount, onBack }: ProfilePageProps) {
  const { user, accountTier, purchasedLevels, purchaseLevel, purchasePremium, changeEmail, changePassword, deleteAccount, exportMyData } = useAuth();

  const [stripePrices, setStripePrices] = useState<StripePrices>({
    premium: null,
    hsk2: null,
    hsk3: null,
    hsk4: null,
  });

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

  // Change password UI
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/prices", { headers: { "Cache-Control": "no-cache" } });
        const data = await res.json();
        if (cancelled) return;
        if (data?.prices) {
          setStripePrices({
            premium: data.prices.premium ?? null,
            hsk2: data.prices.hsk2 ?? null,
            hsk3: data.prices.hsk3 ?? null,
            hsk4: data.prices.hsk4 ?? null,
          });
        }
      } catch {
        // ignore; keep fallback
      }
    };
    load();
    return () => {
      cancelled = true;
    };
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

  const premiumPrice = stripePrices.premium ?? FALLBACK_PREMIUM_PRICE;
  const levelPriceMap: Record<number, string> = {
    2: stripePrices.hsk2 ?? FALLBACK_LEVEL_PRICES[2],
    3: stripePrices.hsk3 ?? FALLBACK_LEVEL_PRICES[3],
    4: stripePrices.hsk4 ?? FALLBACK_LEVEL_PRICES[4],
  };

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
                <div className="text-3xl font-bold text-white">{premiumPrice}</div>
                <div className="text-sm text-gray-400 mb-3">one-time payment</div>
                <button
                  onClick={purchasePremium}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-yellow-900/30"
                >
                  Upgrade to Premium
                </button>
              </div>
            </div>
          </div>

          {/* Individual Level Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AVAILABLE_LEVELS.filter(l => l > 1).map((level) => {
              const isOwned = accessibleLevels.includes(level);
              const price = levelPriceMap[level];
              
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
                        className={`w-full py-2.5 rounded-xl font-semibold transition-all ${
                          level === 2
                            ? "bg-blue-600 hover:bg-blue-500 text-white"
                            : level === 3
                            ? "bg-purple-600 hover:bg-purple-500 text-white"
                            : "bg-orange-600 hover:bg-orange-500 text-white"
                        }`}
                      >
                        Purchase HSK {level}
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

      {/* Account Settings */}
      <div className="mt-10 mb-8">
        <h3 className="text-xl font-bold text-white mb-6">Account Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Change Email */}
          <div className="bg-neutral-900/80 backdrop-blur border border-neutral-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h4 className="text-lg font-semibold text-white">Change Email</h4>
                <p className="text-sm text-gray-400 mt-1">Update your email address</p>
              </div>
              <button
                onClick={() => {
                  setEmailError(null);
                  setEmailSuccess(null);
                  setEmailOpen((v) => !v);
                }}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-neutral-700 text-gray-300 hover:text-white hover:border-neutral-600 hover:bg-neutral-800/50 transition-colors"
              >
                {emailOpen ? "Close" : "Change"}
              </button>
            </div>

            {emailOpen && (
              <div className="space-y-4">
                {emailError && (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 text-sm">
                    {emailError}
                  </div>
                )}
                {emailSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-sm">
                    {emailSuccess}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    New email address
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-neutral-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/50"
                    placeholder="new@email.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Confirm with your password
                  </label>
                  <input
                    type="password"
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-neutral-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/50"
                    placeholder="Your current password"
                  />
                </div>
                <button
                  onClick={async () => {
                    setEmailError(null);
                    setEmailSuccess(null);
                    if (!newEmail) {
                      setEmailError("Please enter a new email address.");
                      return;
                    }
                    if (!emailPassword) {
                      setEmailError("Please enter your password to confirm.");
                      return;
                    }
                    try {
                      setEmailBusy(true);
                      await changeEmail(emailPassword, newEmail);
                      setEmailSuccess("Email update initiated. Check your new email to confirm.");
                      setNewEmail("");
                      setEmailPassword("");
                    } catch (err) {
                      const msg = err instanceof Error ? err.message : "Failed to change email";
                      setEmailError(msg);
                    } finally {
                      setEmailBusy(false);
                    }
                  }}
                  disabled={emailBusy}
                  className="w-full py-3 rounded-xl font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-60"
                >
                  {emailBusy ? "Updating..." : "Update Email"}
                </button>
              </div>
            )}
          </div>

          {/* Change Password */}
          <div className="bg-neutral-900/80 backdrop-blur border border-neutral-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h4 className="text-lg font-semibold text-white">Change Password</h4>
                <p className="text-sm text-gray-400 mt-1">Update your account password</p>
              </div>
              <button
                onClick={() => {
                  setPasswordError(null);
                  setPasswordSuccess(null);
                  setPasswordOpen((v) => !v);
                }}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-neutral-700 text-gray-300 hover:text-white hover:border-neutral-600 hover:bg-neutral-800/50 transition-colors"
              >
                {passwordOpen ? "Close" : "Change"}
              </button>
            </div>

            {passwordOpen && (
              <div className="space-y-4">
                {passwordError && (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 text-sm">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-sm">
                    {passwordSuccess}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Current password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-neutral-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/50"
                    placeholder="Your current password"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    New password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-neutral-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/50"
                    placeholder="At least 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-neutral-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/50"
                    placeholder="Repeat new password"
                  />
                </div>
                <button
                  onClick={async () => {
                    setPasswordError(null);
                    setPasswordSuccess(null);
                    if (!currentPassword) {
                      setPasswordError("Please enter your current password.");
                      return;
                    }
                    if (!newPassword) {
                      setPasswordError("Please enter a new password.");
                      return;
                    }
                    if (newPassword.length < 6) {
                      setPasswordError("New password must be at least 6 characters.");
                      return;
                    }
                    if (newPassword !== confirmNewPassword) {
                      setPasswordError("New passwords do not match.");
                      return;
                    }
                    try {
                      setPasswordBusy(true);
                      await changePassword(currentPassword, newPassword);
                      setPasswordSuccess("Password updated successfully!");
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmNewPassword("");
                    } catch (err) {
                      const msg = err instanceof Error ? err.message : "Failed to change password";
                      setPasswordError(msg);
                    } finally {
                      setPasswordBusy(false);
                    }
                  }}
                  disabled={passwordBusy}
                  className="w-full py-3 rounded-xl font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-60"
                >
                  {passwordBusy ? "Updating..." : "Update Password"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Your Data + Legal */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-neutral-900/80 backdrop-blur border border-neutral-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Your Data</h3>
            <p className="text-sm text-gray-400 mb-4">
              Download a copy of the data we store about your account and learning progress.
            </p>
            <button
              onClick={exportMyData}
              className="w-full py-2.5 rounded-xl font-semibold bg-neutral-900 border border-neutral-800 text-gray-200 hover:bg-neutral-800 hover:border-neutral-700 transition-colors"
            >
              📥 Export My Data
            </button>
            <p className="text-xs text-gray-500 mt-3">
              This will download a JSON file containing your profile, purchases, and learning progress.
            </p>
          </div>

          <div className="bg-neutral-900/80 backdrop-blur border border-neutral-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Legal</h3>
            <p className="text-sm text-gray-400 mb-4">
              Review our Terms of Service and Privacy Policy.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  window.location.hash = "tos";
                  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
                }}
                className="flex-1 py-2.5 rounded-xl font-semibold bg-neutral-900 border border-neutral-800 text-gray-200 hover:bg-neutral-800 hover:border-neutral-700 transition-colors"
              >
                Terms
              </button>
              <button
                onClick={() => {
                  window.location.hash = "privacy";
                  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
                }}
                className="flex-1 py-2.5 rounded-xl font-semibold bg-neutral-900 border border-neutral-800 text-gray-200 hover:bg-neutral-800 hover:border-neutral-700 transition-colors"
              >
                Privacy
              </button>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-neutral-950/70 border border-red-900/40 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Danger zone</h3>
              <p className="text-sm text-gray-400 mt-1">
                Permanently delete your account and learning data.
              </p>
            </div>
            <button
              onClick={() => {
                setDeleteError(null);
                setDeleteOpen((v) => !v);
              }}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-red-900/50 text-red-300 hover:text-red-200 hover:border-red-700/70 hover:bg-red-950/30 transition-colors"
            >
              {deleteOpen ? "Close" : "Delete account"}
            </button>
          </div>

          {deleteOpen && (
            <div className="mt-5">
              <div className="p-4 rounded-xl bg-black/40 border border-red-900/40">
                <p className="text-sm text-gray-300">
                  This action is <span className="font-bold text-red-300">irreversible</span>.
                </p>
                <ul className="mt-3 space-y-1.5 text-sm text-gray-400">
                  <li>• Your profile and purchases will be removed.</li>
                  <li>• Your learned progress will be deleted.</li>
                  <li>• You’ll need to sign up again to use cloud sync.</li>
                </ul>
              </div>

              {deleteError && (
                <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 text-sm">
                  {deleteError}
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-neutral-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/50"
                    placeholder="Your password"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Type DELETE to confirm
                  </label>
                  <input
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-neutral-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/50"
                    placeholder="DELETE"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <p className="text-xs text-gray-500">
                  We require your password to prevent accidental or unauthorized deletion.
                </p>

                <button
                  onClick={async () => {
                    setDeleteError(null);
                    if (deleteConfirm.trim().toUpperCase() !== "DELETE") {
                      setDeleteError("Please type DELETE to confirm.");
                      return;
                    }
                    if (!deletePassword) {
                      setDeleteError("Please enter your password.");
                      return;
                    }
                    try {
                      setDeleteBusy(true);
                      await deleteAccount(deletePassword);
                      // After deletion, user is logged out; return to home.
                      window.location.hash = "";
                      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
                    } catch (err) {
                      const msg = err instanceof Error ? err.message : "Failed to delete account";
                      setDeleteError(msg);
                    } finally {
                      setDeleteBusy(false);
                    }
                  }}
                  disabled={deleteBusy}
                  className="px-5 py-3 rounded-xl font-bold border border-red-800/60 bg-red-950/40 text-red-200 hover:bg-red-900/40 hover:border-red-600/70 transition-colors disabled:opacity-60"
                >
                  {deleteBusy ? "Deleting…" : "Delete my account"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
