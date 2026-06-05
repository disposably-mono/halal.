import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DIVISION_LABELS } from "@/lib/ui/division-labels";

export default async function AdminResultsPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const elections = await prisma.election.findMany({
    where: { status: { in: ["OPEN", "CLOSED"] }, archivedAt: null },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      division: true,
      status: true,
      scheduledClose: true,
      _count: { select: { voters: true } },
    },
  });

  const closedFirst = [
    ...elections.filter((e) => e.status === "CLOSED"),
    ...elections.filter((e) => e.status === "OPEN"),
  ];

  if (closedFirst.length === 0) {
    return (
      <div className="p-6 flex flex-col gap-[18px]">
        <PageHeader count={0} />
        <div className="bg-[#1a2540] border border-white/[0.07] rounded-[12px] flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-10 h-10 rounded-[10px] border border-white/[0.07] flex items-center justify-center text-white/20">
            <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <div className="text-[13px] font-medium text-white/50">No results yet</div>
          <div className="text-[11px] text-white/30">Results appear once an election is open or closed.</div>
        </div>
      </div>
    );
  }

  const electionData = await Promise.all(
    closedFirst.map(async (el) => {
      const votedCount = await prisma.voter.count({
        where: { electionId: el.id, hasVoted: true },
      });

      const positions = await prisma.position.findMany({
        where: { electionId: el.id, isActive: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          candidates: {
            select: { id: true, fullName: true, gradeLevel: true },
          },
        },
      });

      const positionsWithWinner = await Promise.all(
        positions.map(async (pos) => {
          if (pos.candidates.length === 0) {
            return { ...pos, winner: null, draw: null, winnerVotes: 0, totalVotes: 0 };
          }

          const voteCounts = await Promise.all(
            pos.candidates.map(async (c) => ({
              ...c,
              votes: await prisma.vote.count({
                where: { positionId: pos.id, candidateId: c.id },
              }),
            }))
          );

          const totalVotes = voteCounts.reduce((a, c) => a + c.votes, 0);
          const sorted = [...voteCounts].sort((a, b) => b.votes - a.votes);
          const top = sorted[0];
          const isDrawn =
            sorted.length > 1 &&
            sorted[0].votes === sorted[1].votes &&
            sorted[0].votes > 0;
          const hasVotes = top.votes > 0;

          return {
            ...pos,
            winner: hasVotes && !isDrawn ? top : null,
            draw: isDrawn
              ? sorted.filter((c) => c.votes === sorted[0].votes)
              : null,
            winnerVotes: top.votes,
            totalVotes,
          };
        })
      );

      return { ...el, votedCount, positions: positionsWithWinner };
    })
  );

  return (
    <div className="p-6 flex flex-col gap-[18px]">
      <PageHeader count={closedFirst.length} />

      <div className="flex flex-col gap-4">
        {electionData.map((el) => {
          const pct =
            el._count.voters > 0
              ? Math.round((el.votedCount / el._count.voters) * 100)
              : 0;
          const isClosed = el.status === "CLOSED";

          return (
            <div key={el.id} className="bg-[#1a2540] border border-white/[0.07] rounded-[12px] overflow-hidden">
              {/* Election header */}
              <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`inline-flex items-center gap-1 rounded-full px-[7px] py-[2px] text-[10px] font-semibold flex-shrink-0
                    ${isClosed
                      ? "bg-white/[0.05] text-white/25"
                      : "bg-emerald-400/[0.12] text-emerald-400"}`}>
                    <span className={`w-1 h-1 rounded-full ${isClosed ? "bg-white/20" : "bg-emerald-400"}`} />
                    {isClosed ? "Final" : "Live"}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-white/90 truncate">{el.name}</div>
                    <div className="text-[10px] text-white/40">{DIVISION_LABELS[el.division] ?? el.division}</div>
                  </div>
                </div>

                {/* Turnout */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-[13px] font-bold text-white/80">{pct}%</div>
                    <div className="text-[10px] text-white/30">{el.votedCount} / {el._count.voters} voters</div>
                  </div>
                  <div className="w-[48px] h-[4px] bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isClosed ? "bg-white/30" : "bg-emerald-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <Link
                    href={`/admin/elections/${el.id}/monitor`}
                    className="text-[10px] text-amber-400/70 hover:text-amber-400 transition-colors no-underline"
                  >
                    Full tally →
                  </Link>
                </div>
              </div>

              {/* Winners grid */}
              <div className="p-4">
                {el.positions.length === 0 ? (
                  <div className="text-[11px] text-white/25 italic">No positions configured</div>
                ) : (
                  <div
                    className="grid gap-[6px]"
                    style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
                  >
                    {el.positions.map((pos) => {
                      const hasResult = pos.winner || pos.draw;
                      return (
                        <div
                          key={pos.id}
                          className={`flex items-center gap-3 rounded-[8px] px-3 py-[8px] border
                            ${hasResult
                              ? "bg-white/[0.025] border-white/[0.06]"
                              : "bg-transparent border-white/[0.04]"}`}
                        >
                          {/* Icon */}
                          <div className={`w-[28px] h-[28px] rounded-[6px] flex-shrink-0 flex items-center justify-center text-[11px]
                            ${pos.winner
                              ? "bg-amber-400/[0.1] text-amber-400"
                              : pos.draw
                                ? "bg-sky-400/[0.1] text-sky-400"
                                : "bg-white/[0.04] text-white/20"}`}>
                            {pos.winner ? "★" : pos.draw ? "=" : "–"}
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] text-white/30 truncate">{pos.title}</div>
                            {pos.winner ? (
                              <div className="text-[12px] font-semibold text-white/85 truncate mt-[1px]">
                                {pos.winner.fullName}
                              </div>
                            ) : pos.draw ? (
                              <div className="text-[11px] text-sky-400 font-medium mt-[1px]">
                                Draw — {pos.draw.map((c) => c.fullName).join(" / ")}
                              </div>
                            ) : (
                              <div className="text-[11px] text-white/20 italic mt-[1px]">
                                {pos.totalVotes === 0 ? "No votes cast yet" : "No candidates"}
                              </div>
                            )}
                          </div>

                          {/* Winner vote count */}
                          {(pos.winner || pos.draw) && pos.winnerVotes > 0 && (
                            <div className="text-[10px] text-white/30 flex-shrink-0 font-mono">
                              {pos.winnerVotes}v
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PageHeader({ count }: { count: number }) {
  return (
    <div>
      <h1 className="text-[20px] font-bold tracking-tight text-white/90">Results</h1>
      <p className="text-[12px] text-white/40 mt-[3px]">
        {count > 0
          ? `${count} election${count > 1 ? "s" : ""} with results · Winners per position`
          : "No elections with results yet"}
      </p>
    </div>
  );
}
