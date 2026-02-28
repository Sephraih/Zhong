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
          size?: "normal" | "compact";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
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
  className?: string;
}

export function TurnstileWidget({
  siteKey,
  onToken,
  theme = "dark",
  compact = false,
  className,
}: TurnstileWidgetProps) {
  const containerId = useId();
  const widgetIdRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

        const widgetId = window.turnstile.render(el, {
          sitekey: siteKey,
          theme,
          size: compact ? "compact" : "normal",
          callback: (token) => {
            onToken(token);
          },
          "expired-callback": () => {
            onToken(null);
          },
          "error-callback": () => {
            setError("Captcha failed to load. Please try again.");
            onToken(null);
          },
        });

        widgetIdRef.current = widgetId;
        setError(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load captcha";
        setError(msg);
        onToken(null);
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
  }, [containerId, siteKey, theme, compact, onToken]);

  return (
    <div className={className}>
      <div id={containerId} />
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
