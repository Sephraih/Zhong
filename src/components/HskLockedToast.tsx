import { useEffect, useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";

export function useLockedToast() {
  const isMobile = useIsMobile();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    if (!isMobile) return;
    const t = window.setTimeout(() => setMessage(null), 2200);
    return () => window.clearTimeout(t);
  }, [message, isMobile]);

  return { message, setMessage, isMobile };
}

export function LockedToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mt-3 text-center">
      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-gray-300">
        {message}
      </span>
    </div>
  );
}
