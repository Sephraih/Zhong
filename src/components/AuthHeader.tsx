import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

interface AuthHeaderProps {
  onOpenAuth: (mode: "login" | "signup") => void;
  onOpenProfile: () => void;
}

export function AuthHeader({ onOpenAuth, onOpenProfile }: AuthHeaderProps) {
  const { user, logout, isPremium, startCheckout, isCheckingOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
  };

  if (user) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-white text-sm font-medium truncate max-w-[120px]">
              {user.email?.split("@")[0]}
            </p>
            <p className="text-gray-500 text-[10px]">
              {isPremium ? "⭐ Premium" : "Free"}
            </p>
          </div>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${
              showDropdown ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl z-20 overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-800">
                <p className="text-white text-sm font-medium truncate">{user.email}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  Member since {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    onOpenProfile();
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-neutral-800 hover:text-white transition-colors flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  My Profile
                </button>

                {isPremium ? (
                  <div className="px-4 py-2 text-xs text-emerald-400 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Premium Member
                  </div>
                ) : (
                  <button
                    disabled={isCheckingOut}
                    onClick={async () => {
                      setShowDropdown(false);
                      await startCheckout();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-neutral-800 hover:text-red-300 disabled:text-gray-500 disabled:hover:bg-transparent transition-colors flex items-center gap-3"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {isCheckingOut ? "Redirecting..." : "Upgrade to Premium"}
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-400 hover:bg-neutral-800 hover:text-white transition-colors flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <button
        onClick={() => onOpenAuth("login")}
        className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-lg shadow-red-900/30"
      >
        Sign In / Sign Up
      </button>
    </div>
  );
}
