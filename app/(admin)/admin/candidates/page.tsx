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

/** Parse Position.candidateGrade string (e.g. "9" or "9,10,11") for display. */
function formatCandidateGrade(raw: string): string {
  const parts = raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
  if (parts.length === 0) return "All grades";
  if (parts.length === 1) return parts[0] === 0 ? "All grades" : `Grade ${parts[0]}`;
  return `Grades ${parts.join(" / ")}`;
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

  // Group: division → election → positions[]
  type PositionRow = typeof positions[number];
  const byDivision = new Map<string, Map<string, { name: string; status: string; positions: PositionRow[] }>>();

  for (const pos of positions) {
    const div = pos.election.division as string;
    const eid = pos.election.id;

    if (!byDivision.has(div)) byDivision.set(div, new Map());
    const elMap = byDivision.get(div)!;

    if (!elMap.has(eid)) {
      elMap.set(eid, { name: pos.election.name, status: pos.election.status, positions: [] });
    }
    elMap.get(eid)!.positions.push(pos);
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

        {/* Division quick-jump */}
        {presentDivisions.length > 1 && (
          <div className="flex gap-1 flex-wrap justify-end">
            {presentDivisions.map((d) => {
              const elMap = byDivision.get(d)!;
              const count = Array.from(elMap.values()).reduce(
                (a, el) => a + el.positions.reduce((b, p) => b + p.candidates.length, 0),
                0
              );
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
        const elMap = byDivision.get(div)!;
        const divCandidates = Array.from(elMap.values()).reduce(
          (a, el) => a + el.positions.reduce((b, p) => b + p.candidates.length, 0),
          0
        );
        const positionCount = Array.from(elMap.values()).reduce((a, el) => a + el.positions.length, 0);

        return (
          <div key={div} id={`div-cand-${div}`} className="flex flex-col gap-2">
            {/* Division heading */}
            <div className="flex items-center gap-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">
                {DIVISION_LABELS[div]}
              </div>
              <div className="flex-1 h-px bg-white/[0.05]" />
              <div className="text-[10px] text-white/25">
                {divCandidates} candidate{divCandidates !== 1 ? "s" : ""} · {positionCount} positions
              </div>
            </div>

            {/* One card per election in this division */}
            {Array.from(elMap.entries()).map(([eid, el]) => {
              const elCandidates = el.positions.reduce((a, p) => a + p.candidates.length, 0);

              return (
                <div key={eid} className="bg-[#1a2540] border border-white/[0.07] rounded-[12px] overflow-hidden">
                  {/* Election header */}
                  <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <StatusDot status={el.status as any} />
                      <div className="text-[12px] font-semibold text-white/80 truncate">{el.name}</div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 text-[10px] text-white/40">
                      <span>{elCandidates} candidate{elCandidates !== 1 ? "s" : ""} · {el.positions.length} positions</span>
                      <Link href={`/admin/elections/${eid}/candidates`}
                        className="text-amber-400 border border-amber-400/20 bg-amber-400/[0.07] rounded-[5px] px-[7px] py-[3px] hover:bg-amber-400/[0.14] transition-all no-underline">
                        Manage →
                      </Link>
                    </div>
                  </div>

                  {/* Positions + candidates */}
                  <div className="divide-y divide-white/[0.04]">
                    {el.positions.map((pos) => (
                      <div key={pos.id} className="px-4 py-3">
                        {/* Position title row */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-semibold text-white/65 uppercase tracking-[0.05em]">
                            {pos.title}
                          </span>
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
                                className="flex items-center gap-3 bg-white/[0.025] hover:bg-white/[0.04] rounded-[6px] px-3 py-[6px] transition-colors">
                                <span className="text-[10px] text-white/20 w-4 text-right flex-shrink-0">{idx + 1}</span>
                                <div className="flex-1 text-[12px] font-medium text-white/80 truncate">{c.fullName}</div>
                                <span className="text-[10px] text-white/30 font-mono flex-shrink-0">
                                  {formatGrade(c.gradeLevel)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
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

function StatusDot({ status }: { status: "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED" }) {
  const colors: Record<string, string> = {
    OPEN: "bg-emerald-400", SCHEDULED: "bg-blue-400",
    DRAFT: "bg-white/20", CLOSED: "bg-white/10",
  };
  const labels: Record<string, string> = {
    OPEN: "Open", SCHEDULED: "Scheduled", DRAFT: "Draft", Closed: "Closed",
  };
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-white/40 flex-shrink-0">
      <span className={`w-[6px] h-[6px] rounded-full ${colors[status]}`} />
      {labels[status]}
    </span>
  );
}
