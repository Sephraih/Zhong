import { useState } from "react";
import { readJSON, writeJSON } from "../utils/localStorageJson";

export function usePersistedState<T>(storageKey: string, defaultValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => readJSON<T>(storageKey) ?? defaultValue);

  const set = (next: T) => {
    setValue(next);
    writeJSON(storageKey, next);
  };

  return [value, set];
}
