import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
}

export function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { login, signup, error, clearError } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage(null);

    if (mode === "signup" && password !== confirmPassword) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await login(email, password);
        onClose();
        resetForm();
      } else {
        await signup(email, password);
        setSuccessMessage("Check your email to confirm your account!");
        // Don't close modal - let user see the message
      }
    } catch {
      // Error is handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setSuccessMessage(null);
  };

  const switchMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    clearError();
    setSuccessMessage(null);
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
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-gray-400 text-center mt-1">
            {mode === "login"
              ? "Sign in to continue your learning"
              : "Start your Chinese learning journey"}
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

          <div className="space-y-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-black border border-neutral-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/50 transition-all"
                placeholder="••••••••"
              />
            </div>

            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-black border border-neutral-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600/50 transition-all"
                  placeholder="••••••••"
                />
                {password !== confirmPassword && confirmPassword.length > 0 && (
                  <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (mode === "signup" && password !== confirmPassword)}
            className="w-full mt-6 py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-lg shadow-red-900/30 disabled:shadow-none"
          >
            {isSubmitting
              ? "Please wait..."
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>

          <div className="mt-6 text-center">
            <span className="text-gray-500">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            </span>
            <button
              type="button"
              onClick={switchMode}
              className="ml-1 text-red-400 hover:text-red-300 font-medium transition-colors"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
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
