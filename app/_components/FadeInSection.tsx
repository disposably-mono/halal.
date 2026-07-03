"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Shared "fade up" mount transition for the public info pages' hero content
 * (home, about, officers, creator) — starts translated down + transparent,
 * then eases in shortly after mount. Kept as its own client boundary so
 * server-rendered pages (about, creator) don't need to become client
 * components just to get this effect.
 */
export function FadeInSection({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
    >
      {children}
    </div>
  );
}
