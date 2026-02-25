import { useMemo, useState } from "react";
import { useStorageConsent } from "../contexts/StorageConsentContext";

interface StorageNoticeProps {
  onOpenPrivacy?: () => void;
  onOpenTos?: () => void;
}

export function StorageNotice({ onOpenPrivacy, onOpenTos }: StorageNoticeProps) {
  const { consent, accept, decline } = useStorageConsent();
  const [expanded, setExpanded] = useState(false);

  // Requirement: users must accept to continue using the site.
  // So we show a blocking gate until consent === "accepted".
  const shouldShow = consent !== "accepted";

  const summary = useMemo(
    () =>
      "We use local storage to keep you signed in, cache vocabulary, and save your learning progress.",
    []
  );

  if (!shouldShow) return null;

  const declined = consent === "declined";

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Backdrop blocks the site */}
      <div className="absolute inset-0 bg-black/80" />

      <div className="relative h-full w-full flex items-end sm:items-center justify-center p-3 sm:p-6">
        <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl">
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-bold text-white">Local storage notice</p>
                <p className="mt-2 text-sm text-gray-400">{summary}</p>
                {declined && (
                  <p className="mt-3 text-sm text-red-300">
                    You declined. To use the app, please accept local storage.
                  </p>
                )}
              </div>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 border border-neutral-800 text-gray-300 hover:bg-neutral-800 hover:border-neutral-700 transition-colors"
              >
                {expanded ? "Hide" : "Details"}
              </button>
            </div>

            {expanded && (
              <div className="mt-4 text-sm text-gray-400 space-y-3">
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <span className="text-gray-200 font-semibold">Auth token</span> (to keep you signed in)
                  </li>
                  <li>
                    <span className="text-gray-200 font-semibold">Vocabulary cache</span> (faster loading)
                  </li>
                  <li>
                    <span className="text-gray-200 font-semibold">Learning progress cache</span> (so progress feels instant)
                  </li>
                </ul>
                <p className="text-xs text-gray-500">
                  Disabling local storage may cause you to lose learning progress on this device.
                </p>
                <div className="flex flex-wrap gap-3 text-xs">
                  <button
                    onClick={onOpenPrivacy}
                    className="text-gray-300 hover:text-white underline decoration-neutral-700 hover:decoration-neutral-300"
                    type="button"
                  >
                    Privacy Policy
                  </button>
                  <button
                    onClick={onOpenTos}
                    className="text-gray-300 hover:text-white underline decoration-neutral-700 hover:decoration-neutral-300"
                    type="button"
                  >
                    Terms of Service
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={decline}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 text-gray-200 text-sm font-semibold transition-colors"
              >
                Decline
              </button>
              <button
                onClick={accept}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors"
              >
                Accept and continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
