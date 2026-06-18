"use client";

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
    <footer className="sticky bottom-0 bg-navy border-t-[3px] border-gold shadow-[0_-2px_12px_rgba(0,0,0,0.2)]">
      <div className="max-w-2xl mx-auto px-4 py-[10px] flex items-center justify-between gap-4">
        {allSelected ? (
          <p className="font-ballot-mono text-[10px] tracking-[0.16em] uppercase text-gold/85">
            ✓ All {totalPositions} positions completed
          </p>
        ) : (
          <p className="font-ballot-mono text-[10px] tracking-[0.16em] uppercase text-white/38">
            {remaining} position{remaining !== 1 ? "s" : ""} remaining
          </p>
        )}
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending}
          className="px-[22px] py-[10px] bg-gold text-navy font-ballot-mono text-[11px] font-bold tracking-[0.22em] uppercase hover:opacity-[0.88] active:opacity-75 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/45 focus-visible:ring-offset-2 focus-visible:ring-offset-navy disabled:opacity-45 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isPending ? (
            <>
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
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
