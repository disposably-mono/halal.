import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buildVerifiedVoteData, truncateToHour } from "@/lib/domain/ballot";
import {
  createBallotCommitment,
  decryptAuditKey,
  generateBallotNonce,
  generateReceiptCode,
  hashReceiptCode,
} from "@/lib/domain/ballot-audit";
import { scheduleMonitorRefresh } from "@/lib/server/monitor-broadcast";
import { withSpan } from "@/lib/server/otel";

/**
 * Core ballot-casting logic, extracted from the `submitBallot` server action so
 * the exact same transaction can be exercised by automated tests (the
 * concurrency harness and the guarded load endpoint) without going through the
 * voter cookie session. Deliberately free of `next/headers` side effects — the
 * caller owns the confirmation cookie — so it is safe to call from a plain Node
 * script.
 */

export const BallotSelectionSchema = z.record(
  z.string().min(1),
  z.string().min(1).nullable(),
);
export type BallotSelection = z.infer<typeof BallotSelectionSchema>;

export type CastBallotResult =
  | { success: true; ballotId?: string; receiptCode?: string }
  | { success: false; error: string };

class AlreadyVotedError extends Error {}
class ElectionClosedError extends Error {}
class LegacyElectionError extends Error {}

/**
 * Atomically claims the voter and records an anonymous, verifiable ballot.
 *
 * The race-safety guarantee lives here: a `SELECT ... FOR SHARE` on the election
 * row plus an `updateMany ... where hasVoted:false` means exactly one of any
 * number of concurrent attempts for the same voter can win; the rest resolve as
 * an idempotent success (no second ballot).
 *
 * `expectedElectionId` is an optional consistency check (the session-bound
 * server action passes it); when omitted the voter's own election is used.
 * On a freshly created ballot the `receiptCode` is returned so the caller can
 * persist the confirmation; on the already-voted path no receipt is returned.
 */
export async function castVerifiedBallot(params: {
  voterId: string;
  selections: BallotSelection;
  expectedElectionId?: string;
}): Promise<CastBallotResult> {
  const parsedSelections = BallotSelectionSchema.safeParse(params.selections);
  if (!parsedSelections.success) {
    return { success: false, error: "Invalid ballot data." };
  }

  const voter = await prisma.voter.findUnique({
    where: { id: params.voterId },
    select: { hasVoted: true, electionId: true, gradeLevel: true },
  });

  if (
    !voter ||
    (params.expectedElectionId && voter.electionId !== params.expectedElectionId)
  ) {
    return { success: false, error: "Voter record not found." };
  }

  if (voter.hasVoted) {
    return { success: true };
  }

  const positions = await prisma.position.findMany({
    where: {
      electionId: voter.electionId,
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
    electionId: voter.electionId,
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
    await withSpan(
      "ballot.cast_transaction",
      { "election.id": voter.electionId },
      () =>
        prisma.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT "id" FROM "Election" WHERE "id" = ${voter.electionId} FOR SHARE`;
          const election = await tx.election.findUnique({
            where: { id: voter.electionId },
            select: { status: true, auditKeyEncrypted: true, auditVersion: true },
          });
          if (!election || election.status !== "OPEN") throw new ElectionClosedError();
          if (!election.auditKeyEncrypted || !election.auditVersion) throw new LegacyElectionError();

          const updated = await tx.voter.updateMany({
            where: {
              id: params.voterId,
              electionId: voter.electionId,
              hasVoted: false,
            },
            data: { hasVoted: true, votedAt: votedAtBucket },
          });

          if (updated.count !== 1) {
            throw new AlreadyVotedError();
          }

          const commitment = createBallotCommitment(
            decryptAuditKey(election.auditKeyEncrypted),
            voter.electionId,
            nonce,
            receiptHash,
            voteData.map((vote) => ({
              positionId: vote.positionId,
              candidateId: vote.isAbstain ? null : vote.candidateId,
            })),
          );
          const ballot = await tx.ballot.create({
            data: {
              electionId: voter.electionId,
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
        }),
    );

    if (!ballotId) throw new Error("Ballot was not created");

    // The ballot committed — this is the canonical election-state change. Fire
    // the monitor recompute + broadcast without awaiting it: the voter's
    // confirmation must not wait on (or be failed by) monitor work, and
    // scheduleMonitorRefresh never throws.
    void scheduleMonitorRefresh(voter.electionId);

    return { success: true, ballotId, receiptCode };
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
    return { success: false, error: "Failed to submit ballot. Please try again." };
  }
}
