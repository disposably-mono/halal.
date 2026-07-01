"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "next-view-transitions";
import { acknowledge, hasAcknowledged } from "@/lib/cookie-consent";

// Essential-cookie notice. Renders nothing on the server and until after mount
// (avoids a hydration flash), then shows only if the user has not acknowledged.
export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasAcknowledged()) setVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    acknowledge();
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, dismiss]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-gold/20 bg-navy-deep/95 px-6 py-4 backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="font-body text-sm leading-6 text-white/70">
          We use essential cookies to keep voting secure and anonymous — no
          tracking, no ads.{" "}
          <Link
            href="/privacy"
            className="text-gold underline-offset-2 hover:underline"
          >
            Data &amp; Privacy Policy
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss cookie notice"
          className="shrink-0 rounded-sm border border-gold/40 px-5 py-2 font-heading text-xs font-bold uppercase tracking-[0.18em] text-gold/90 transition-colors hover:border-gold/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
