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
  MetricCard,
  PageHeader,
  SearchInput,
} from "@/components/admin/ui";
import { DIVISION_CODES } from "@/lib/ui/division-labels";
import {
  buildVoterIndex,
  filterVoterIndex,
  summarizeVoterIndex,
  type VoteStatusFilter,
  type VoterDivisionFilter,
  type VoterIndexRow,
  type VoterIndexStatus,
  type VoterStatusFilter,
} from "./voter-index";
import { Layers, ListFilter, Vote } from "lucide-react";

const STATUS_OPTIONS: VoterStatusFilter[] = ["ALL", "OPEN", "SCHEDULED", "DRAFT", "CLOSED"];
const VOTE_OPTIONS: VoteStatusFilter[] = ["ALL", "VOTED", "PENDING"];

export function VotersIndexClient({ voters }: { voters: VoterIndexRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<VoterStatusFilter>("ALL");
  const [division, setDivision] = useState<VoterDivisionFilter>("ALL");
  const [voteStatus, setVoteStatus] = useState<VoteStatusFilter>("ALL");
  const onSearch = useCallback((value: string) => setQuery(value), []);

  const index = useMemo(() => buildVoterIndex(voters), [voters]);
  const filtered = useMemo(
    () => filterVoterIndex(index, { query, status, division, voteStatus }),
    [division, index, query, status, voteStatus],
  );
  const totalSummary = useMemo(() => summarizeVoterIndex(index), [index]);
  const visibleSummary = useMemo(() => summarizeVoterIndex(filtered), [filtered]);
  const divisionOptions = useMemo(
    () => index.map((group) => ({ value: group.division, label: DIVISION_CODES[group.division] ?? group.label })),
    [index],
  );
  const divisionLabel = division === "ALL"
    ? "All divisions"
    : divisionOptions.find((option) => option.value === division)?.label ?? division;
  const statusLabel = status === "ALL" ? "All statuses" : status;
  const voteStatusLabel = voteStatus === "ALL" ? "All voters" : voteStatus;

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="Voters"
        meta={`${visibleSummary.voters.toLocaleString()} of ${totalSummary.voters.toLocaleString()} control numbers visible`}
      />

      <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Control Numbers" value={totalSummary.voters.toLocaleString()} sub={`${totalSummary.elections} elections`} accent="gold" />
        <MetricCard label="Voted" value={totalSummary.voted.toLocaleString()} sub={`${turnout(totalSummary.voted, totalSummary.voters)}% turnout`} accent="emerald" />
        <MetricCard label="Pending" value={totalSummary.pending.toLocaleString()} sub="not yet voted" />
        <MetricCard label="Visible" value={visibleSummary.voters.toLocaleString()} sub={`${visibleSummary.pending} pending shown`} accent="blue" />
      </div>

      <FilterPanel
        title="Filter voters"
        meta={`${visibleSummary.elections} election groups matched`}
      >
        <SearchInput onSearch={onSearch} placeholder="Search control no., student ID, section" className="sm:max-w-none" />
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
            icon={<Vote aria-hidden="true" className="h-4 w-4" />}
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
        <div className="space-y-4">
          {filtered.map((divisionGroup) => (
            <Disclosure
              key={divisionGroup.division}
              className="overflow-hidden rounded-[12px] border border-white/[0.07] bg-admin-surface/70"
              contentClassName="grid gap-3 border-t border-white/6 p-3"
              trigger={({ open }) => (
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/45">
                    {divisionGroup.label}
                  </span>
                  <span className="h-px flex-1 bg-white/5" />
                  <span className="text-[10px] text-white/55">
                    {divisionGroup.voterCount} voters · {divisionGroup.votedCount} voted
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
                  className="overflow-hidden rounded-[10px] border border-white/[0.07] bg-admin-surface"
                  trigger={({ open }) => (
                    <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <StatusDot status={election.status} />
                        <span className="truncate text-[12px] font-semibold text-white/80">{election.name}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 text-[10px] text-white/50">
                        <span>{election.voterCount} voters · {turnout(election.votedCount, election.voterCount)}%</span>
                        <span className="hidden rounded-full border border-white/8 bg-white/3 px-2 py-1 text-white/40 lg:inline">
                          {open ? "Click to collapse" : "Click to expand"}
                        </span>
                        <Link
                          href={`/admin/elections/${election.id}/voters`}
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
                  <VoterRows voters={election.voters} />
                </Disclosure>
              ))}
            </Disclosure>
          ))}
        </div>
      )}
    </>
  );
}

function VoterRows({ voters }: { voters: VoterIndexRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/4">
            {["#", "Control No.", "Student ID", "Grade", "Section", "Status"].map((heading) => (
              <th key={heading} className="px-4 py-[7px] text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-white/35">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {voters.map((voter, index) => (
            <tr key={voter.id} className="border-b border-white/3 last:border-0 hover:bg-white/2">
              <td className="px-4 py-[8px] font-mono text-[10px] text-white/35">{index + 1}</td>
              <td className="px-4 py-[8px] font-mono text-[11px] font-medium text-white/70">{voter.voterCode}</td>
              <td className="px-4 py-[8px] font-mono text-[11px] text-white/55">{voter.studentId}</td>
              <td className="px-4 py-[8px] text-[11px] text-white/55">Grade {voter.gradeLevel}</td>
              <td className="px-4 py-[8px] text-[11px] text-white/55">Section {voter.section}</td>
              <td className="px-4 py-[8px]"><VoteBadge hasVoted={voter.hasVoted} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VoteBadge({ hasVoted }: { hasVoted: boolean }) {
  return hasVoted ? (
    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
      <span className="h-[5px] w-[5px] rounded-full bg-emerald-400" />
      Voted
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] text-white/60">
      <span className="h-[5px] w-[5px] rounded-full bg-white/15" />
      Pending
    </span>
  );
}

function StatusDot({ status }: { status: VoterIndexStatus }) {
  const colors: Record<VoterIndexStatus, string> = {
    OPEN: "bg-emerald-400",
    SCHEDULED: "bg-blue-400",
    DRAFT: "bg-white/20",
    CLOSED: "bg-white/10",
  };
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-white/50">
      <span className={`h-[6px] w-[6px] rounded-full ${colors[status]}`} />
      {status}
    </span>
  );
}

function turnout(voted: number, total: number) {
  if (total === 0) return 0;
  return Math.round((voted / total) * 100);
}
