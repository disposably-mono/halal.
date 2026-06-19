"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getVoterSession } from "@/lib/voter-session";
import { buildVerifiedVoteData, truncateToHour } from "@/lib/domain/ballot";
import {
  createBallotCommitment,
  decryptAuditKey,
  generateBallotNonce,
  generateReceiptCode,
  hashReceiptCode,
} from "@/lib/domain/ballot-audit";
import { setBallotConfirmation } from "@/lib/ballot-confirmation";

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

class ElectionClosedError extends Error {}
class LegacyElectionError extends Error {}

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
  const receiptCode = generateReceiptCode();
  const receiptHash = hashReceiptCode(receiptCode);
  const nonce = generateBallotNonce();
  let ballotId: string | null = null;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Election" WHERE "id" = ${session.electionId} FOR SHARE`;
      const election = await tx.election.findUnique({
        where: { id: session.electionId },
        select: { status: true, auditKeyEncrypted: true, auditVersion: true },
      });
      if (!election || election.status !== "OPEN") throw new ElectionClosedError();
      if (!election.auditKeyEncrypted || !election.auditVersion) throw new LegacyElectionError();

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

      const commitment = createBallotCommitment(
        decryptAuditKey(election.auditKeyEncrypted),
        session.electionId,
        nonce,
        receiptHash,
        voteData.map((vote) => ({
          positionId: vote.positionId,
          candidateId: vote.isAbstain ? null : vote.candidateId,
        })),
      );
      const ballot = await tx.ballot.create({
        data: {
          electionId: session.electionId,
          receiptHash,
          nonce,
          commitment,
          version: election.auditVersion,
          castAt: now,
          votes: { create: voteData },
        },
        select: { id: true },
      });
      ballotId = ballot.id;
    });
    if (!ballotId) throw new Error("Ballot was not created");
    await setBallotConfirmation({ ballotId, receiptCode });
    // Voter session is intentionally cleared in /vote/confirmed/page.tsx, not here —
    // clearing here would let middleware redirect before the success message renders.
    return { success: true };
  } catch (error) {
    if (error instanceof AlreadyVotedError) {
      return { success: true };
    }
    if (error instanceof ElectionClosedError) {
      return { success: false, error: "This election is no longer open." };
    }
    if (error instanceof LegacyElectionError) {
      return { success: false, error: "This legacy election does not support verifiable ballots." };
    }

    console.error("Ballot submission error:", error);
    return {
      success: false,
      error: "Failed to submit ballot. Please try again.",
    };
  }
}
