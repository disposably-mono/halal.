"use client";

import { useMemo, useState } from "react";
import { DataTable, EmptyState, SearchInput } from "@/components/admin/ui";
import { removeVoterById } from "./actions";

type VoterRow = {
  id: string;
  voterCode: string;
  studentId: string;
  gradeLevel: number;
  section: string;
  hasVoted: boolean;
};

export function VotersTableClient({
  voters,
  electionId,
  canRemove,
}: {
  voters: VoterRow[];
  electionId: string;
  canRemove: boolean;
}) {
  const [query, setQuery] = useState("");
  const filteredVoters = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return voters;
    return voters.filter((voter) =>
      [voter.voterCode, voter.studentId, voter.section, String(voter.gradeLevel)]
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [query, voters]);

  return (
    <div className="overflow-hidden rounded-xl border border-white/8 bg-admin-surface">
      <div className="flex flex-col gap-[13px] border-b border-white/[0.07] px-[18px] py-[13px] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">Registered Voters</p>
          <p className="mt-[4px] text-[11px] text-white/35">{filteredVoters.length} of {voters.length} shown</p>
        </div>
        <SearchInput onSearch={setQuery} placeholder="Search voters" />
      </div>
      <DataTable
        rows={filteredVoters}
        getRowKey={(voter) => voter.id}
        mobile="stack"
        empty={<EmptyState title="No voters match" hint="Try a different voter code, student ID, grade, or section." />}
        columns={[
          {
            key: "voterCode",
            header: "Voter Code",
            priority: 1,
            render: (voter) => <span className="font-mono text-[11px] text-gold/80">{voter.voterCode}</span>,
          },
          {
            key: "studentId",
            header: "Student ID",
            priority: 1,
            render: (voter) => <span className="font-mono text-white/70">{voter.studentId}</span>,
          },
          { key: "grade", header: "Grade", render: (voter) => `Gr. ${voter.gradeLevel}` },
          { key: "section", header: "Section", render: (voter) => voter.section },
          {
            key: "voted",
            header: "Voted",
            render: (voter) => voter.hasVoted
              ? <span className="text-[11px] font-semibold text-emerald-400">Voted</span>
              : <span className="text-[11px] text-white/60">No</span>,
          },
        ]}
        actions={canRemove ? (voter) => (
          <form action={removeVoterById.bind(null, voter.id, electionId)}>
            <button
              type="submit"
              className="flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-[7px] text-white/25 transition-colors hover:text-red-400 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gold/40"
              title="Remove voter"
              aria-label={`Remove voter ${voter.studentId}`}
            >
              ×
            </button>
          </form>
        ) : undefined}
      />
    </div>
  );
}
