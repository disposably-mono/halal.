import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/admin/ui";
import type { AuditSnapshot } from "@/lib/domain/audit-tally";
import { verifyStoredCertification } from "@/lib/server/election-audit";
import { orderResultsElections } from "./admin-results-summary";
import { ResultsIndexClient } from "./ResultsIndexClient";
import type { ResultsIndexElection, ResultsIndexStatus } from "./results-index";

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
      createdAt: true,
      scheduledClose: true,
      _count: { select: { voters: true } },
      auditKeyEncrypted: true,
      auditVersion: true,
      certification: { select: { snapshot: true, snapshotHash: true, signature: true } },
    },
  });

  const closedFirst = orderResultsElections(elections);

  if (closedFirst.length === 0) {
    return (
      <PageContainer className="flex flex-col gap-[18px]">
        <ResultsIndexClient elections={[]} />
      </PageContainer>
    );
  }

  const electionData = await Promise.all(
    closedFirst.map(async (el) => {
      const certified = el.certification?.snapshot as unknown as AuditSnapshot | undefined;
      if (el.status === "CLOSED" && el.auditVersion !== null && !certified) {
        return { ...el, votedCount: 0, positions: [], integrityFailure: true };
      }
      if (certified) {
        const certificationValid = !!el.auditKeyEncrypted && verifyStoredCertification({
          encryptedKey: el.auditKeyEncrypted,
          snapshot: el.certification!.snapshot,
          snapshotHash: el.certification!.snapshotHash,
          signature: el.certification!.signature,
        });
        if (!certificationValid) {
          return { ...el, votedCount: 0, positions: [], integrityFailure: true };
        }
        const certifiedPositions = certified.positions.map((position) => {
          const sorted = [...position.candidates].sort((a, b) => b.votes - a.votes);
          const top = sorted[0];
          const isDrawn = !!top && top.votes > 0 && sorted.filter((candidate) => candidate.votes === top.votes).length > 1;
          return {
            id: position.id,
            title: position.title,
            order: position.order,
            candidates: position.candidates,
            winner: top && top.votes > 0 && !isDrawn ? top : null,
            draw: isDrawn ? sorted.filter((candidate) => candidate.votes === top.votes) : null,
            winnerVotes: top?.votes ?? 0,
            totalVotes: position.candidates.reduce((sum, candidate) => sum + candidate.votes, 0),
          };
        });
        return { ...el, votedCount: certified.turnout.voted, positions: certifiedPositions, integrityFailure: false };
      }
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

      return { ...el, votedCount, positions: positionsWithWinner, integrityFailure: false };
    })
  );

  const resultsElections: ResultsIndexElection[] = electionData.map((el) => ({
    id: el.id,
    name: el.name,
    division: el.division,
    createdAt: el.createdAt,
    status: el.status as ResultsIndexStatus,
    votedCount: el.votedCount,
    voterCount: el._count.voters,
    integrityFailure: el.integrityFailure,
    positions: el.positions.map((pos) => ({
      id: pos.id,
      title: pos.title,
      candidates: pos.candidates.map((candidate) => ({ id: candidate.id, fullName: candidate.fullName })),
      winner: pos.winner ? { id: pos.winner.id, fullName: pos.winner.fullName, votes: pos.winner.votes } : null,
      draw: pos.draw
        ? pos.draw.map((candidate) => ({ id: candidate.id, fullName: candidate.fullName, votes: candidate.votes }))
        : null,
      winnerVotes: pos.winnerVotes,
      totalVotes: pos.totalVotes,
    })),
  }));

  return (
    <PageContainer className="flex flex-col gap-[18px]">
      <ResultsIndexClient elections={resultsElections} />
    </PageContainer>
  );
}
