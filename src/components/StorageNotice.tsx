import { useState } from "react";
import { useStorageConsent } from "../contexts/StorageConsentContext";

interface StorageNoticeProps {
  onOpenPrivacy?: () => void;
  onOpenTos?: () => void;
}

export function StorageNotice({ onOpenPrivacy, onOpenTos }: StorageNoticeProps) {
  const { consent, accept, decline } = useStorageConsent();
  const [expanded, setExpanded] = useState(false);

  // Banner shows only until the user makes a choice.
  if (consent !== "unknown") return null;

  const message =
    "We use essential cookies and local storage to keep you signed in and save your learning progress. With your permission, we also use analytics to improve the app.";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[70] p-3 sm:p-4">
      <div className="mx-auto max-w-5xl rounded-2xl border border-neutral-800 bg-neutral-950/95 shadow-2xl">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-200 leading-relaxed">{message}</p>

              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-2 text-xs text-gray-400 hover:text-gray-200 underline decoration-neutral-700 hover:decoration-neutral-400"
              >
                {expanded ? "Hide details" : "Details"}
              </button>

              {expanded && (
                <div className="mt-3 text-xs text-gray-400 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-800">
                      Necessary storage: <span className="text-gray-200 font-semibold">always on</span>
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-800">
                      Analytics: <span className="text-gray-200 font-semibold">optional</span>
                    </span>
                  </div>
                  <p>
                    Declining analytics will not affect core features, but may reduce our ability to improve the app.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      onClick={onOpenTos}
                      className="text-gray-300 hover:text-white underline decoration-neutral-700 hover:decoration-neutral-300"
                      type="button"
                    >
                      Terms of Service
                    </button>
                    <button
                      onClick={onOpenPrivacy}
                      className="text-gray-300 hover:text-white underline decoration-neutral-700 hover:decoration-neutral-300"
                      type="button"
                    >
                      Privacy Policy
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 sm:flex-col sm:items-stretch sm:justify-start">
              <button
                onClick={decline}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 text-gray-200 text-sm font-semibold transition-colors"
              >
                Decline
              </button>
              <button
                onClick={accept}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
