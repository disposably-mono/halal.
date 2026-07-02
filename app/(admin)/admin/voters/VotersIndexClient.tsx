"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  EmptyState,
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

      <div className="rounded-[12px] border border-white/[0.07] bg-admin-surface px-4 py-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/50">Voter Index</p>
            <p className="mt-1 text-[10px] text-white/35">{visibleSummary.elections} election groups matched</p>
          </div>
          <SearchInput onSearch={onSearch} placeholder="Search control no., student ID, section" className="sm:max-w-none xl:w-[420px]" />
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
        <div className="mt-2 flex flex-wrap gap-1.5">
          {VOTE_OPTIONS.map((option) => (
            <FilterChip key={option} active={voteStatus === option} onClick={() => setVoteStatus(option)}>
              {option === "ALL" ? "All voters" : option}
            </FilterChip>
          ))}
        </div>
      </div>

      {totalSummary.voters === 0 ? (
        <EmptyState title="No voters registered yet" hint="Upload voters from an election's Voters page." />
      ) : filtered.length === 0 ? (
        <EmptyState title="No voters match" hint="Try a different search, status, division, or voting filter." />
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
                  {divisionGroup.voterCount} voters · {divisionGroup.votedCount} voted
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
                        <span>{election.voterCount} voters · {turnout(election.votedCount, election.voterCount)}%</span>
                        <Link href={`/admin/elections/${election.id}/voters`} className="rounded-[5px] border border-gold/20 bg-gold/[0.07] px-[7px] py-[3px] text-gold no-underline transition-all hover:bg-gold/[0.14]">
                          Manage
                        </Link>
                      </div>
                    </summary>
                    <VoterRows voters={election.voters} />
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

function VoterRows({ voters }: { voters: VoterIndexRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.04]">
            {["#", "Control No.", "Student ID", "Grade", "Section", "Status"].map((heading) => (
              <th key={heading} className="px-4 py-[7px] text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-white/35">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {voters.map((voter, index) => (
            <tr key={voter.id} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02]">
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

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
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
