interface TtsVoiceWarningProps {
  onMoreInfo?: () => void;
  className?: string;
}

export function TtsVoiceWarning({ onMoreInfo, className = "mb-3" }: TtsVoiceWarningProps) {
  return (
    <div className={`bg-amber-950/50 border border-amber-700/40 rounded-xl px-3 py-2 text-amber-300 text-xs flex items-start gap-2 ${className}`}>
      <span className="shrink-0 mt-0.5">⚠</span>
      <span>
        No Chinese TTS voice detected. Windows: Settings → Time &amp; language → Speech → Add voices → Chinese (Simplified).
        {onMoreInfo && (
          <>
            {" "}
            <button
              onClick={onMoreInfo}
              className="underline hover:text-amber-200 transition-colors"
            >
              More information
            </button>
          </>
        )}
      </span>
    </div>
  );
}
