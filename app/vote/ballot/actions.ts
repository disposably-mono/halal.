"use server";

import { prisma } from "@/lib/prisma";
import { getVoterSession } from "@/lib/voter-session";

export interface BallotSelection {
  [positionId: string]: string | null;
}

export type SubmitBallotResult =
  | { success: true }
  | { success: false; error: string };

export async function submitBallot(
  selections: BallotSelection,
  allPositionIds: string[]
): Promise<SubmitBallotResult> {
  const session = await getVoterSession();

  if (!session) {
    return {
      success: false,
      error: "Session expired. Please re-enter your control number."
    };
  }

  const voter = await prisma.voter.findUnique({
    where: { id: session.voterId },
    select: { hasVoted: true, electionId: true },
  });

  if (!voter) {
    return { success: false, error: "Voter record not found." };
  }

  // Already voted — treat as success so client redirects to confirmed
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

  const voteData = allPositionIds.map((positionId) => {
    const candidateId = selections[positionId] ?? null;
    return {
      electionId: session.electionId,
      positionId,
      candidateId: candidateId ?? null,
      isAbstain: candidateId === null,
      castAt: new Date(),
    };
  });

  try {
    await prisma.$transaction([
      prisma.vote.createMany({ data: voteData }),
      prisma.voter.update({
        where: { id: session.voterId },
        data: { hasVoted: true, votedAt: new Date() },
      }),
    ]);

    // WE REMOVED clearVoterSession() FROM HERE.
    // The session is now cleared in /vote/confirmed/page.tsx instead.
    // This prevents the middleware from redirecting the user back to 
    // the login page before they see the success message.

    return { success: true };
  } catch (error) {
    console.error("Ballot submission error:", error);
    return {
      success: false,
      error: "Failed to submit ballot. Please try again."
    };
  }
}
