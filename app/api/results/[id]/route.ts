import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapabilityOrError } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const isAdminRequest = req.nextUrl.searchParams.get("admin") === "1";

  // Verify admin access if requesting admin (live/embargoed) data
  if (isAdminRequest) {
    const guard = await requireCapabilityOrError("admin:view");
    if (!guard.ok) {
      return NextResponse.json(
        { error: guard.error },
        { status: guard.error === "Forbidden" ? 403 : 401 },
      );
    }
  }

  const election = await prisma.election.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      division: true,
      status: true,
      scheduledOpen: true,
      scheduledClose: true,
    },
  });

  if (!election) {
    return NextResponse.json({ error: "Election not found" }, { status: 404 });
  }

  // Public embargo — only return results if CLOSED or admin
  if (!isAdminRequest && election.status !== "CLOSED") {
    return NextResponse.json({
      electionId: id,
      status: election.status,
      name: election.name,
      division: election.division,
      embargoed: true,
      positions: [],
      turnout: null,
    });
  }

  // Fetch positions with candidates and vote counts
  const positions = await prisma.position.findMany({
    where: { electionId: id, isActive: true },
    include: {
      candidates: {
        select: { id: true, fullName: true, gradeLevel: true },
        orderBy: { fullName: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  // Fetch all votes for this election in one query
  const votes = await prisma.vote.findMany({
    where: { electionId: id },
    select: { positionId: true, candidateId: true, isAbstain: true },
  });

  // Build vote count maps
  const candidateVoteCounts = new Map<string, number>();
  const positionAbstentions = new Map<string, number>();

  for (const vote of votes) {
    if (vote.isAbstain || !vote.candidateId) {
      positionAbstentions.set(
        vote.positionId,
        (positionAbstentions.get(vote.positionId) ?? 0) + 1
      );
    } else {
      candidateVoteCounts.set(
        vote.candidateId,
        (candidateVoteCounts.get(vote.candidateId) ?? 0) + 1
      );
    }
  }

  // Turnout
  const totalVoters = await prisma.voter.count({ where: { electionId: id } });
  const votedCount = await prisma.voter.count({
    where: { electionId: id, hasVoted: true },
  });

  const positionResults = positions.map((pos) => {
    const abstentions = positionAbstentions.get(pos.id) ?? 0;
    const candidatesWithVotes = pos.candidates.map((c) => ({
      id: c.id,
      fullName: c.fullName,
      gradeLevel: c.gradeLevel,
      votes: candidateVoteCounts.get(c.id) ?? 0,
    }));
    const maxVotes = candidatesWithVotes.reduce((m, c) => Math.max(m, c.votes), 0);
    const tiedTopCount = candidatesWithVotes.filter(
      (c) => c.votes > 0 && c.votes === maxVotes,
    ).length;
    const candidates = candidatesWithVotes.map((c) => ({
      ...c,
      isWinner: c.votes > 0 && c.votes === maxVotes,
      isTie: tiedTopCount > 1 && c.votes === maxVotes,
    }));
    const totalCandidateVotes = candidates.reduce((s, c) => s + c.votes, 0);

    return {
      id: pos.id,
      title: pos.title,
      order: pos.order,
      candidates: candidates.sort((a, b) => b.votes - a.votes),
      abstentions: isAdminRequest ? abstentions : undefined,
      totalVotes: totalCandidateVotes,
    };
  });

  return NextResponse.json({
    electionId: id,
    status: election.status,
    name: election.name,
    division: election.division,
    embargoed: false,
    positions: positionResults,
    turnout: {
      voted: votedCount,
      total: totalVoters,
      pct: totalVoters > 0 ? Math.round((votedCount / totalVoters) * 100) : 0,
    },
  });
}
