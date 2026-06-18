"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getVoterSession } from "@/lib/voter-session";
import { buildVerifiedVoteData, truncateToHour } from "@/lib/domain/ballot";

const BallotSelectionSchema = z.record(z.string().min(1), z.string().min(1).nullable());
const PositionIdsSchema = z.array(z.string().min(1));

export type BallotSelection = z.infer<typeof BallotSelectionSchema>;

export type SubmitBallotResult =
  | { success: true }
  | { success: false; error: string };

class AlreadyVotedError extends Error {
  constructor() {
    super("Voter has already submitted a ballot.");
    this.name = "AlreadyVotedError";
  }
}

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
    select: { hasVoted: true, electionId: true, gradeLevel: true },
  });

  if (!voter || voter.electionId !== session.electionId) {
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

  const positions = await prisma.position.findMany({
    where: {
      electionId: session.electionId,
      isActive: true,
      eligibleGrades: { has: voter.gradeLevel },
    },
    select: {
      id: true,
      candidates: { select: { id: true } },
    },
    orderBy: { order: "asc" },
  });

  const now = new Date();
  const voteData = buildVerifiedVoteData({
    electionId: session.electionId,
    positions,
    selections: parsedSelections.data,
    castAt: now,
  });
  const votedAtBucket = truncateToHour(now);

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.voter.updateMany({
        where: {
          id: session.voterId,
          electionId: session.electionId,
          hasVoted: false,
        },
        data: { hasVoted: true, votedAt: votedAtBucket },
      });

      if (updated.count !== 1) {
        throw new AlreadyVotedError();
      }

      if (voteData.length > 0) {
        await tx.vote.createMany({ data: voteData });
      }
    });
    // Voter session is intentionally cleared in /vote/confirmed/page.tsx, not here —
    // clearing here would let middleware redirect before the success message renders.
    return { success: true };
  } catch (error) {
    if (error instanceof AlreadyVotedError) {
      return { success: true };
    }

    console.error("Ballot submission error:", error);
    return {
      success: false,
      error: "Failed to submit ballot. Please try again.",
    };
  }
}
