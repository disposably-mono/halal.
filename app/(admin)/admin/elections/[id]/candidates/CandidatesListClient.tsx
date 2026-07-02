"use client";

import { useCallback, useMemo, useState } from "react";
import { parseGrades, formatGradeList } from "@/lib/domain/grade-format";
import {
  AdminCardTitle,
  AdminInput,
  EmptyState,
  SearchInput,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { addCandidate, removeCandidate } from "./actions";
import {
  filterCandidatePositions,
  type CandidatePositionSearchRow,
} from "./candidate-search";

type PositionRow = CandidatePositionSearchRow;

export function CandidatesListClient({
  positions,
  electionId,
  fullRange,
  isLocked,
  canEditCandidates,
}: {
  positions: PositionRow[];
  electionId: string;
  fullRange: number[];
  isLocked: boolean;
  canEditCandidates: boolean;
}) {
  const [query, setQuery] = useState("");
  const onSearch = useCallback((value: string) => setQuery(value), []);
  const filteredPositions = useMemo(
    () => filterCandidatePositions(positions, query),
    [positions, query],
  );

  if (positions.length === 0) {
    return <EmptyState title="No positions yet" hint="Seed all positions or add them one at a time above." />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-admin-surface">
      <div className="flex flex-col gap-3 border-b border-white/[0.07] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/50">Positions &amp; Candidates</p>
          <p className="mt-1 text-[10px] text-white/35">{filteredPositions.length} of {positions.length} positions shown</p>
        </div>
        <SearchInput onSearch={onSearch} placeholder="Search positions or candidates" />
      </div>
      {filteredPositions.length === 0 ? (
        <EmptyState title="No candidates match" hint="Try a different position, name, or grade." />
      ) : (
        <div className="divide-y divide-white/[0.05]">
          {filteredPositions.map((position) => (
            <details key={position.id} open className="group">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center text-white/35 transition-transform duration-200 group-open:rotate-90">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M2 1L6 4L2 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                  <AdminCardTitle>{position.title}</AdminCardTitle>
                  <span className="text-[9px] text-white/60">
                    Votes: {formatGradeList([...position.eligibleGrades], [...fullRange])} · Runs: {formatGradeList(parseGrades(position.candidateGrade), [...fullRange])}
                  </span>
                </div>
                {position.candidates.length === 0 && !isLocked ? (
                  <span className="shrink-0 rounded-full border border-gold/20 bg-gold/[0.07] px-[7px] py-[2px] text-[9px] font-semibold text-gold/80">
                    No candidates
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] text-white/60">
                    {position.candidates.length} candidate{position.candidates.length !== 1 ? "s" : ""}
                  </span>
                )}
              </summary>
              <div className="border-t border-white/[0.04]">
                {position.candidates.length === 0 ? (
                  <p className="py-4 pl-[52px] pr-4 text-[11px] italic text-white/60">No candidates added yet</p>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {position.candidates.map((candidate) => (
                      <CandidateItem
                        key={candidate.id}
                        candidate={candidate}
                        electionId={electionId}
                        canEditCandidates={canEditCandidates}
                      />
                    ))}
                  </div>
                )}
                {canEditCandidates && (
                  <form action={addCandidate} className="flex flex-col gap-2 border-t border-white/[0.04] px-4 py-3 sm:flex-row sm:items-end sm:pl-[52px]">
                    <input type="hidden" name="positionId" value={position.id} />
                    <input type="hidden" name="electionId" value={electionId} />
                    <div className="flex flex-1 flex-col gap-[5px]">
                      <label className="text-[10px] text-white/45">Full name</label>
                      <AdminInput name="fullName" placeholder="e.g. Maria Santos" required />
                    </div>
                    <Button type="submit" variant="adminGhost" size="adminSm" className="min-h-10 shrink-0">Add</Button>
                  </form>
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

function CandidateItem({
  candidate,
  electionId,
  canEditCandidates,
}: {
  candidate: PositionRow["candidates"][number];
  electionId: string;
  canEditCandidates: boolean;
}) {
  const initials = candidate.fullName
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

  return (
    <div className="flex items-center gap-3 py-[7px] pl-[52px] pr-4">
      <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-blue-400/[0.12] text-[10px] font-semibold text-blue-400">
        {initials}
      </div>
      <span className="min-w-0 flex-1 truncate text-[12px] text-white/80">{candidate.fullName}</span>
      <span className="text-[10px] text-white/40">Gr. {candidate.gradeLevel}</span>
      {canEditCandidates && (
        <form action={removeCandidate}>
          <input type="hidden" name="candidateId" value={candidate.id} />
          <input type="hidden" name="electionId" value={electionId} />
          <button
            type="submit"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] text-white/25 transition-colors hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
            title="Remove candidate"
            aria-label={`Remove ${candidate.fullName}`}
          >
            ×
          </button>
        </form>
      )}
    </div>
  );
}
