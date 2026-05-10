"use client";

export function BallotHeader({
  electionName,
  division,
  gradeLevel,
  section,
  selectedCount,
  totalPositions,
}: {
  electionName: string;
  division: string;
  gradeLevel: number;
  section: string;
  selectedCount: number;
  totalPositions: number;
}) {
  const progressPct = totalPositions > 0 ? (selectedCount / totalPositions) * 100 : 0;

  return (
    <header className="sticky top-0 z-40 bg-navy border-b-[3px] border-gold">
      <div className="flex items-center justify-between px-4 py-[5px] border-b border-gold/15">
        <span className="font-ballot-mono text-[9px] tracking-[0.28em] uppercase text-gold/45">
          OLPS COMELEC · Official Election Ballot
        </span>
        <span className="font-ballot-mono text-[9px] tracking-[0.28em] uppercase text-gold/45">
          {division}
        </span>
      </div>
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between px-4 py-[10px] gap-3">
        <div className="flex items-center gap-[10px] min-w-0">
          <div className="w-[3px] h-8 bg-gold rounded-sm shrink-0" />
          <div className="min-w-0">
            <p className="font-ballot-serif font-bold text-[14px] uppercase tracking-[0.1em] text-white whitespace-nowrap overflow-hidden text-ellipsis">
              {electionName}
            </p>
            <p className="font-ballot-mono text-[9px] tracking-[0.18em] uppercase text-white/40 mt-0.5">
              Official Ballot
            </p>
          </div>
        </div>
        <div className="flex items-center gap-[10px] shrink-0">
          <span className="hidden sm:block font-ballot-mono text-[9px] tracking-[0.16em] uppercase px-2 py-[3px] border border-gold/30 text-gold/70 whitespace-nowrap">
            Gr.{gradeLevel} · Sec.{section}
          </span>
          <div
            className="relative w-[72px] h-[26px] border-[1.5px] border-gold/35 bg-gold/[0.06] overflow-hidden"
            role="progressbar"
            aria-valuenow={selectedCount}
            aria-valuemin={0}
            aria-valuemax={totalPositions}
            aria-label={`${selectedCount} of ${totalPositions} positions voted`}
          >
            <div
              className="absolute inset-y-0 left-0 bg-gold/18 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center font-ballot-mono text-[10px] tracking-[0.14em] text-gold/85">
              {Math.round(progressPct)}%
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
