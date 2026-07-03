"use client";

import { Link } from "next-view-transitions";

// Sticky top chrome shared by the public voter-facing pages (results, vote,
// verify). The right-hand label changes per page; everything else is identical
// so the three pages read as one product.
export function PublicNav({ label = "Results" }: { label?: string }) {
  return (
    <nav className="sticky top-0 z-40 border-b border-gold/10 bg-navy-deep/88 px-4 py-4 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 font-body text-xs tracking-[0.2em] uppercase text-mid transition-colors hover:text-gold/80 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-navy"
            aria-hidden="true"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Home
        </Link>
        <div className="text-right">
          <p className="font-body text-gold/50 text-[10px] tracking-[0.3em] uppercase">
            OLPS COMELEC
          </p>
          <p className="font-heading text-white/60 text-xs tracking-[0.2em] uppercase">
            {label}
          </p>
        </div>
      </div>
    </nav>
  );
}
