import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { ElectionStatus } from "@prisma/client";
import { DIVISION_LABELS, DIVISION_ORDER } from "@/lib/ui/division-labels";
import { requireCapability } from "@/lib/server/auth";

export default async function AdminVotersPage() {
  // Control numbers are live voting credentials — restrict to roster managers
  // (Commissioner). Other roles are bounced to the dashboard with an explanation.
  await requireCapability("voters:manage");

  // All voters with their election info
  const allVoters = await prisma.voter.findMany({
    orderBy: [{ gradeLevel: "asc" }, { section: "asc" }, { voterCode: "asc" }],
    select: {
      id: true,
      studentId: true,
      voterCode: true,
      gradeLevel: true,
      section: true,
      hasVoted: true,
      division: true,
      election: {
        select: { id: true, name: true, division: true, status: true },
      },
    },
  });

  const totalVoters = allVoters.length;
  const totalVoted = allVoters.filter((v) => v.hasVoted).length;

  // Group by division
  type VoterRow = typeof allVoters[number];
  const byDivision = new Map<string, VoterRow[]>();
  for (const v of allVoters) {
    const div = v.division;
    if (!byDivision.has(div)) byDivision.set(div, []);
    byDivision.get(div)!.push(v);
  }

  const presentDivisions = DIVISION_ORDER.filter((d) => byDivision.has(d));

  return (
    <div className="p-6 flex flex-col gap-[18px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-white/90">All Voters</h1>
          <p className="text-[12px] text-white/50 mt-[3px]">
            {totalVoters.toLocaleString()} unique control numbers across all elections
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="bg-emerald-400/[0.08] border border-emerald-400/20 text-emerald-400 rounded-[6px] px-[9px] py-[4px] font-medium">
            {totalVoted.toLocaleString()} voted
          </span>
          <span className="bg-white/[0.04] border border-white/[0.07] text-white/50 rounded-[6px] px-[9px] py-[4px]">
            {(totalVoters - totalVoted).toLocaleString()} pending
          </span>
        </div>
      </div>

      {/* Division quick-jump */}
      {presentDivisions.length > 1 && (
        <div className="flex gap-1">
          {presentDivisions.map((d) => (
            <a key={d} href={`#div-voters-${d}`}
              className="text-[10px] text-white/50 border border-white/[0.07] rounded-[5px] px-[8px] py-[3px] hover:text-white/70 hover:border-white/[0.12] transition-all no-underline">
              {DIVISION_LABELS[d]} ({byDivision.get(d)!.length})
            </a>
          ))}
        </div>
      )}

      {totalVoters === 0 && (
        <div className="bg-[#1a2540] border border-white/[0.07] rounded-[12px] flex flex-col items-center gap-3 py-16 text-center">
          <div className="text-[13px] font-medium text-white/60">No voters registered yet</div>
          <div className="text-[11px] text-white/40">Upload voters via the election management page.</div>
        </div>
      )}

      {presentDivisions.map((div) => {
        const voters = byDivision.get(div)!;
        const divVoted = voters.filter((v) => v.hasVoted).length;
        const divPct = voters.length > 0 ? Math.round((divVoted / voters.length) * 100) : 0;

        // Sub-group by election within division
        const byElection = new Map<string, { name: string; status: ElectionStatus; voters: typeof voters }>();
        for (const v of voters) {
          const eid = v.election.id;
          if (!byElection.has(eid)) byElection.set(eid, { name: v.election.name, status: v.election.status, voters: [] });
          byElection.get(eid)!.voters.push(v);
        }

        return (
          <div key={div} id={`div-voters-${div}`} className="flex flex-col gap-2">
            {/* Division heading */}
            <div className="flex items-center gap-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40">
                {DIVISION_LABELS[div]}
              </div>
              <div className="flex-1 h-px bg-white/[0.05]" />
              <div className="text-[10px] text-white/35">
                {voters.length} voters · {divVoted} voted ({divPct}%)
              </div>
            </div>

            {/* One card per election in this division */}
            {Array.from(byElection.entries()).map(([eid, el]) => {
              const elVoted = el.voters.filter((v: typeof voters[0]) => v.hasVoted).length;
              const elPct = el.voters.length > 0 ? Math.round((elVoted / el.voters.length) * 100) : 0;

              return (
                <div key={eid} className="bg-[#1a2540] border border-white/[0.07] rounded-[12px] overflow-hidden">
                  {/* Election header */}
                  <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <StatusDot status={el.status} />
                      <div className="text-[12px] font-semibold text-white/80 truncate">{el.name}</div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 text-[10px] text-white/50">
                      <span>{el.voters.length} voters · {elVoted} voted ({elPct}%)</span>
                      <Link href={`/admin/elections/${eid}/voters`}
                        className="text-amber-400 border border-amber-400/20 bg-amber-400/[0.07] rounded-[5px] px-[7px] py-[3px] hover:bg-amber-400/[0.14] transition-all no-underline">
                        Manage →
                      </Link>
                    </div>
                  </div>

                  {/* Voter table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/[0.04]">
                          {["Control No.", "Student ID", "Grade", "Section", "Status"].map((h) => (
                            <th key={h} className="text-left px-4 py-[6px] text-[10px] font-semibold uppercase tracking-[0.06em] text-white/35">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {el.voters.map((v: typeof voters[0]) => (
                          <tr key={v.id} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-[7px] font-mono text-[11px] text-white/70 font-medium">{v.voterCode}</td>
                            <td className="px-4 py-[7px] font-mono text-[11px] text-white/55">{v.studentId}</td>
                            <td className="px-4 py-[7px] text-[11px] text-white/55">Grade {v.gradeLevel}</td>
                            <td className="px-4 py-[7px] text-[11px] text-white/55">Section {v.section}</td>
                            <td className="px-4 py-[7px]">
                              {v.hasVoted ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                                  <span className="w-[5px] h-[5px] rounded-full bg-emerald-400 flex-shrink-0" />
                                  Voted
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] text-white/35">
                                  <span className="w-[5px] h-[5px] rounded-full bg-white/15 flex-shrink-0" />
                                  Pending
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function StatusDot({ status }: { status: ElectionStatus }) {
  const colors: Record<ElectionStatus, string> = {
    OPEN: "bg-emerald-400",
    SCHEDULED: "bg-blue-400",
    DRAFT: "bg-white/20",
    CLOSED: "bg-white/10",
  };
  const labels: Record<ElectionStatus, string> = {
    OPEN: "Open",
    SCHEDULED: "Scheduled",
    DRAFT: "Draft",
    CLOSED: "Closed",
  };
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-white/50 flex-shrink-0">
      <span className={`w-[6px] h-[6px] rounded-full ${colors[status]}`} />
      {labels[status]}
    </span>
  );
}
