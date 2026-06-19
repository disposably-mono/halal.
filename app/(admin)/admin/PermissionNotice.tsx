"use client";

import { useEffect, useState } from "react";
import { deniedMessage } from "@/lib/auth/permissions";

/**
 * Dashboard banner shown after a capability guard (page, middleware, or
 * redirecting server action) bounces a forbidden user back to `/admin?denied=…`.
 *
 * The message is computed once from the server-provided `denied` value, then the
 * query param is stripped from the URL with `history.replaceState` (no navigation,
 * so the banner survives) — a manual refresh won't re-show it, but the user still
 * gets a clear, dismissible explanation instead of a silent landing.
 */
export default function PermissionNotice({ denied }: { denied?: string }) {
  const [message, setMessage] = useState<string | null>(() => deniedMessage(denied));

  useEffect(() => {
    if (denied) window.history.replaceState({}, "", "/admin");
  }, [denied]);

  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.08] px-4 py-3"
    >
      <div className="flex items-start gap-2.5">
        <svg
          style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-amber-400"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div>
          <p className="text-[12px] font-semibold text-amber-300/90">
            Permission denied
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-amber-200/70">
            {message}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setMessage(null)}
        aria-label="Dismiss"
        className="shrink-0 rounded-[5px] px-[6px] py-[2px] text-[13px] leading-none text-amber-300/60 transition-colors hover:bg-amber-400/10 hover:text-amber-200"
      >
        ✕
      </button>
    </div>
  );
}
