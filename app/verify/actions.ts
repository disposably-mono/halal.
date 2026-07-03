"use server";

import { prisma } from "@/lib/prisma";
import {
  decryptAuditKey,
  formatFingerprint,
  hashReceiptCode,
  normalizeReceiptCode,
  verifyBallotCommitment,
} from "@/lib/domain/ballot-audit";
import { clientIp, rateLimit, RATE_LIMITS } from "@/lib/server/rate-limit";
import { toVerifiedSelections, type VerifiedSelection } from "./verification-selections";

// Reject absurdly long input before it ever reaches normalizeReceiptCode's
// regex replace — the real code is a fixed-width 32-char value, so anything
// past a generous margin is either a mistake or an attempt to burn CPU on a
// multi-MB string.
const MAX_RAW_CODE_LENGTH = 64;

/**
 * Result of a receipt verification attempt.
 *
 * `idle` is the initial client form value (nothing submitted yet); `closed`
 * means no open election exists so verification is unavailable; `rate_limited`
 * means this IP hit the (generous) per-IP throttle in `RATE_LIMITS.receiptVerify`
 * — see that constant for why it stays loose. All other states mirror the
 * ballot's integrity outcome.
 */
export type VerifyState =
  | { status: "idle" }
  | { status: "closed" }
  | { status: "invalid" }
  | { status: "rate_limited" }
  | { status: "already_verified" }
  // `fingerprint` is already display-formatted server-side, so the client (which
  // must not import the node:crypto-backed ballot-audit module) can render it as-is.
  | { status: "valid"; electionName: string; fingerprint: string; selections: VerifiedSelection[] }
  | { status: "compromised"; electionName: string; fingerprint: string };

/** True when at least one open, non-archived election exists (the gate for verification). */
export async function hasOpenElection(): Promise<boolean> {
  const openCount = await prisma.election.count({
    where: { status: "OPEN", archivedAt: null },
  });
  return openCount > 0;
}

/**
 * Verifies a ballot receipt and, on a valid result, burns the one-time
 * verification by stamping `verifiedAt`. This is a POST-only server action so the
 * state-mutating write never happens on a GET render (link-preview bots and
 * prefetchers must not be able to consume a receipt).
 */
export async function verifyReceiptAction(
  _previous: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const rawCode = formData.get("code");
  if (typeof rawCode !== "string") return { status: "invalid" };

  // Reject oversized input before it ever reaches normalizeReceiptCode's regex
  // replace — an unauthenticated caller could otherwise post a multi-MB string
  // and burn CPU on every attempt.
  if (rawCode.length > MAX_RAW_CODE_LENGTH) return { status: "invalid" };

  // Throttle per-IP before any DB work runs. This action is unauthenticated
  // and has no per-account identity to key on instead, so IP is the only
  // option — see RATE_LIMITS.receiptVerify for why the limit stays generous.
  const ip = await clientIp();
  if (!rateLimit(`receipt-verify:${ip}`, RATE_LIMITS.receiptVerify).ok) {
    return { status: "rate_limited" };
  }

  // Re-check the gate at write time: verification is available under the same
  // rule as casting a vote — at least one open election must exist.
  if (!(await hasOpenElection())) {
    return { status: "closed" };
  }

  const normalized = normalizeReceiptCode(rawCode);
  if (normalized.length !== 32) return { status: "invalid" };

  const receiptHash = hashReceiptCode(normalized);
  const ballot = await prisma.ballot.findUnique({
    where: { receiptHash },
    select: {
      nonce: true,
      commitment: true,
      receiptHash: true,
      electionId: true,
      verifiedAt: true,
      election: {
        select: { name: true, auditKeyEncrypted: true, auditFingerprint: true },
      },
      votes: {
        select: {
          electionId: true,
          positionId: true,
          candidateId: true,
          isAbstain: true,
          position: { select: { title: true } },
          candidate: { select: { fullName: true, gradeLevel: true } },
        },
        orderBy: { position: { order: "asc" } },
      },
    },
  });

  if (!ballot || !ballot.election.auditKeyEncrypted || !ballot.election.auditFingerprint) {
    return { status: "invalid" };
  }
  if (ballot.verifiedAt !== null) {
    return { status: "already_verified" };
  }

  try {
    const valid = verifyBallotCommitment(
      ballot.commitment,
      decryptAuditKey(ballot.election.auditKeyEncrypted),
      ballot.electionId,
      ballot.nonce,
      ballot.receiptHash,
      ballot.votes.map((vote) => ({
        positionId: vote.positionId,
        candidateId: vote.isAbstain ? null : vote.candidateId,
      })),
    );
    const structurallyValid = ballot.votes.every((vote) => vote.electionId === ballot.electionId);
    const outcome = valid && structurallyValid ? "valid" : "compromised";

    if (outcome === "valid") {
      // Atomic one-time burn: only the request that actually flips
      // verifiedAt from null wins "first verification". Two concurrent
      // verifications of the same receipt must not both report success.
      const burned = await prisma.ballot.updateMany({
        where: { receiptHash, verifiedAt: null },
        data: { verifiedAt: new Date() },
      });
      if (burned.count === 0) {
        return { status: "already_verified" };
      }

      return {
        status: "valid",
        electionName: ballot.election.name,
        fingerprint: formatFingerprint(ballot.election.auditFingerprint),
        selections: toVerifiedSelections(ballot.votes),
      };
    }

    return {
      status: "compromised",
      electionName: ballot.election.name,
      fingerprint: formatFingerprint(ballot.election.auditFingerprint),
    };
  } catch {
    return {
      status: "compromised",
      electionName: ballot.election.name,
      fingerprint: formatFingerprint(ballot.election.auditFingerprint),
    };
  }
}
