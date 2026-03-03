/**
 * Detects if we're running in a sandboxed environment (e.g., iframe preview)
 * where certain features like localStorage, fetch, etc. may be restricted.
 */

let cachedIsSandboxed: boolean | null = null;

export function detectSandboxed(): boolean {
  // Check if localStorage is accessible
  try {
    const testKey = "__sandbox_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
  } catch {
    return true;
  }

  // Check if we're in a cross-origin iframe
  try {
    if (window.self !== window.top) {
      // We're in an iframe - check if we can access parent
      try {
        // This will throw if cross-origin
        const _ = window.parent.location.href;
        void _;
      } catch {
        // Cross-origin iframe = likely sandboxed preview
        return true;
      }
    }
  } catch {
    return true;
  }

  return false;
}

export function getCachedIsSandboxed(): boolean {
  if (cachedIsSandboxed === null) {
    cachedIsSandboxed = detectSandboxed();
  }
  return cachedIsSandboxed;
}

export function resetSandboxCache(): void {
  cachedIsSandboxed = null;
}
