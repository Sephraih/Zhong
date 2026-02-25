import { useMemo, useState } from "react";
import { useStorageConsent } from "../contexts/StorageConsentContext";

interface StorageNoticeProps {
  onOpenPrivacy?: () => void;
  onOpenTos?: () => void;
}

export function StorageNotice({ onOpenPrivacy, onOpenTos }: StorageNoticeProps) {
  const { consent, accept, decline } = useStorageConsent();
  const [expanded, setExpanded] = useState(false);

  const shouldShow = consent === "unknown";

  const summary = useMemo(
    () =>
      "We use local storage to keep you signed in, cache vocabulary, and save your learning progress.",
    []
  );

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-3 sm:p-4">
      <div className="max-w-4xl mx-auto rounded-2xl border border-neutral-800 bg-neutral-950/90 backdrop-blur shadow-2xl">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">Local storage notice</p>
                <p className="mt-1 text-sm text-gray-400">{summary}</p>
              </div>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 border border-neutral-800 text-gray-300 hover:bg-neutral-800 hover:border-neutral-700 transition-colors"
              >
                {expanded ? "Hide" : "Details"}
              </button>
            </div>

            {expanded && (
              <div className="mt-3 text-sm text-gray-400 space-y-2">
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
                  If you decline, the app will still work, but you may be signed out on refresh and could lose progress
                  on this device.
                </p>
                <div className="flex flex-wrap gap-3 text-xs">
                  <button
                    onClick={onOpenPrivacy}
                    className="text-gray-400 hover:text-white underline decoration-neutral-700 hover:decoration-neutral-300"
                    type="button"
                  >
                    Privacy Policy
                  </button>
                  <button
                    onClick={onOpenTos}
                    className="text-gray-400 hover:text-white underline decoration-neutral-700 hover:decoration-neutral-300"
                    type="button"
                  >
                    Terms of Service
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 sm:flex-col sm:items-stretch">
            <button
              onClick={accept}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors"
            >
              Accept
            </button>
            <button
              onClick={decline}
              className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 text-gray-200 text-sm font-semibold transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
