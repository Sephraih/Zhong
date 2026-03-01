// Environment detection utilities

// Detect if we're running in a sandboxed iframe (like arena.ai)
export function isSandboxed(): boolean {
  try {
    // Check if we're in an iframe
    if (typeof window === "undefined") return true;
    if (window.self !== window.top) return true;
    
    // Check if fetch is available and working
    if (typeof fetch !== "function") return true;
    
    // Check for common sandbox restrictions
    try {
      // Try to access localStorage - some sandboxes block this
      localStorage.setItem("__sandbox_test__", "1");
      localStorage.removeItem("__sandbox_test__");
    } catch {
      // localStorage blocked - likely a sandbox
      return true;
    }
    
    return false;
  } catch {
    return true;
  }
}

// Check if network features should be enabled
export function isNetworkAvailable(): boolean {
  try {
    // In sandbox mode, disable all network features
    if (isSandboxed()) return false;
    
    // Check if we have Supabase config
    const hasSupabase = Boolean(
      import.meta.env?.VITE_SUPABASE_URL && 
      import.meta.env?.VITE_SUPABASE_ANON_KEY
    );
    
    return hasSupabase;
  } catch {
    return false;
  }
}

// Cache the sandbox check result
let _isSandboxed: boolean | null = null;
export function getCachedIsSandboxed(): boolean {
  if (_isSandboxed === null) {
    _isSandboxed = isSandboxed();
  }
  return _isSandboxed;
}
