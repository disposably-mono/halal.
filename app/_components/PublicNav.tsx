"use client";

import { Link } from "next-view-transitions";

// Sticky top chrome shared by the public voter-facing pages (results, vote,
// verify). The right-hand label changes per page; everything else is identical
// so the three pages read as one product.
export function PublicNav({ label = "Results" }: { label?: string }) {
  return (
    <nav className="sticky top-[0px] z-40 border-b border-gold/10 bg-navy-deep/88 px-[19px] py-[19px] backdrop-blur-md sm:px-[27px]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-[19px]">
        <Link
          href="/"
          className="inline-flex items-center gap-[12px] font-body text-[14px] tracking-[0.2em] uppercase text-mid transition-colors hover:text-gold/80 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
        >
          <span
            className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-gold/30 bg-navy"
            aria-hidden="true"
          >
            <svg width="17" height="17" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Home
        </Link>
        <div className="text-right">
          <p className="font-body text-gold/50 text-[12px] tracking-[0.3em] uppercase">
            OLPS COMELEC
          </p>
          <p className="font-heading text-white/60 text-[14px] tracking-[0.2em] uppercase">
            {label}
          </p>
        </div>
      </div>
    </nav>
  );
}
