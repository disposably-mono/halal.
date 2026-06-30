"use server";

import { getVoterSession } from "@/lib/voter-session";
import { setBallotConfirmation } from "@/lib/ballot-confirmation";
import { castVerifiedBallot, type BallotSelection } from "@/lib/server/cast-ballot";

export type { BallotSelection };

export type SubmitBallotResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Session-bound entry point for the voter ballot UI. Resolves the voter from
 * the signed cookie, delegates the atomic claim + verifiable record to the
 * shared `castVerifiedBallot` (the same code path the automated tests exercise),
 * then persists the confirmation cookie for a freshly cast ballot.
 *
 * The authoritative eligible positions are re-derived server-side from the
 * voter's grade inside `castVerifiedBallot`, so the client no longer needs to
 * pass them.
 */
export async function submitBallot(
  selections: BallotSelection,
): Promise<SubmitBallotResult> {
  const session = await getVoterSession();
  if (!session) {
    return {
      success: false,
      error: "Session expired. Please re-enter your control number.",
    };
  }

  const result = await castVerifiedBallot({
    voterId: session.voterId,
    expectedElectionId: session.electionId,
    selections,
  });

  if (result.success && result.ballotId && result.receiptCode) {
    await setBallotConfirmation({
      ballotId: result.ballotId,
      receiptCode: result.receiptCode,
    });
    // Voter session is intentionally cleared in /vote/confirmed/page.tsx, not here —
    // clearing here would let middleware redirect before the success message renders.
  }

  return result.success
    ? { success: true }
    : { success: false, error: result.error };
}
