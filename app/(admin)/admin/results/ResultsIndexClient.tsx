"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { BarChart3, CalendarClock, FileText, Layers, ListFilter } from "lucide-react";
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
import { DIVISION_CODES } from "@/lib/ui/division-labels";
import {
  formatRecentElectionFilter,
  RECENT_ELECTION_OPTIONS,
  type RecentElectionFilter,
} from "../shared/recent-election-filter";
import { getResultStatusMeta, getTurnoutPercent } from "./admin-results-summary";
import {
  buildResultsIndex,
  filterResultsIndex,
  summarizeResultsIndex,
  type ResultsDivisionFilter,
  type ResultsIndexElection,
  type ResultsIndexPosition,
  type ResultsStatusFilter,
} from "./results-index";

const STATUS_OPTIONS: ResultsStatusFilter[] = ["ALL", "OPEN", "CLOSED"];
const RECENT_OPTIONS: RecentElectionFilter[] = ["ALL", ...RECENT_ELECTION_OPTIONS];

export function ResultsIndexClient({ elections }: { elections: ResultsIndexElection[] }) {
  const [query, setQuery] = useState("");
  const [division, setDivision] = useState<ResultsDivisionFilter>("ALL");
  const [status, setStatus] = useState<ResultsStatusFilter>("ALL");
  const [recentElectionCount, setRecentElectionCount] = useState<RecentElectionFilter>("ALL");
  const onSearch = useCallback((value: string) => setQuery(value), []);

  const index = useMemo(() => buildResultsIndex(elections), [elections]);
  const filtered = useMemo(
    () => filterResultsIndex(index, { query, division, status, recentElectionCount }),
    [division, index, query, recentElectionCount, status],
  );
  const totalSummary = useMemo(() => summarizeResultsIndex(index), [index]);
  const visibleSummary = useMemo(() => summarizeResultsIndex(filtered), [filtered]);
  const divisionOptions = useMemo(
    () => index.map((group) => ({ value: group.division, label: DIVISION_CODES[group.division] ?? group.label })),
    [index],
  );
  const divisionLabel = division === "ALL"
    ? "All divisions"
    : divisionOptions.find((option) => option.value === division)?.label ?? division;
  const statusLabel = status === "ALL" ? "All statuses" : status;
  const recentElectionLabel = formatRecentElectionFilter(recentElectionCount);
  const isFiltering = query.trim().length > 0 || division !== "ALL" || status !== "ALL" || recentElectionCount !== "ALL";

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="Results"
        meta={`${visibleSummary.elections} of ${totalSummary.elections} elections visible · ${visibleSummary.positions} positions`}
      />

      <div className="grid grid-cols-1 gap-[11px] sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Elections" value={totalSummary.elections.toLocaleString()} sub={`${totalSummary.divisions} divisions`} accent="gold" />
        <MetricCard label="Positions" value={totalSummary.positions.toLocaleString()} sub="across all elections" />
        <MetricCard label="Visible" value={visibleSummary.elections.toLocaleString()} sub={`${visibleSummary.positions} positions shown`} accent="blue" />
      </div>

      <FilterPanel title="Filter results" meta={`${visibleSummary.elections} elections matched`}>
        <SearchInput onSearch={onSearch} placeholder="Search election, position, or candidate" className="sm:max-w-none" />
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
            label="Status"
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

      {totalSummary.elections === 0 ? (
        <EmptyState
          icon={<BarChart3 aria-hidden="true" className="h-[20px] w-[20px]" />}
          title="No results yet"
          hint="Results appear once an election is open or closed."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BarChart3 aria-hidden="true" className="h-[20px] w-[20px]" />}
          title="No results match"
          hint="Try a different search, division, or status filter."
        />
      ) : (
        <div className="space-y-[18px]">
          {filtered.map((divisionGroup) => (
            <Disclosure
              key={divisionGroup.division}
              defaultOpen={isFiltering}
              className="overflow-hidden rounded-[13px] border border-white/[0.07] bg-admin-surface/70"
              contentClassName="grid gap-[13px] border-t border-white/6 p-[13px]"
              trigger={({ open }) => (
                <div className="flex items-center gap-[13px] px-[18px] py-[13px]">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
                    {highlightMatch(divisionGroup.label, query)}
                  </span>
                  <span className="h-px flex-1 bg-white/5" />
                  <span className="text-[11px] text-white/55">{divisionGroup.elections.length} elections</span>
                  <span className="hidden rounded-full border border-white/8 bg-white/3 px-[9px] py-[4px] text-[11px] text-white/40 sm:inline">
                    {open ? "Click to collapse" : "Click to expand"}
                  </span>
                  <DisclosureChevron open={open} />
                </div>
              )}
            >
              {divisionGroup.elections.map((election) => (
                <ResultsElectionDisclosure
                  key={election.id}
                  election={election}
                  query={query}
                  isFiltering={isFiltering}
                />
              ))}
            </Disclosure>
          ))}
        </div>
      )}
    </>
  );
}

