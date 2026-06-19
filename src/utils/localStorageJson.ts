export function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore (sandboxed/unavailable storage)
  }
}

export function removeJSON(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
