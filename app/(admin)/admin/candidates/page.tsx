import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const DIVISION_LABELS: Record<string, string> = {
  GS: "Grade School", JHS: "Junior High School",
  SHS: "Senior High School", HC: "House Council",
};
const DIVISION_ORDER = ["GS", "JHS", "SHS", "HC"];

function formatGrade(gradeLevel: number): string {
  return gradeLevel === 0 ? "All grades" : `Grade ${gradeLevel}`;
}

function formatCandidateGrade(candidateGrade: number | number[]): string {
  if (Array.isArray(candidateGrade)) {
    if (candidateGrade.length === 0) return "All grades";
    if (candidateGrade.length === 1) return `Grade ${candidateGrade[0]}`;
    return `Grades ${candidateGrade.join(" / ")}`;
  }
  return candidateGrade === 0 ? "All grades" : `Grade ${candidateGrade}`;
}

export default async function AdminCandidatesPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const positions = await prisma.position.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      candidateGrade: true,
      election: {
        select: { id: true, name: true, division: true, status: true },
      },
      candidates: {
        orderBy: { fullName: "asc" },
        select: { id: true, fullName: true, gradeLevel: true },
      },
    },
  });

  const totalCandidates = positions.reduce((a, p) => a + p.candidates.length, 0);

  type CandidateEntry = {
    id: string;
    fullName: string;
    gradeLevel: number;
    electionId: string;
    electionName: string;
    electionStatus: string;
  };
  type PositionGroup = {
    title: string;
    candidateGrade: number | number[];
    candidates: CandidateEntry[];
    electionIds: Set<string>;
  };

  const byDivision = new Map<string, Map<string, PositionGroup>>();

  for (const pos of positions) {
    const div = pos.election.division;
    if (!byDivision.has(div)) byDivision.set(div, new Map());
    const posMap = byDivision.get(div)!;

    if (!posMap.has(pos.title)) {
      posMap.set(pos.title, {
        title: pos.title,
        candidateGrade: pos.candidateGrade as number | number[],
        candidates: [],
        electionIds: new Set(),
      });
    }
    const group = posMap.get(pos.title)!;
    group.electionIds.add(pos.election.id);
    for (const c of pos.candidates) {
      group.candidates.push({
        ...c,
        electionId: pos.election.id,
        electionName: pos.election.name,
        electionStatus: pos.election.status,
      });
    }
  }

  const divisionElectionId = new Map<string, string>();
  for (const pos of positions) {
    const div = pos.election.division;
    if (!divisionElectionId.has(div)) divisionElectionId.set(div, pos.election.id);
  }

  const presentDivisions = DIVISION_ORDER.filter((d) => byDivision.has(d));

  return (
    <div className="p-6 flex flex-col gap-[18px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-white/90">All Candidates</h1>
          <p className="text-[12px] text-white/40 mt-[3px]">
            {totalCandidates.toLocaleString()} candidate{totalCandidates !== 1 ? "s" : ""} across all active elections
          </p>
        </div>
        {presentDivisions.length > 1 && (
          <div className="flex gap-1 flex-wrap justify-end">
            {presentDivisions.map((d) => {
              const count = [...(byDivision.get(d)?.values() ?? [])].reduce((a, p) => a + p.candidates.length, 0);
              return (
                <a key={d} href={`#div-cand-${d}`}
                  className="text-[10px] text-white/40 border border-white/[0.07] rounded-[5px] px-[8px] py-[3px] hover:text-white/70 hover:border-white/[0.12] transition-all no-underline">
                  {DIVISION_LABELS[d]} ({count})
                </a>
              );
            })}
          </div>
        )}
      </div>

      {totalCandidates === 0 && (
        <div className="bg-[#1a2540] border border-white/[0.07] rounded-[12px] flex flex-col items-center gap-3 py-16 text-center">
          <div className="text-[13px] font-medium text-white/50">No candidates encoded yet</div>
          <div className="text-[11px] text-white/30">Add candidates via the election candidates page.</div>
        </div>
      )}

      {presentDivisions.map((div) => {
        const posMap = byDivision.get(div)!;
        const divCandidates = [...posMap.values()].reduce((a, p) => a + p.candidates.length, 0);
        const eid = divisionElectionId.get(div);

        return (
          <div key={div} id={`div-cand-${div}`} className="flex flex-col gap-2">
            {/* Division heading */}
            <div className="flex items-center gap-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">
                {DIVISION_LABELS[div]}
              </div>
              <div className="flex-1 h-px bg-white/[0.05]" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/25">
                  {divCandidates} candidate{divCandidates !== 1 ? "s" : ""} · {posMap.size} positions
                </span>
                {eid && (
                  <Link href={`/admin/elections/${eid}/candidates`}
                    className="text-[10px] text-amber-400/60 hover:text-amber-400 transition-colors no-underline">
                    Manage →
                  </Link>
                )}
              </div>
            </div>

            {/* Positions card */}
            <div className="bg-[#1a2540] border border-white/[0.07] rounded-[12px] overflow-hidden">
              <div className="divide-y divide-white/[0.04]">
                {[...posMap.values()].map((pos) => (
                  <div key={pos.title} className="px-4 py-3">
                    {/* Position title row */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-white/65 uppercase tracking-[0.05em]">
                          {pos.title}
                        </span>
                        {pos.electionIds.size > 1 && (
                          <span className="text-[9px] bg-blue-400/[0.1] text-blue-400 border border-blue-400/20 rounded-[3px] px-[5px] py-[1px] font-semibold">
                            {pos.electionIds.size} elections
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-white/25">
                        {formatCandidateGrade(pos.candidateGrade)}
                      </span>
                    </div>

                    {pos.candidates.length === 0 ? (
                      <div className="text-[11px] text-white/20 italic pl-1">No candidates encoded</div>
                    ) : (
                      <div className="flex flex-col gap-[4px]">
                        {pos.candidates.map((c, idx) => (
                          <div key={c.id}
                            className="flex items-center gap-3 bg-white/[0.025] hover:bg-white/[0.04] rounded-[6px] px-3 py-[6px] transition-colors group">
                            <span className="text-[10px] text-white/20 w-4 text-right flex-shrink-0">{idx + 1}</span>
                            <div className="flex-1 text-[12px] font-medium text-white/80 truncate">{c.fullName}</div>
                            <span className="text-[10px] text-white/30 font-mono flex-shrink-0">
                              {formatGrade(c.gradeLevel)}
                            </span>
                            {pos.electionIds.size > 1 && (
                              <span className="text-[10px] text-white/20 truncate max-w-[140px] hidden group-hover:block">
                                {c.electionName}
                              </span>
                            )}
                            <StatusDot status={c.electionStatus as any} compact />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusDot({
  status,
  compact = false,
}: {
  status: "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED";
  compact?: boolean;
}) {
  const colors: Record<string, string> = {
    OPEN: "bg-emerald-400", SCHEDULED: "bg-blue-400",
    DRAFT: "bg-white/20", CLOSED: "bg-white/10",
  };
  const labels: Record<string, string> = {
    OPEN: "Open", SCHEDULED: "Scheduled", DRAFT: "Draft", CLOSED: "Closed",
  };
  if (compact) {
    return <span className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${colors[status]}`} title={labels[status]} />;
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-white/40 flex-shrink-0">
      <span className={`w-[6px] h-[6px] rounded-full ${colors[status]}`} />
      {labels[status]}
    </span>
  );
}
