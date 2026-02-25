import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  readStoredConsent,
  setStoredConsent,
  type StorageConsentState,
  isAnalyticsAllowed,
} from "../utils/storageConsent";

interface StorageConsentContextType {
  consent: StorageConsentState;
  allowAnalytics: boolean;
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
      // Decline only disables OPTIONAL analytics. Essential storage stays enabled.
      setStoredConsent("declined");
      setConsent("declined");
    };

    return {
      consent,
      allowAnalytics: isAnalyticsAllowed(),
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
