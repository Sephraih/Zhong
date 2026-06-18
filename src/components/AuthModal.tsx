import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { TurnstileWidget } from "./TurnstileWidget";

type AuthMode = "login" | "signup" | "forgot" | "new-password";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

export function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTos, setAcceptTos] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formHint, setFormHint] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<"apple" | "google" | null>(null);

  const {
    login, signup, signInWithApple, signInWithGoogle,
    sendPasswordResetEmail, setNewPassword, refreshAuth, error, clearError,
  } = useAuth();

  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const turnstileEnabled = Boolean(turnstileSiteKey);

  // signInWithOAuth navigates the whole page away; if the user hits Back, the browser
  // can restore this page from its back/forward cache with oauthLoading still set from
  // before the redirect, leaving both buttons stuck disabled. Reset on bfcache restore
  // (pageshow) and as a backstop whenever the modal is reopened.
  useEffect(() => {
    const resetOAuthLoading = () => setOauthLoading(null);
    window.addEventListener("pageshow", resetOAuthLoading);
    return () => window.removeEventListener("pageshow", resetOAuthLoading);
  }, []);

  useEffect(() => {
    if (isOpen) setOauthLoading(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage(null);
    setFormHint(null);

    if (mode === "signup" && password !== confirmPassword) {
      setFormHint("Passwords do not match.");
      return;
    }

    if (mode === "signup" && (!acceptTos || !acceptPrivacy)) {
      setFormHint("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    if (mode === "signup" && turnstileEnabled && !turnstileToken) {
      setFormHint("Please complete the captcha to continue.");
      return;
    }

    if (mode === "new-password" && password !== confirmPassword) {
      setFormHint("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await login(email, password);
        onClose();
        resetForm();
      } else if (mode === "signup") {
        await signup(email, password, {
          acceptTos,
          acceptPrivacy,
          captchaToken: turnstileToken,
        });
        setSuccessMessage(
          "Check your email to confirm your account. After you click the confirmation link, you'll be redirected to your profile."
        );
      } else if (mode === "forgot") {
        await sendPasswordResetEmail(email);
        setSuccessMessage(
          "Check your email for a password reset link. The link expires after an hour."
        );
      } else if (mode === "new-password") {
        await setNewPassword(password);
        await refreshAuth();
        onClose();
        resetForm();
      }
    } catch {
      // Error is handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async (provider: "apple" | "google") => {
    clearError();
    setFormHint(null);
    setOauthLoading(provider);
    try {
      await (provider === "apple" ? signInWithApple() : signInWithGoogle());
      // On success this never resolves before the browser navigates away.
    } catch {
      // Error is handled by context
      setOauthLoading(null);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setAcceptTos(false);
    setAcceptPrivacy(false);
    setSuccessMessage(null);
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    clearError();
    setSuccessMessage(null);
    setFormHint(null);
    setAcceptTos(false);
    setAcceptPrivacy(false);
    setTurnstileToken(null);
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900/50 to-neutral-900 px-8 pt-8 pb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 bg-red-600 rounded-xl shadow-lg shadow-red-900/40">
              <span className="text-white text-xl font-bold">汉</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white text-center">
            {mode === "login" ? "Welcome Back"
              : mode === "signup" ? "Create Account"
              : mode === "forgot" ? "Forgot Password"
              : "Set New Password"}
          </h2>
          <p className="text-gray-400 text-center mt-1">
            {mode === "login" ? "Sign in to continue your learning"
              : mode === "signup" ? "Start your Chinese learning journey"
              : mode === "forgot" ? "Enter your email and we'll send a reset link"
              : "Choose a new password for your account"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6">
          {error && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-900/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-900/50 rounded-lg text-emerald-400 text-sm">
              {successMessage}
            </div>
          )}

          {formHint && (
            <div className="mb-4 p-3 bg-neutral-950/60 border border-neutral-800 rounded-lg text-gray-300 text-sm">
              {formHint}
            </div>
          )}

          {(mode === "login" || mode === "signup") && (
            <>
              <div className="space-y-3 mb-5">
                <button
                  type="button"
                  onClick={() => handleOAuth("apple")}
                  disabled={oauthLoading !== null}
                  className="w-full py-3 flex items-center justify-center gap-2 bg-black hover:bg-neutral-800 disabled:opacity-60 text-white border border-neutral-700 rounded-xl font-semibold transition-all"
                >
                  {oauthLoading === "apple" ? "Redirecting…" : "Continue with Apple"}
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuth("google")}
                  disabled={oauthLoading !== null}
                  className="w-full py-3 flex items-center justify-center gap-2 bg-white hover:bg-gray-100 disabled:opacity-60 text-neutral-900 border border-neutral-300 rounded-xl font-semibold transition-all"
                >
                  {oauthLoading === "google" ? (
                    "Redirecting…"
                  ) : (
                    <>
                      <span className="font-bold" style={{ color: "#4285F4" }}>G</span>
                      Continue with Google
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center mb-5">
                By continuing, you agree to our{" "}
                <a className="text-red-400 hover:underline" href="/tos" target="_blank" rel="noreferrer">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a className="text-red-400 hover:underline" href="/privacy" target="_blank" rel="noreferrer">
                  Privacy Policy
                </a>
                .
              </p>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-neutral-800" />
                <span className="text-xs text-gray-500">or continue with email</span>
                <div className="flex-1 h-px bg-neutral-800" />
              </div>
            </>
          )}

          <div className="space-y-4">
            {/* Email — shown for login, signup, forgot */}
            {mode !== "new-password" && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-black border border-neutral-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/50 transition-all"
                  placeholder="you@example.com"
                />
              </div>
            )}

            {/* Password — shown for login, signup, new-password */}
            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-400">
                    {mode === "new-password" ? "New Password" : "Password"}
                  </label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 bg-black border border-neutral-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/50 transition-all"
                  placeholder="••••••••"
                />
              </div>
            )}

            {/* Confirm password — shown for signup and new-password */}
            {(mode === "signup" || mode === "new-password") && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 bg-black border border-neutral-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/50 transition-all"
                  placeholder="••••••••"
                />
                {password !== confirmPassword && confirmPassword.length > 0 && (
                  <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
                )}

                {/* Turnstile Captcha (signup only) */}
                {mode === "signup" && turnstileEnabled && (
                  <div className="mt-4 p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                    <p className="text-xs text-gray-500 mb-2">Security verification</p>
                    <TurnstileWidget
                      siteKey={turnstileSiteKey!}
                      onToken={(t) => setTurnstileToken(t)}
                      theme="dark"
                      compact
                    />
                  </div>
                )}

                {/* TOS checkboxes (signup only) */}
                {mode === "signup" && (
                  <div className="mt-4 space-y-2">
                    <label className="flex items-start gap-2 text-sm text-gray-400">
                      <input
                        type="checkbox"
                        checked={acceptTos}
                        onChange={(e) => setAcceptTos(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-neutral-700 bg-black"
                        required
                      />
                      <span>
                        I agree to the{" "}
                        <a className="text-red-400 hover:underline" href="/tos" target="_blank" rel="noreferrer">
                          Terms of Service
                        </a>
                      </span>
                    </label>

                    <label className="flex items-start gap-2 text-sm text-gray-400">
                      <input
                        type="checkbox"
                        checked={acceptPrivacy}
                        onChange={(e) => setAcceptPrivacy(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-neutral-700 bg-black"
                        required
                      />
                      <span>
                        I agree to the{" "}
                        <a className="text-red-400 hover:underline" href="/privacy" target="_blank" rel="noreferrer">
                          Privacy Policy
                        </a>
                      </span>
                    </label>

                    {(!acceptTos || !acceptPrivacy) && (
                      <p className="text-xs text-gray-500">
                        Required to create an account.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              ((mode === "signup" || mode === "new-password") && password !== confirmPassword) ||
              (mode === "signup" && (!acceptTos || !acceptPrivacy))
            }
            className="w-full mt-6 py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-lg shadow-red-900/30 disabled:shadow-none"
          >
            {isSubmitting ? "Please wait..."
              : mode === "login" ? "Sign In"
              : mode === "signup" ? "Create Account"
              : mode === "forgot" ? "Send Reset Link"
              : "Set New Password"}
          </button>

          <div className="mt-6 text-center">
            {(mode === "login" || mode === "signup") && (
              <>
                <span className="text-gray-500">
                  {mode === "login" ? "Don't have an account?" : "Already have an account?"}
                </span>
                <button
                  type="button"
                  onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                  className="ml-1 text-red-400 hover:text-red-300 font-medium transition-colors"
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </>
            )}
            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="text-gray-500 hover:text-gray-300 transition-colors text-sm"
              >
                ← Back to sign in
              </button>
            )}
          </div>
        </form>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
