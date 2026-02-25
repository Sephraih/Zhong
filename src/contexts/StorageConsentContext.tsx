import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  readStoredConsent,
  setStoredConsent,
  type StorageConsentState,
  isStorageAllowed,
  clearAppStorage,
} from "../utils/storageConsent";

interface StorageConsentContextType {
  consent: StorageConsentState;
  allowStorage: boolean;
  accept: () => void;
  decline: () => void;
}

const StorageConsentContext = createContext<StorageConsentContextType | undefined>(undefined);

export function StorageConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<StorageConsentState>(() => readStoredConsent());

  const value = useMemo<StorageConsentContextType>(() => {
    const accept = () => {
      setStoredConsent("accepted");
      setConsent("accepted");
    };
    const decline = () => {
      // If they decline, we clear any existing app storage and avoid persisting the decline.
      clearAppStorage();
      setStoredConsent("declined");
      setConsent("declined");
    };

    return {
      consent,
      allowStorage: isStorageAllowed(),
      accept,
      decline,
    };
  }, [consent]);

  return <StorageConsentContext.Provider value={value}>{children}</StorageConsentContext.Provider>;
}

export function useStorageConsent() {
  const ctx = useContext(StorageConsentContext);
  if (!ctx) throw new Error("useStorageConsent must be used within StorageConsentProvider");
  return ctx;
}
