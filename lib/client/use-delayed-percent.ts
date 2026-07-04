"use client";

import { useEffect, useState } from "react";

/**
 * Animates a percentage in after a short delay, so bars/badges don't snap to
 * their final width on first paint. Returns 0 until `delayMs` has elapsed,
 * then the current `pct` value (and re-arms whenever `pct` changes).
 */
export function useDelayedPercent(pct: number, delayMs = 80): number {
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDisplayPct(pct), delayMs);
    return () => clearTimeout(t);
  }, [pct, delayMs]);

  return displayPct;
}
