import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  created_at: string;
}

type AccountTier = 'free' | 'premium';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  accountTier: AccountTier;
  purchasedLevels: number[];
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  purchaseLevel: (level: number) => Promise<void>;
  purchasePremium: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Use same-origin API calls (works on Vercel)
const API_URL = import.meta.env.VITE_API_BASE || "";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accountTier, setAccountTier] = useState<AccountTier>('free');
  const [purchasedLevels, setPurchasedLevels] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const fetchUser = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setAccountTier(data.account_tier || 'free');
        setPurchasedLevels(data.purchased_levels || []);
        console.log("Auth refreshed. Tier:", data.account_tier, "Levels:", data.purchased_levels);
        return data;
      } else {
        localStorage.removeItem("hanyu_auth_token");
        setUser(null);
        setAccountTier('free');
        setPurchasedLevels([]);
      }
    } catch {
      console.error("Failed to fetch user");
      setUser(null);
      setAccountTier('free');
      setPurchasedLevels([]);
    }
    return null;
  }, []);

  const refreshAuth = useCallback(async () => {
    const token = localStorage.getItem("hanyu_auth_token");
    if (token) {
      await fetchUser(token);
    }
  }, [fetchUser]);

  // Initial auth check + handle payment redirect
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("hanyu_auth_token");
      if (token) {
        await fetchUser(token);
      }
      setIsLoading(false);

      // Check if returning from Stripe payment
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get("payment");

      if (paymentStatus === "success" && token) {
        console.log("🎉 Payment success detected! Refreshing status...");

        // Remove the query param from URL
        window.history.replaceState({}, "", window.location.pathname);

        // Poll for status update (webhook may take a moment)
        let attempts = 0;
        const pollInterval = setInterval(async () => {
          attempts++;
          console.log(`🔄 Checking purchase status... (attempt ${attempts})`);
          const data = await fetchUser(token);
          if (data?.account_tier === 'premium' || (data?.purchased_levels && data.purchased_levels.length > 0) || attempts >= 10) {
            clearInterval(pollInterval);
            if (data?.account_tier === 'premium') {
              console.log("✅ Premium status confirmed!");
            } else if (data?.purchased_levels?.length > 0) {
              console.log("✅ Level purchase confirmed!");
            } else {
              console.log("⚠️ Purchase status not yet updated. It may take a moment.");
            }
          }
        }, 2000);
      } else if (paymentStatus === "cancelled") {
        window.history.replaceState({}, "", window.location.pathname);
      }
    };

    initAuth();
  }, [fetchUser]);

  // Re-fetch when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const token = localStorage.getItem("hanyu_auth_token");
        if (token) fetchUser(token);
      }
    };

    const handleFocus = () => {
      const token = localStorage.getItem("hanyu_auth_token");
      if (token) fetchUser(token);
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.session?.access_token) {
        localStorage.setItem("hanyu_auth_token", data.session.access_token);
        setUser(data.user);
        setAccountTier(data.account_tier || 'free');
        setPurchasedLevels(data.purchased_levels || []);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      if (data.user && !data.session) {
        // Email confirmation required
        setUser(null);
        setAccountTier('free');
        setPurchasedLevels([]);
        localStorage.removeItem("hanyu_auth_token");
      } else if (data.session?.access_token) {
        localStorage.setItem("hanyu_auth_token", data.session.access_token);
        setUser(data.user);
        setAccountTier('free');
        setPurchasedLevels([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseLevel = async (level: number) => {
    const token = localStorage.getItem("hanyu_auth_token");
    if (!token) {
      setError("Please sign in to purchase");
      return;
    }

    try {
      setIsLoading(true);
      console.log(`🛒 Starting HSK ${level} purchase...`);
      const res = await fetch(`${API_URL}/api/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_type: "hsk_level",
          hsk_level: level,
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to create checkout session");

      if (body.url) {
        console.log("🔗 Redirecting to Stripe...");
        window.location.assign(body.url);
        return;
      }

      throw new Error("No checkout URL returned from server");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Purchase failed";
      console.error("❌ Purchase error:", message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const purchasePremium = async () => {
    const token = localStorage.getItem("hanyu_auth_token");
    if (!token) {
      setError("Please sign in to upgrade");
      return;
    }

    try {
      setIsLoading(true);
      console.log("🛒 Starting Premium purchase...");
      const res = await fetch(`${API_URL}/api/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_type: "premium",
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to create checkout session");

      if (body.url) {
        console.log("🔗 Redirecting to Stripe...");
        window.location.assign(body.url);
        return;
      }

      throw new Error("No checkout URL returned from server");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Purchase failed";
      console.error("❌ Purchase error:", message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const token = localStorage.getItem("hanyu_auth_token");

    if (token) {
      try {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Ignore logout errors
      }
    }

    localStorage.removeItem("hanyu_auth_token");
    setUser(null);
    setAccountTier('free');
    setPurchasedLevels([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        accountTier,
        purchasedLevels,
        login,
        signup,
        logout,
        purchaseLevel,
        purchasePremium,
        refreshAuth,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
