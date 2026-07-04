"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  Disclosure,
  DisclosureChevron,
  EmptyState,
  FilterGrid,
  FilterGroup,
  FilterOption,
  FilterPanel,
  highlightMatch,
  MetricCard,
  PageHeader,
  SearchInput,
} from "@/components/admin/ui";
import { formatGradeList, parseGrades } from "@/lib/domain/grade-format";
import { gradesForDivision } from "@/lib/elections/constants";
import { DIVISION_CODES } from "@/lib/ui/division-labels";
import {
  formatRecentElectionFilter,
  RECENT_ELECTION_OPTIONS,
  type RecentElectionFilter,
} from "../shared/recent-election-filter";
import {
  buildCandidateIndex,
  filterCandidateIndex,
  summarizeCandidateIndex,
  type CandidateDivisionFilter,
  type CandidateIndexPosition,
  type CandidateStatusFilter,
} from "./candidate-index";
import { CalendarClock, Layers, ListFilter } from "lucide-react";

const STATUS_OPTIONS: CandidateStatusFilter[] = ["ALL", "OPEN", "SCHEDULED", "DRAFT", "CLOSED"];
const RECENT_OPTIONS: RecentElectionFilter[] = ["ALL", ...RECENT_ELECTION_OPTIONS];

export function CandidatesIndexClient({ positions }: { positions: CandidateIndexPosition[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CandidateStatusFilter>("ALL");
  const [division, setDivision] = useState<CandidateDivisionFilter>("ALL");
  const [recentElectionCount, setRecentElectionCount] = useState<RecentElectionFilter>("ALL");
  const onSearch = useCallback((value: string) => setQuery(value), []);

  const index = useMemo(() => buildCandidateIndex(positions), [positions]);
  const filtered = useMemo(
    () => filterCandidateIndex(index, { query, status, division, recentElectionCount }),
    [division, index, query, recentElectionCount, status],
  );
  const totalSummary = useMemo(() => summarizeCandidateIndex(index), [index]);
  const visibleSummary = useMemo(() => summarizeCandidateIndex(filtered), [filtered]);
  const divisionOptions = useMemo(
    () => index.map((group) => ({ value: group.division, label: DIVISION_CODES[group.division] ?? group.label })),
    [index],
  );
  const divisionLabel = division === "ALL"
    ? "All divisions"
    : divisionOptions.find((option) => option.value === division)?.label ?? division;
  const statusLabel = status === "ALL" ? "All statuses" : status;
  const recentElectionLabel = formatRecentElectionFilter(recentElectionCount);
  const isFiltering = query.trim().length > 0 || status !== "ALL" || division !== "ALL" || recentElectionCount !== "ALL";

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
        <MetricCard
          label="Open Filters"
          value={activeFilterCount({ query, status, division, recentElectionCount }).toString()}
          sub="search, status, division, recent"
        />
      </div>

      <FilterPanel
        title="Filter candidates"
        meta={`${visibleSummary.positions} positions matched`}
      >
        <SearchInput onSearch={onSearch} placeholder="Search candidate, position, election" className="sm:max-w-none" />
        <FilterGrid>
          <FilterGroup
            icon={<Layers aria-hidden="true" className="h-4 w-4" />}
            label="Division"
            value={divisionLabel}
          >
            <FilterOption active={division === "ALL"} onClick={() => setDivision("ALL")}>All divisions</FilterOption>
            {divisionOptions.map((option) => (
              <FilterOption
                key={option.value}
                active={division === option.value}
                onClick={() => setDivision(option.value)}
              >
                {option.label}
              </FilterOption>
            ))}
          </FilterGroup>
          <FilterGroup
            icon={<ListFilter aria-hidden="true" className="h-4 w-4" />}
            label="Election status"
            value={statusLabel}
          >
            {STATUS_OPTIONS.map((option) => (
              <FilterOption key={option} active={status === option} onClick={() => setStatus(option)}>
                {option === "ALL" ? "All statuses" : option}
              </FilterOption>
            ))}
          </FilterGroup>
          <FilterGroup
            icon={<CalendarClock aria-hidden="true" className="h-4 w-4" />}
            label="Recent elections"
            value={recentElectionLabel}
            className="lg:col-span-2"
          >
            {RECENT_OPTIONS.map((option) => (
              <FilterOption
                key={option}
                active={recentElectionCount === option}
                onClick={() => setRecentElectionCount(option)}
              >
                {formatRecentElectionFilter(option)}
              </FilterOption>
            ))}
          </FilterGroup>
        </FilterGrid>
      </FilterPanel>

      {totalSummary.candidates === 0 ? (
        <EmptyState title="No candidates encoded yet" hint="Add candidates from an election's Candidates page." />
      ) : filtered.length === 0 ? (
        <EmptyState title="No candidates match" hint="Try a different search, status, or division filter." />
      ) : (
        <div className="space-y-4">
          {filtered.map((divisionGroup) => (
            <Disclosure
              key={divisionGroup.division}
              defaultOpen={isFiltering}
              className="overflow-hidden rounded-[12px] border border-white/[0.07] bg-admin-surface/70"
              contentClassName="grid gap-3 border-t border-white/6 p-3"
              trigger={({ open }) => (
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/45">
                    {highlightMatch(divisionGroup.label, query)}
                  </span>
                  <span className="h-px flex-1 bg-white/5" />
                  <span className="text-[10px] text-white/55">
                    {divisionGroup.totalCandidates} candidates · {divisionGroup.positionCount} positions
                  </span>
                  <span className="hidden rounded-full border border-white/8 bg-white/3 px-2 py-1 text-[10px] text-white/40 sm:inline">
                    {open ? "Click to collapse" : "Click to expand"}
                  </span>
                  <DisclosureChevron open={open} />
                </div>
              )}
            >
              {divisionGroup.elections.map((election) => (
                <Disclosure
                  key={election.id}
                  defaultOpen={isFiltering}
                  className="overflow-hidden rounded-[10px] border border-white/[0.07] bg-admin-surface"
                  trigger={({ open }) => (
                    <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <StatusDot status={election.status} />
                        <span className="truncate text-[12px] font-semibold text-white/80">
                          {highlightMatch(election.name, query)}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 text-[10px] text-white/50">
                        <span>{election.totalCandidates} cand. · {election.positionCount} pos.</span>
                        <span className="hidden rounded-full border border-white/8 bg-white/3 px-2 py-1 text-white/40 lg:inline">
                          {open ? "Click to collapse" : "Click to expand"}
                        </span>
                        <Link
                          href={`/admin/elections/${election.id}/candidates`}
                          onClick={(event) => event.stopPropagation()}
                          className="rounded-[5px] border border-gold/20 bg-gold/[0.07] px-[7px] py-[3px] text-gold no-underline transition-all hover:bg-gold/[0.14]"
                        >
                          Manage
                        </Link>
                        <DisclosureChevron open={open} />
                      </div>
                    </div>
                  )}
                >
                  <div className="divide-y divide-white/4">
                    {election.positions.map((position) => (
                      <PositionBlock key={position.id} position={position} query={query} />
                    ))}
                  </div>
                </Disclosure>
              ))}
            </Disclosure>
          ))}
        </div>
      )}
    </>
  );
}

function PositionBlock({ position, query }: { position: CandidateIndexPosition; query?: string }) {
  const fullGrades = gradesForDivision(position.election.division as Parameters<typeof gradesForDivision>[0]);
  const votingGrades = formatGradeList(position.eligibleGrades, fullGrades);
  const candidateGrades = formatGradeList(parseGrades(position.candidateGrade), fullGrades);

  return (
    <section className="px-4 py-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/65">
          {highlightMatch(position.title, query)}
        </h3>
        <p className="text-[10px] text-white/45">Votes: {votingGrades} · Runs: {candidateGrades}</p>
      </div>
      {position.candidates.length === 0 ? (
        <p className="mt-2 text-[11px] italic text-white/45">No candidates encoded</p>
      ) : (
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {position.candidates.map((candidate, index) => (
            <div key={candidate.id} className="flex min-w-0 items-center gap-3 rounded-[7px] bg-white/2.5 px-3 py-2">
              <span className="w-5 shrink-0 text-right font-mono text-[10px] text-white/45">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-white/80">
                {highlightMatch(candidate.fullName, query)}
              </span>
              <span className="shrink-0 font-mono text-[10px] text-white/40">
                {highlightMatch(`Gr. ${candidate.gradeLevel}`, query)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
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
  recentElectionCount: RecentElectionFilter;
}) {
  return [
    filters.query.trim().length > 0,
    filters.status !== "ALL",
    filters.division !== "ALL",
    filters.recentElectionCount !== "ALL",
  ].filter(Boolean).length;
}
