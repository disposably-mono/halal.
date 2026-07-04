"use client";

import { Spinner } from "@/components/ui/spinner";

export function BallotFooter({
  allSelected,
  totalPositions,
  remaining,
  isPending,
  onSubmit,
}: {
  allSelected: boolean;
  totalPositions: number;
  remaining: number;
  isPending: boolean;
  onSubmit: () => void;
}) {
  return (
    <footer className="sticky bottom-[0px] bg-navy border-t-[3px] border-gold shadow-[0_-2px_12px_rgba(0,0,0,0.2)]">
      <div className="max-w-2xl mx-auto px-[18px] py-[11px] flex items-center justify-between gap-[18px]">
        {allSelected ? (
          <p className="font-ballot-mono text-[11px] tracking-[0.16em] uppercase text-gold/85">
            ✓ All {totalPositions} positions completed
          </p>
        ) : (
          <p className="font-ballot-mono text-[11px] tracking-[0.16em] uppercase text-white/38">
            {remaining} position{remaining !== 1 ? "s" : ""} remaining
          </p>
        )}
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending}
          className="px-[25px] py-[11px] bg-gold text-navy font-ballot-mono text-[12px] font-bold tracking-[0.22em] uppercase hover:opacity-[0.88] active:opacity-75 transition-opacity focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gold/45 focus-visible:ring-offset-2 focus-visible:ring-offset-navy disabled:opacity-45 disabled:cursor-not-allowed flex items-center gap-[9px]"
        >
          {isPending ? (
            <>
              <Spinner className="w-[16px] h-[16px]" />
              Submitting…
            </>
          ) : (
            "Submit Ballot →"
          )}
        </button>
      </div>
    </footer>
  );
}
