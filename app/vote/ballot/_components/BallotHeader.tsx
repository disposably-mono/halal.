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
    <header className="sticky top-[0px] z-40 bg-navy border-b-[3px] border-gold">
      <div className="flex items-center justify-between px-[18px] py-[6px] border-b border-gold/15">
        <span className="font-ballot-mono text-[10px] tracking-[0.28em] uppercase text-gold/45">
          OLPS COMELEC · Official Election Ballot
        </span>
        <span className="font-ballot-mono text-[10px] tracking-[0.28em] uppercase text-gold/45">
          {division}
        </span>
      </div>
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between px-[18px] py-[11px] gap-[14px]">
        <div className="flex items-center gap-[11px] min-w-[0px]">
          <div className="w-[3px] h-[36px] bg-gold rounded-sm shrink-0" />
          <div className="min-w-[0px]">
            <p className="font-ballot-serif font-bold text-[16px] uppercase tracking-widest text-white whitespace-nowrap overflow-hidden text-ellipsis">
              {electionName}
            </p>
            <p className="font-ballot-mono text-[10px] tracking-[0.18em] uppercase text-white/50 mt-[2px]">
              Official Ballot
            </p>
          </div>
        </div>
        <div className="flex items-center gap-[11px] shrink-0">
          <span className="hidden sm:block font-ballot-mono text-[10px] tracking-[0.16em] uppercase px-[9px] py-[3px] border border-gold/30 text-gold/70 whitespace-nowrap">
            Gr.{gradeLevel} · Sec.{section}
          </span>
          <div
            className="relative w-[81px] h-[29px] border-[1.5px] border-gold/35 bg-gold/6 overflow-hidden"
            role="progressbar"
            aria-valuenow={selectedCount}
            aria-valuemin={0}
            aria-valuemax={totalPositions}
            aria-label={`${selectedCount} of ${totalPositions} positions voted`}
          >
            <div
              className="absolute inset-y-[0px] left-[0px] bg-gold/18 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
            <span className="absolute inset-[0px] flex items-center justify-center font-ballot-mono text-[11px] tracking-[0.14em] text-gold/85">
              {Math.round(progressPct)}%
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
