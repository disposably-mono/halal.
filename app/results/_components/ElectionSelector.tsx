"use client";

import { DIVISION_LABELS, type ElectionMeta } from "./results-shared";

export function ElectionSelector({
  elections,
  currentIndex,
  onPrev,
  onNext,
}: {
  elections: ElectionMeta[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const currentElection = elections[currentIndex];
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < elections.length - 1;

  return (
    <div className="border-b border-white/8 px-6 py-3 flex items-center justify-between gap-4 bg-navy/20">
      <button
        onClick={onPrev}
        disabled={!canPrev}
        className="p-2 border border-white/10 rounded-sm text-white/40 hover:text-white/70 hover:border-white/25 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/20 focus-visible:border-gold/30 disabled:opacity-20 disabled:cursor-not-allowed"
        aria-label="Previous election"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="text-center min-w-0 flex-1">
        <p className="font-heading font-bold text-white text-sm tracking-wide uppercase truncate">
          {currentElection.name}
        </p>
        <p className="font-body text-white/30 text-xs mt-0.5">
          {DIVISION_LABELS[currentElection.division] ?? currentElection.division}
          {" · "}
          <span className="text-white/20">{currentIndex + 1} of {elections.length}</span>
        </p>
      </div>

      <button
        onClick={onNext}
        disabled={!canNext}
        className="p-2 border border-white/10 rounded-sm text-white/40 hover:text-white/70 hover:border-white/25 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/20 focus-visible:border-gold/30 disabled:opacity-20 disabled:cursor-not-allowed"
        aria-label="Next election"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
