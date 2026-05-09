"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getVoterSession } from "@/lib/voter-session";

const BallotSelectionSchema = z.record(z.string().min(1), z.string().min(1).nullable());
const PositionIdsSchema = z.array(z.string().min(1));

export type BallotSelection = z.infer<typeof BallotSelectionSchema>;

export type SubmitBallotResult =
  | { success: true }
  | { success: false; error: string };

export async function submitBallot(
  selections: BallotSelection,
  allPositionIds: string[],
): Promise<SubmitBallotResult> {
  const parsedSelections = BallotSelectionSchema.safeParse(selections);
  const parsedIds = PositionIdsSchema.safeParse(allPositionIds);
  if (!parsedSelections.success || !parsedIds.success) {
    return { success: false, error: "Invalid ballot data." };
  }

  const session = await getVoterSession();
  if (!session) {
    return {
      success: false,
      error: "Session expired. Please re-enter your control number.",
    };
  }

  const voter = await prisma.voter.findUnique({
    where: { id: session.voterId },
    select: { hasVoted: true, electionId: true },
  });

  if (!voter) {
    return { success: false, error: "Voter record not found." };
  }

  if (voter.hasVoted) {
    return { success: true };
  }

  const election = await prisma.election.findUnique({
    where: { id: session.electionId },
    select: { status: true },
  });

  if (!election || election.status !== "OPEN") {
    return { success: false, error: "This election is no longer open." };
  }

  const now = new Date();
  const voteData = parsedIds.data.map((positionId) => {
    const candidateId = parsedSelections.data[positionId] ?? null;
    return {
      electionId: session.electionId,
      positionId,
      candidateId,
      isAbstain: candidateId === null,
      castAt: now,
    };
  });

  try {
    await prisma.$transaction([
      prisma.vote.createMany({ data: voteData }),
      prisma.voter.update({
        where: { id: session.voterId },
        data: { hasVoted: true, votedAt: now },
      }),
    ]);
    // Voter session is intentionally cleared in /vote/confirmed/page.tsx, not here —
    // clearing here would let middleware redirect before the success message renders.
    return { success: true };
  } catch (error) {
    console.error("Ballot submission error:", error);
    return {
      success: false,
      error: "Failed to submit ballot. Please try again.",
    };
  }
}
