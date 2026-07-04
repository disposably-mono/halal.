"use client";

import { useMemo, useState } from "react";
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
  const filteredPositions = useMemo(
    () => filterCandidatePositions(positions, query),
    [positions, query],
  );

  if (positions.length === 0) {
    return <EmptyState title="No positions yet" hint="Seed all positions or add them one at a time above." />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/8 bg-admin-surface">
      <div className="flex flex-col gap-[13px] border-b border-white/[0.07] px-[18px] py-[13px] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">Positions &amp; Candidates</p>
          <p className="mt-[4px] text-[11px] text-white/35">{filteredPositions.length} of {positions.length} positions shown</p>
        </div>
        <SearchInput onSearch={setQuery} placeholder="Search positions or candidates" />
      </div>
      {filteredPositions.length === 0 ? (
        <EmptyState title="No candidates match" hint="Try a different position, name, or grade." />
      ) : (
        <div className="divide-y divide-white/5">
          {filteredPositions.map((position) => (
            <details key={position.id} open className="group">
              <summary className="flex cursor-pointer list-none items-center gap-[13px] px-[18px] py-[13px] transition-colors hover:bg-white/2">
                <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center text-white/35 transition-transform duration-200 group-open:rotate-90">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M2 1L6 4L2 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div className="flex min-w-[0px] flex-1 flex-col gap-[4px] sm:flex-row sm:items-center sm:gap-[9px]">
                  <AdminCardTitle>{position.title}</AdminCardTitle>
                  <span className="text-[10px] text-white/60">
                    Votes: {formatGradeList([...position.eligibleGrades], [...fullRange])} · Runs: {formatGradeList(parseGrades(position.candidateGrade), [...fullRange])}
                  </span>
                </div>
                {position.candidates.length === 0 && !isLocked ? (
                  <span className="shrink-0 rounded-full border border-gold/20 bg-gold/[0.07] px-[8px] py-[2px] text-[10px] font-semibold text-gold/80">
                    No candidates
                  </span>
                ) : (
                  <span className="shrink-0 text-[11px] text-white/60">
                    {position.candidates.length} candidate{position.candidates.length !== 1 ? "s" : ""}
                  </span>
                )}
              </summary>
              <div className="border-t border-white/4">
                {position.candidates.length === 0 ? (
                  <p className="py-[18px] pl-[58px] pr-[18px] text-[12px] italic text-white/60">No candidates added yet</p>
                ) : (
                  <div className="divide-y divide-white/4">
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
                  <form action={addCandidate} className="flex flex-col gap-[9px] border-t border-white/4 px-[18px] py-[13px] sm:flex-row sm:items-end sm:pl-[58px]">
                    <input type="hidden" name="positionId" value={position.id} />
                    <input type="hidden" name="electionId" value={electionId} />
                    <div className="flex flex-1 flex-col gap-[6px]">
                      <label className="text-[11px] text-white/45">Full name</label>
                      <AdminInput name="fullName" placeholder="e.g. Maria Santos" required />
                    </div>
                    <Button type="submit" variant="adminGhost" size="adminSm" className="min-h-[45px] shrink-0">Add</Button>
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
    <div className="flex items-center gap-[13px] py-[8px] pl-[58px] pr-[18px]">
      <div className="flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-full bg-blue-400/12 text-[11px] font-semibold text-blue-400">
        {initials}
      </div>
      <span className="min-w-[0px] flex-1 truncate text-[13px] text-white/80">{candidate.fullName}</span>
      <span className="text-[11px] text-white/40">Gr. {candidate.gradeLevel}</span>
      {canEditCandidates && (
        <form action={removeCandidate}>
          <input type="hidden" name="candidateId" value={candidate.id} />
          <input type="hidden" name="electionId" value={electionId} />
          <button
            type="submit"
            className="flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-[7px] text-white/25 transition-colors hover:text-red-400 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gold/40"
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
