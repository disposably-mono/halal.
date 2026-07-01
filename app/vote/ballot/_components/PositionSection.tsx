"use client";

import { CandidateRow } from "./CandidateRow";
import { TWO_COL_THRESHOLD, type Position } from "./ballot-shared";

export function PositionSection({
  position,
  selectedCandidateId,
  onSelect,
  disabled,
  skipped,
  positionNumber,
}: {
  position: Position;
  selectedCandidateId: string | null;
  onSelect: (candidateId: string | null) => void;
  disabled: boolean;
  skipped: boolean;
  positionNumber: number;
}) {
  const twoCol = position.candidates.length >= TWO_COL_THRESHOLD;

  return (
    <section
      className={`
        border-2 bg-ballot-paper transition-all duration-200
        ${skipped
          ? "border-amber-600 shadow-[inset_3px_0_0_theme(colors.amber.600)]"
          : "border-navy"
        }
      `}
      aria-label={`Position: ${position.title}`}
    >
      <div className="flex items-stretch border-b-2 border-navy">
        <div className="w-11 min-w-[44px] flex items-center justify-center bg-navy shrink-0">
          <span className="font-ballot-mono text-[11px] font-bold tracking-[0.08em] text-gold">
            {String(positionNumber).padStart(2, "0")}
          </span>
        </div>
        <div className="flex-1 px-3 py-[9px] min-w-0">
          <h3 className="font-ballot-serif font-bold text-[13px] uppercase tracking-[0.14em] text-navy">
            {position.title}
          </h3>
          <p className="font-ballot-mono text-[9px] tracking-[0.14em] uppercase text-navy/40 mt-0.5">
            Vote for one · Candidates: {position.candidateGradeLabel}
            {position.voterLockLabel ? ` · ${position.voterLockLabel} only` : ""}
          </p>
        </div>
        <div className="flex items-center pr-3 shrink-0">
          {selectedCandidateId ? (
            <span className="font-ballot-mono text-[9px] tracking-[0.2em] uppercase font-bold px-[7px] py-[3px] border-[1.5px] border-navy/40 bg-navy/[0.06] text-navy">
              ✓ Voted
            </span>
          ) : skipped ? (
            <span className="font-ballot-mono text-[9px] tracking-[0.2em] uppercase font-bold px-[7px] py-[3px] border-[1.5px] border-amber-600/40 bg-amber-50 text-amber-700">
              Blank
            </span>
          ) : null}
        </div>
      </div>

      {position.candidates.length === 0 ? (
        <p className="font-ballot-mono text-navy/40 text-xs italic p-4 tracking-wide">
          No candidates filed for this position.
        </p>
      ) : (
        <div className={twoCol ? "grid grid-cols-2 max-sm:grid-cols-1" : "grid grid-cols-1"}>
          {position.candidates.map((c, idx) => (
            <div
              key={c.id}
              className={twoCol ? "border-r border-ballot-rule even:border-r-0" : undefined}
            >
              <CandidateRow
                candidate={c}
                index={idx}
                selected={selectedCandidateId === c.id}
                onSelect={() => onSelect(selectedCandidateId === c.id ? null : c.id)}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
