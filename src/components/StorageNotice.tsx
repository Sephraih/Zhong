import { useStorageConsent } from "../contexts/StorageConsentContext";

interface StorageNoticeProps {
  onOpenPrivacy?: () => void;
  onOpenTos?: () => void;
}

export function StorageNotice({ onOpenPrivacy, onOpenTos }: StorageNoticeProps) {
  const { consent, accept } = useStorageConsent();

  if (consent !== "unknown") return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[70] p-3 sm:p-4">
      <div className="mx-auto max-w-5xl rounded-2xl border border-neutral-800 bg-neutral-950/95 shadow-2xl">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <div className="flex-1 space-y-1.5">
              <p className="text-sm text-gray-200 leading-relaxed">
                We only store what's functionally necessary — your login details and learning progress.
                No data is collected or shared beyond that.
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Our goal is to provide a useful tool without any hidden costs. If you'd like to support the app,
                we'd love for you to consider{" "}
                <span className="text-amber-400 font-semibold">Premium</span>.
              </p>
              <div className="flex gap-3 pt-0.5">
                <button
                  onClick={onOpenTos}
                  className="text-xs text-gray-500 hover:text-gray-300 underline decoration-neutral-700 hover:decoration-neutral-400"
                  type="button"
                >
                  Terms of Service
                </button>
                <button
                  onClick={onOpenPrivacy}
                  className="text-xs text-gray-500 hover:text-gray-300 underline decoration-neutral-700 hover:decoration-neutral-400"
                  type="button"
                >
                  Privacy Policy
                </button>
              </div>
            </div>

            <button
              onClick={accept}
              className="sm:flex-none px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 text-gray-200 text-sm font-semibold transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
