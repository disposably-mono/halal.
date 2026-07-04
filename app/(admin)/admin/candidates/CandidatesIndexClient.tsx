"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  AccordionCard,
  ElectionAccordionRow,
  ElectionStatusDot,
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
import { activeFilterCount, hasActiveFilters } from "../shared/filter-state";
import { buildDivisionFilterOptions, resolveDivisionFilterLabel } from "../shared/division-filter";
import {
  ALL_RECENT_ELECTION_FILTER_OPTIONS as RECENT_OPTIONS,
  formatRecentElectionFilter,
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
  const divisionOptions = useMemo(() => buildDivisionFilterOptions(index), [index]);
  const divisionLabel = resolveDivisionFilterLabel(division, divisionOptions);
  const statusLabel = status === "ALL" ? "All statuses" : status;
  const recentElectionLabel = formatRecentElectionFilter(recentElectionCount);
  const filterFlags = [
    query.trim().length > 0,
    status !== "ALL",
    division !== "ALL",
    recentElectionCount !== "ALL",
  ];
  const isFiltering = hasActiveFilters(filterFlags);

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="Candidates"
        meta={`${visibleSummary.candidates.toLocaleString()} of ${totalSummary.candidates.toLocaleString()} candidates visible`}
      />

      <div className="grid grid-cols-1 gap-[11px] sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Candidates" value={totalSummary.candidates.toLocaleString()} sub={`${totalSummary.positions} positions`} accent="gold" />
        <MetricCard label="Elections" value={totalSummary.elections.toLocaleString()} sub={`${totalSummary.divisions} divisions`} />
        <MetricCard label="Visible" value={visibleSummary.candidates.toLocaleString()} sub={`${visibleSummary.elections} elections shown`} accent="blue" />
        <MetricCard
          label="Open Filters"
          value={activeFilterCount(filterFlags).toString()}
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
            icon={<Layers aria-hidden="true" className="h-[18px] w-[18px]" />}
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
            icon={<ListFilter aria-hidden="true" className="h-[18px] w-[18px]" />}
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
            icon={<CalendarClock aria-hidden="true" className="h-[18px] w-[18px]" />}
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
        <div className="space-y-[18px]">
          {filtered.map((divisionGroup) => (
            <AccordionCard
              key={divisionGroup.division}
              title={highlightMatch(divisionGroup.label, query)}
              meta={<span>{divisionGroup.totalCandidates} candidates · {divisionGroup.positionCount} positions</span>}
              defaultOpen={isFiltering}
              contentClassName="grid gap-[13px] border-t border-white/6 p-[13px]"
            >
              {divisionGroup.elections.map((election) => (
                <ElectionAccordionRow
                  key={election.id}
                  defaultOpen={isFiltering}
                  statusNode={<ElectionStatusDot status={election.status} />}
                  title={highlightMatch(election.name, query)}
                  meta={
                    <>{election.totalCandidates} cand. · {election.positionCount} pos.</>
                  }
                  actionNode={
                    <Link
                      href={`/admin/elections/${election.id}/candidates`}
                      onClick={(event) => event.stopPropagation()}
                      className="rounded-[6px] border border-gold/20 bg-gold/[0.07] px-[8px] py-[3px] text-gold no-underline transition-all hover:bg-gold/[0.14]"
                    >
                      Manage
                    </Link>
                  }
                >
                  <div className="divide-y divide-white/4">
                    {election.positions.map((position) => (
                      <PositionBlock key={position.id} position={position} query={query} />
                    ))}
                  </div>
                </ElectionAccordionRow>
              ))}
            </AccordionCard>
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
    <section className="px-[18px] py-[13px]">
      <div className="flex flex-col gap-[4px] sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-[12px] font-semibold uppercase tracking-wider text-white/65">
          {highlightMatch(position.title, query)}
        </h3>
        <p className="text-[11px] text-white/45">Votes: {votingGrades} · Runs: {candidateGrades}</p>
      </div>
      {position.candidates.length === 0 ? (
        <p className="mt-[9px] text-[12px] italic text-white/45">No candidates encoded</p>
      ) : (
        <div className="mt-[9px] grid gap-[7px] sm:grid-cols-2 xl:grid-cols-3">
          {position.candidates.map((candidate, index) => (
            <div key={candidate.id} className="flex min-w-[0px] items-center gap-[13px] rounded-[8px] bg-white/2.5 px-[13px] py-[9px]">
              <span className="w-[22px] shrink-0 text-right font-mono text-[11px] text-white/45">{index + 1}</span>
              <span className="min-w-[0px] flex-1 truncate text-[13px] font-medium text-white/80">
                {highlightMatch(candidate.fullName, query)}
              </span>
              <span className="shrink-0 font-mono text-[11px] text-white/40">
                {highlightMatch(`Gr. ${candidate.gradeLevel}`, query)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

