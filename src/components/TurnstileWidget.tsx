import { useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "invisible";
          appearance?: "always" | "execute" | "interaction-only";
          "response-field"?: boolean;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      execute: (container: string | HTMLElement, options?: object) => void;
    };
  }
}

const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function ensureTurnstileScriptLoaded(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();

    // Already available
    if (window.turnstile?.render) return resolve();

    // Already requested
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src^="${TURNSTILE_SCRIPT_SRC}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Turnstile")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Failed to load Turnstile")), { once: true });
    document.head.appendChild(script);
  });
}

interface TurnstileWidgetProps {
  siteKey: string;
  onToken: (token: string | null) => void;
  theme?: "light" | "dark" | "auto";
  compact?: boolean;
  invisible?: boolean;
  className?: string;
}

export function TurnstileWidget({
  siteKey,
  onToken,
  theme = "dark",
  compact = false,
  invisible = false,
  className,
}: TurnstileWidgetProps) {
  const containerId = useId();
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const [status, setStatus] = useState<"loading" | "ready" | "verified" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  // Keep onToken ref up to date without triggering re-renders
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await ensureTurnstileScriptLoaded();
        if (!mounted) return;

        if (!window.turnstile?.render) {
          throw new Error("Turnstile not available");
        }

        const el = document.getElementById(containerId);
        if (!el) return;

        // Prevent double-render
        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // ignore
          }
          widgetIdRef.current = null;
        }

        setStatus("ready");

        const widgetId = window.turnstile.render(el, {
          sitekey: siteKey,
          theme,
          size: invisible ? "invisible" : compact ? "compact" : "normal",
          appearance: "interaction-only", // Only show when interaction needed
          "response-field": false, // Don't add hidden input
          callback: (token) => {
            setStatus("verified");
            onTokenRef.current(token);
          },
          "expired-callback": () => {
            setStatus("ready");
            onTokenRef.current(null);
          },
          "error-callback": () => {
            setStatus("error");
            setError("Captcha verification failed. Please refresh and try again.");
            onTokenRef.current(null);
          },
        });

        widgetIdRef.current = widgetId;
        setError(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load captcha";
        setStatus("error");
        setError(msg);
        onTokenRef.current(null);
      }
    };

    init();

    return () => {
      mounted = false;
      if (widgetIdRef.current && window.turnstile?.remove) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
      }
      widgetIdRef.current = null;
    };
  }, [containerId, siteKey, theme, compact, invisible]);

  // For managed mode: if we're verified, show a success indicator; otherwise render the widget
  return (
    <div className={className}>
      {status === "verified" ? (
        <div className="flex items-center gap-2 text-emerald-400 text-sm py-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Verified
        </div>
      ) : (
        <>
          {/* Fixed height container to prevent layout shifts */}
          <div 
            id={containerId} 
            className="min-h-[65px]"
            style={{ minHeight: compact ? "65px" : "65px" }}
          />
          {status === "loading" && (
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <div className="w-3 h-3 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin" />
              Loading security check...
            </div>
          )}
        </>
      )}
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
