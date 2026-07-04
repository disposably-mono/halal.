"use client";

import { DIVISION_CODES, type ElectionMeta } from "./results-shared";

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
    <section className="border-b border-white/8 bg-navy/20 px-[19px] py-[14px] sm:px-[27px]">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-[19px]">
        <button
          onClick={onPrev}
          disabled={!canPrev}
          className="rounded-sm border border-white/10 p-[10px] text-white/50 transition-all hover:border-gold/30 hover:text-gold focus-visible:border-gold/40 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gold/30 disabled:cursor-not-allowed disabled:opacity-20"
          aria-label="Previous election"
        >
          <svg width="17" height="17" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="min-w-[0px] flex-1 text-center">
          <p className="truncate font-heading text-[17px] font-bold uppercase tracking-wide text-white">
            {currentElection.name}
          </p>
          <p className="mt-[2px] font-body text-[14px] text-white/35">
            {DIVISION_CODES[currentElection.division] ?? currentElection.division}
            {" · "}
            <span className="text-white/35">{currentIndex + 1} of {elections.length}</span>
          </p>
        </div>

        <button
          onClick={onNext}
          disabled={!canNext}
          className="rounded-sm border border-white/10 p-[10px] text-white/50 transition-all hover:border-gold/30 hover:text-gold focus-visible:border-gold/40 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gold/30 disabled:cursor-not-allowed disabled:opacity-20"
          aria-label="Next election"
        >
          <svg width="17" height="17" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </section>
  );
}
