"use client";

import Link from "next/link";

export function ResultsNav() {
  return (
    <nav className="border-b border-white/8 px-6 py-4 flex items-center justify-between">
      <Link
        href="/"
        className="inline-flex items-center gap-2 font-body text-mid text-xs tracking-[0.2em] uppercase hover:text-gold/70 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-50">
          <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Home
      </Link>
      <p className="font-body text-gold/40 text-[10px] tracking-[0.3em] uppercase">
        OLPS COMELEC · Results
      </p>
    </nav>
  );
}
