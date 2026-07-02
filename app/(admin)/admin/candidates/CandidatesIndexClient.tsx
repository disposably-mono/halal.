"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  EmptyState,
  MetricCard,
  PageHeader,
  SearchInput,
} from "@/components/admin/ui";
import { formatGradeList, parseGrades } from "@/lib/domain/grade-format";
import { gradesForDivision } from "@/lib/elections/constants";
import { DIVISION_CODES } from "@/lib/ui/division-labels";
import {
  buildCandidateIndex,
  filterCandidateIndex,
  summarizeCandidateIndex,
  type CandidateDivisionFilter,
  type CandidateIndexPosition,
  type CandidateStatusFilter,
} from "./candidate-index";

const STATUS_OPTIONS: CandidateStatusFilter[] = ["ALL", "OPEN", "SCHEDULED", "DRAFT", "CLOSED"];

export function CandidatesIndexClient({ positions }: { positions: CandidateIndexPosition[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CandidateStatusFilter>("ALL");
  const [division, setDivision] = useState<CandidateDivisionFilter>("ALL");
  const onSearch = useCallback((value: string) => setQuery(value), []);

  const index = useMemo(() => buildCandidateIndex(positions), [positions]);
  const filtered = useMemo(
    () => filterCandidateIndex(index, { query, status, division }),
    [division, index, query, status],
  );
  const totalSummary = useMemo(() => summarizeCandidateIndex(index), [index]);
  const visibleSummary = useMemo(() => summarizeCandidateIndex(filtered), [filtered]);
  const divisionOptions = useMemo(
    () => index.map((group) => ({ value: group.division, label: DIVISION_CODES[group.division] ?? group.label })),
    [index],
  );

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="Candidates"
        meta={`${visibleSummary.candidates.toLocaleString()} of ${totalSummary.candidates.toLocaleString()} candidates visible`}
      />

      <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Candidates" value={totalSummary.candidates.toLocaleString()} sub={`${totalSummary.positions} positions`} accent="gold" />
        <MetricCard label="Elections" value={totalSummary.elections.toLocaleString()} sub={`${totalSummary.divisions} divisions`} />
        <MetricCard label="Visible" value={visibleSummary.candidates.toLocaleString()} sub={`${visibleSummary.elections} elections shown`} accent="blue" />
        <MetricCard label="Open Filters" value={activeFilterCount({ query, status, division }).toString()} sub="search, status, division" />
      </div>

      <div className="rounded-[12px] border border-white/[0.07] bg-admin-surface px-4 py-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/50">Candidate Index</p>
            <p className="mt-1 text-[10px] text-white/35">{visibleSummary.positions} positions matched</p>
          </div>
          <SearchInput onSearch={onSearch} placeholder="Search candidate, position, election" className="sm:max-w-none xl:w-[420px]" />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <FilterChip active={division === "ALL"} onClick={() => setDivision("ALL")}>All divisions</FilterChip>
          {divisionOptions.map((option) => (
            <FilterChip
              key={option.value}
              active={division === option.value}
              onClick={() => setDivision(option.value)}
            >
              {option.label}
            </FilterChip>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((option) => (
            <FilterChip key={option} active={status === option} onClick={() => setStatus(option)}>
              {option}
            </FilterChip>
          ))}
        </div>
      </div>

      {totalSummary.candidates === 0 ? (
        <EmptyState title="No candidates encoded yet" hint="Add candidates from an election's Candidates page." />
      ) : filtered.length === 0 ? (
        <EmptyState title="No candidates match" hint="Try a different search, status, or division filter." />
      ) : (
        <div className="space-y-4">
          {filtered.map((divisionGroup) => (
            <details key={divisionGroup.division} open className="group">
              <summary className="flex cursor-pointer list-none items-center gap-3 py-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/45">
                  {divisionGroup.label}
                </span>
                <span className="h-px flex-1 bg-white/[0.05]" />
                <span className="text-[10px] text-white/55">
                  {divisionGroup.totalCandidates} candidates · {divisionGroup.positionCount} positions
                </span>
                <span className="text-[12px] text-white/35 transition-transform group-open:rotate-90">›</span>
              </summary>
              <div className="mt-2 grid gap-3">
                {divisionGroup.elections.map((election) => (
                  <details key={election.id} open className="overflow-hidden rounded-[12px] border border-white/[0.07] bg-admin-surface">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <StatusDot status={election.status} />
                        <span className="truncate text-[12px] font-semibold text-white/80">{election.name}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 text-[10px] text-white/50">
                        <span>{election.totalCandidates} cand. · {election.positionCount} pos.</span>
                        <Link href={`/admin/elections/${election.id}/candidates`} className="rounded-[5px] border border-gold/20 bg-gold/[0.07] px-[7px] py-[3px] text-gold no-underline transition-all hover:bg-gold/[0.14]">
                          Manage
                        </Link>
                      </div>
                    </summary>
                    <div className="divide-y divide-white/[0.04]">
                      {election.positions.map((position) => (
                        <PositionBlock key={position.id} position={position} />
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </>
  );
}

function PositionBlock({ position }: { position: CandidateIndexPosition }) {
  const fullGrades = gradesForDivision(position.election.division as Parameters<typeof gradesForDivision>[0]);
  const votingGrades = formatGradeList(position.eligibleGrades, fullGrades);
  const candidateGrades = formatGradeList(parseGrades(position.candidateGrade), fullGrades);

  return (
    <section className="px-4 py-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-white/65">{position.title}</h3>
        <p className="text-[10px] text-white/45">Votes: {votingGrades} · Runs: {candidateGrades}</p>
      </div>
      {position.candidates.length === 0 ? (
        <p className="mt-2 text-[11px] italic text-white/45">No candidates encoded</p>
      ) : (
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {position.candidates.map((candidate, index) => (
            <div key={candidate.id} className="flex min-w-0 items-center gap-3 rounded-[7px] bg-white/[0.025] px-3 py-2">
              <span className="w-5 shrink-0 text-right font-mono text-[10px] text-white/45">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-white/80">{candidate.fullName}</span>
              <span className="shrink-0 font-mono text-[10px] text-white/40">Gr. {candidate.gradeLevel}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[6px] border px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.06em] transition-colors ${active ? "border-gold/30 bg-gold/10 text-gold" : "border-white/[0.08] bg-white/[0.03] text-white/45 hover:text-white/70"}`}
    >
      {children}
    </button>
  );
}

function StatusDot({ status }: { status: CandidateStatusFilter }) {
  const colors: Record<Exclude<CandidateStatusFilter, "ALL">, string> = {
    OPEN: "bg-emerald-400",
    SCHEDULED: "bg-blue-400",
    DRAFT: "bg-white/20",
    CLOSED: "bg-white/10",
  };
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-white/50">
      <span className={`h-[6px] w-[6px] rounded-full ${colors[status as Exclude<CandidateStatusFilter, "ALL">]}`} />
      {status}
    </span>
  );
}

function activeFilterCount(filters: {
  query: string;
  status: CandidateStatusFilter;
  division: CandidateDivisionFilter;
}) {
  return [filters.query.trim().length > 0, filters.status !== "ALL", filters.division !== "ALL"].filter(Boolean).length;
}
