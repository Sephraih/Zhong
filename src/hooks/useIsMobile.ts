import { useState, useEffect } from "react";

/**
 * Detects whether the user is on a mobile/touch device.
 * Uses a combination of:
 *  1. Screen width (≤ 768px)
 *  2. Touch capability detection
 *  3. User-agent sniffing as a fallback
 *
 * Re-evaluates on window resize so tablets in landscape
 * can switch to desktop mode.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => detect());

  useEffect(() => {
    const handleResize = () => setIsMobile(detect());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}

function detect(): boolean {
  if (typeof window === "undefined") return false;

  // Primary: touch points
  const hasTouch =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error — vendor-prefixed
    navigator.msMaxTouchPoints > 0;

  // Secondary: narrow viewport
  const isNarrow = window.innerWidth <= 768;

  // Tertiary: UA sniffing (catches most phones/tablets)
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  // Consider mobile if touch + (narrow OR mobile UA)
  return hasTouch && (isNarrow || mobileUA);
}
