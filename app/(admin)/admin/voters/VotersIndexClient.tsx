"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
import { hasActiveFilters } from "../shared/filter-state";
import { buildDivisionFilterOptions, resolveDivisionFilterLabel } from "../shared/division-filter";
import {
  ALL_RECENT_ELECTION_FILTER_OPTIONS as RECENT_OPTIONS,
  formatRecentElectionFilter,
  type RecentElectionFilter,
} from "../shared/recent-election-filter";
import {
  buildVoterIndex,
  filterVoterIndex,
  summarizeVoterIndex,
  type VoteStatusFilter,
  type VoterDivisionFilter,
  type VoterIndexRow,
  type VoterStatusFilter,
} from "./voter-index";
import { CalendarClock, Layers, ListFilter, Vote } from "lucide-react";

const STATUS_OPTIONS: VoterStatusFilter[] = ["ALL", "OPEN", "SCHEDULED", "DRAFT", "CLOSED"];
const VOTE_OPTIONS: VoteStatusFilter[] = ["ALL", "VOTED", "PENDING"];

export function VotersIndexClient({ voters }: { voters: VoterIndexRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<VoterStatusFilter>("ALL");
  const [division, setDivision] = useState<VoterDivisionFilter>("ALL");
  const [voteStatus, setVoteStatus] = useState<VoteStatusFilter>("ALL");
  const [recentElectionCount, setRecentElectionCount] = useState<RecentElectionFilter>("ALL");

  const index = useMemo(() => buildVoterIndex(voters), [voters]);
  const filtered = useMemo(
    () => filterVoterIndex(index, { query, status, division, voteStatus, recentElectionCount }),
    [division, index, query, recentElectionCount, status, voteStatus],
  );
  const totalSummary = useMemo(() => summarizeVoterIndex(index), [index]);
  const visibleSummary = useMemo(() => summarizeVoterIndex(filtered), [filtered]);
  const divisionOptions = useMemo(() => buildDivisionFilterOptions(index), [index]);
  const divisionLabel = resolveDivisionFilterLabel(division, divisionOptions);
  const statusLabel = status === "ALL" ? "All statuses" : status;
  const voteStatusLabel = voteStatus === "ALL" ? "All voters" : voteStatus;
  const recentElectionLabel = formatRecentElectionFilter(recentElectionCount);
  const isFiltering = hasActiveFilters([
    query.trim().length > 0,
    status !== "ALL",
    division !== "ALL",
    voteStatus !== "ALL",
    recentElectionCount !== "ALL",
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="Voters"
        meta={`${visibleSummary.voters.toLocaleString()} of ${totalSummary.voters.toLocaleString()} control numbers visible`}
      />

      <div className="grid grid-cols-1 gap-[11px] sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Control Numbers" value={totalSummary.voters.toLocaleString()} sub={`${totalSummary.elections} elections`} accent="gold" />
        <MetricCard label="Voted" value={totalSummary.voted.toLocaleString()} sub={`${turnout(totalSummary.voted, totalSummary.voters)}% turnout`} accent="emerald" />
        <MetricCard label="Pending" value={totalSummary.pending.toLocaleString()} sub="not yet voted" />
        <MetricCard label="Visible" value={visibleSummary.voters.toLocaleString()} sub={`${visibleSummary.pending} pending shown`} accent="blue" />
      </div>

      <FilterPanel
        title="Filter voters"
        meta={`${visibleSummary.elections} election groups matched`}
      >
        <SearchInput onSearch={setQuery} placeholder="Search control no., student ID, section" className="sm:max-w-none" />
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
          <FilterGroup
            icon={<Vote aria-hidden="true" className="h-[18px] w-[18px]" />}
            label="Vote state"
            value={voteStatusLabel}
          >
            {VOTE_OPTIONS.map((option) => (
              <FilterOption key={option} active={voteStatus === option} onClick={() => setVoteStatus(option)}>
                {option === "ALL" ? "All voters" : option}
              </FilterOption>
            ))}
          </FilterGroup>
        </FilterGrid>
      </FilterPanel>

      {totalSummary.voters === 0 ? (
        <EmptyState title="No voters registered yet" hint="Upload voters from an election's Voters page." />
      ) : filtered.length === 0 ? (
        <EmptyState title="No voters match" hint="Try a different search, status, division, or voting filter." />
      ) : (
        <div className="space-y-[18px]">
          {filtered.map((divisionGroup) => (
            <AccordionCard
              key={divisionGroup.division}
              title={highlightMatch(divisionGroup.label, query)}
              meta={<span>{divisionGroup.voterCount} voters · {divisionGroup.votedCount} voted</span>}
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
                    <>{election.voterCount} voters · {turnout(election.votedCount, election.voterCount)}%</>
                  }
                  actionNode={
                    <Link
                      href={`/admin/elections/${election.id}/voters`}
                      onClick={(event) => event.stopPropagation()}
                      className="rounded-[6px] border border-gold/20 bg-gold/[0.07] px-[8px] py-[3px] text-gold no-underline transition-all hover:bg-gold/[0.14]"
                    >
                      Manage
                    </Link>
                  }
                >
                  <VoterRows voters={election.voters} query={query} />
                </ElectionAccordionRow>
              ))}
            </AccordionCard>
          ))}
        </div>
      )}
    </>
  );
}

function VoterRows({ voters, query }: { voters: VoterIndexRow[]; query?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/4">
            {["#", "Control No.", "Student ID", "Grade", "Section", "Status"].map((heading) => (
              <th key={heading} className="px-[18px] py-[8px] text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-white/35">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {voters.map((voter, index) => (
            <tr key={voter.id} className="border-b border-white/3 last:border-0 hover:bg-white/2">
              <td className="px-[18px] py-[9px] font-mono text-[11px] text-white/35">{index + 1}</td>
              <td className="px-[18px] py-[9px] font-mono text-[12px] font-medium text-white/70">{highlightMatch(voter.voterCode, query)}</td>
              <td className="px-[18px] py-[9px] font-mono text-[12px] text-white/55">{highlightMatch(voter.studentId, query)}</td>
              <td className="px-[18px] py-[9px] text-[12px] text-white/55">{highlightMatch(`Grade ${voter.gradeLevel}`, query)}</td>
              <td className="px-[18px] py-[9px] text-[12px] text-white/55">{highlightMatch(`Section ${voter.section}`, query)}</td>
              <td className="px-[18px] py-[9px]"><VoteBadge hasVoted={voter.hasVoted} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VoteBadge({ hasVoted }: { hasVoted: boolean }) {
  return hasVoted ? (
    <span className="inline-flex items-center gap-[4px] text-[11px] text-emerald-400">
      <span className="h-[6px] w-[6px] rounded-full bg-emerald-400" />
      Voted
    </span>
  ) : (
    <span className="inline-flex items-center gap-[4px] text-[11px] text-white/60">
      <span className="h-[6px] w-[6px] rounded-full bg-white/15" />
      Pending
    </span>
  );
}

function turnout(voted: number, total: number) {
  if (total === 0) return 0;
  return Math.round((voted / total) * 100);
}