function ResultsElectionDisclosure({
  election,
  query,
  isFiltering,
}: {
  election: ResultsIndexElection;
  query: string;
  isFiltering: boolean;
}) {
  const pct = getTurnoutPercent({ voted: election.votedCount, voters: election.voterCount });
  const statusMeta = getResultStatusMeta(election.status);

  return (
    <Disclosure
      defaultOpen={isFiltering}
      className="overflow-hidden rounded-[11px] border border-white/[0.07] bg-admin-surface"
      trigger={({ open }) => (
        <div className="flex items-center justify-between gap-[13px] border-b border-white/[0.07] px-[18px] py-[13px]">
          <div className="flex min-w-[0px] items-center gap-[13px]">
            <span className={`inline-flex shrink-0 items-center gap-[4px] rounded-full px-[8px] py-[2px] text-[11px] font-semibold ${statusMeta.badgeClassName}`}>
              <span className={`h-[4px] w-[4px] rounded-full ${statusMeta.dotClassName}`} />
              {statusMeta.label}
            </span>
            <span className="truncate text-[13px] font-semibold text-white/80">
              {highlightMatch(election.name, query)}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-[13px] text-[11px] text-white/50">
            <span>{pct}% · {election.votedCount}/{election.voterCount}</span>
            <span className="hidden rounded-full border border-white/8 bg-white/3 px-[9px] py-[4px] text-white/40 lg:inline">
              {open ? "Click to collapse" : "Click to expand"}
            </span>
            <Link
              href={`/admin/elections/${election.id}/monitor`}
              onClick={(event) => event.stopPropagation()}
              className="inline-flex items-center gap-[4px] rounded-[6px] border border-gold/20 bg-gold/[0.07] px-[8px] py-[3px] text-gold no-underline transition-all hover:bg-gold/[0.14]"
            >
              <FileText aria-hidden="true" className="h-[13px] w-[13px]" />
              Full tally
            </Link>
            <DisclosureChevron open={open} />
          </div>
        </div>
      )}
    >
      <div className="p-[18px]">
        {election.integrityFailure ? (
          <div className="rounded-[9px] border border-red-400/25 bg-red-400/5 px-[18px] py-[13px] text-[12px] text-red-300">
            Certified results failed cryptographic verification. Results are withheld pending a recount and audit.
          </div>
        ) : election.positions.length === 0 ? (
          <div className="text-[12px] italic text-white/60">No positions configured</div>
        ) : (
          <div className="grid gap-[7px]" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
            {election.positions.map((position) => (
              <ResultsPositionCard key={position.id} position={position} query={query} />
            ))}
          </div>
        )}
      </div>
    </Disclosure>
  );
}

function ResultsPositionCard({ position, query }: { position: ResultsIndexPosition; query: string }) {
  const hasResult = position.winner || position.draw;

  return (
    <div
      className={`flex items-center gap-[13px] rounded-[9px] border px-[13px] py-[9px] ${
        hasResult ? "border-white/6 bg-white/2.5" : "border-white/4 bg-transparent"
      }`}
    >
      <div
        className={`flex h-[31px] w-[31px] shrink-0 items-center justify-center rounded-[7px] text-[12px] ${
          position.winner
            ? "bg-gold/10 text-gold"
            : position.draw
              ? "bg-sky-400/10 text-sky-400"
              : "bg-white/4 text-white/60"
        }`}
      >
        {position.winner ? "*" : position.draw ? "=" : "-"}
      </div>

      <div className="min-w-[0px] flex-1">
        <div className="truncate text-[11px] text-white/40">{highlightMatch(position.title, query)}</div>
        {position.winner ? (
          <div className="mt-px truncate text-[13px] font-semibold text-white/85">
            {highlightMatch(position.winner.fullName, query)}
          </div>
        ) : position.draw ? (
          <div className="mt-px text-[12px] font-medium text-sky-400">
            TIE - {position.draw.map((candidate) => candidate.fullName).join(" / ")}
          </div>
        ) : (
          <div className="mt-px text-[12px] italic text-white/60">
            {position.totalVotes === 0 ? "No votes cast yet" : "No candidates"}
          </div>
        )}
      </div>

      {(position.winner || position.draw) && position.winnerVotes > 0 && (
        <div className="shrink-0 font-mono text-[11px] text-white/40">{position.winnerVotes}v</div>
      )}
    </div>
  );
}
