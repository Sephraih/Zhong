export type StorageConsentState = "unknown" | "accepted" | "declined";

// This consent is for OPTIONAL analytics only.
// Essential cookies/localStorage for login/progress are always enabled.
const CONSENT_COOKIE = "hanyu_analytics_consent";

let memoryConsent: StorageConsentState = "unknown";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[-.$?*|{}()\[\]\\/\+^]/g, "\\$&")}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function writeCookie(name: string, value: string, days: number) {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

export function readStoredConsent(): StorageConsentState {
  const c = readCookie(CONSENT_COOKIE);
  if (c === "accepted" || c === "declined") return c;
  return memoryConsent;
}

export function setStoredConsent(state: StorageConsentState) {
  memoryConsent = state;
  // Persist the choice (accepted/declined) in an essential cookie.
  writeCookie(CONSENT_COOKIE, state, 180);
}

export function isAnalyticsAllowed(): boolean {
  return readStoredConsent() === "accepted";
}

// Backward-compat alias (some files may still reference this name).
// Storage is always allowed for essential app functionality.
export function isStorageAllowed(): boolean {
  return true;
}

// ─── Safe localStorage wrappers (ESSENTIAL: always enabled) ───────────────────

export function storageGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function storageSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function storageRemoveItem(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function clearAppStorage() {
  // Best-effort cleanup of app keys.
  // NOTE: we no longer clear storage on analytics decline.
  const keys = [
    "hanyu_auth_token",
    "hanyu-learned-words",
    "hanyu-learned-words-updated-at",
    "hanyu_supabase_vocab_cache_mv_v2",
    "hanyu_view_mode",
    "hanyu-practice-session",
  ];
  keys.forEach(storageRemoveItem);
}
