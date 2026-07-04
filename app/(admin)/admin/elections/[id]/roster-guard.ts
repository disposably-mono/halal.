import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { ValidationResult } from "@/lib/domain/election-state";
import { canFinalizeUnlock } from "@/lib/domain/election-state";

/**
 * Shared "look up the election, then confirm its roster is still editable"
 * preamble used by voters/actions.ts and candidates/actions.ts. Each call
 * site passes its own `select` (some need `division`, some don't) and its
 * own guard predicate (`canEditVoterRoster` vs `canEditCandidateRoster`,
 * keyed off a differently-named "finalized" column) — this only unifies the
 * lookup + not-found + guard-check control flow. Callers still map the
 * generic `{ok:false, error}` into their own return shape (void, a
 * structured result object, etc.), since those genuinely differ per site.
 *
 * Not used by every roster-editing action: `removePosition`, `addCandidate`,
 * `removeCandidate` (candidates/actions.ts) look up a Position/Candidate row
 * and check its *nested* election, not a direct election lookup, and
 * `finalizeCandidates` wraps the same check in a locked transaction with its
 * own `RosterGuardError` throw — different shapes that don't fit this helper
 * without contorting it.
 */
export async function guardEditableRoster<S extends Prisma.ElectionSelect>(
  electionId: string,
  select: S,
  checkGuard: (
    election: Prisma.ElectionGetPayload<{ select: S }>,
  ) => ValidationResult,
): Promise<
  | { ok: true; election: Prisma.ElectionGetPayload<{ select: S }> }
  | { ok: false; error: string }
> {
  const election = await prisma.election.findUnique({ where: { id: electionId }, select });
  if (!election) return { ok: false, error: "Election not found." };
  const guard = checkGuard(election);
  if (!guard.ok) return { ok: false, error: guard.reason };
  return { ok: true, election };
}

export type UnfinalizeRosterField = "votersFinalized" | "candidatesFinalized";

/**
 * Shared body of unfinalizeVoters (voters/actions.ts) and unfinalizeCandidates
 * (candidates/actions.ts): both look up the election, run the same
 * `canFinalizeUnlock` guard, and — on success — flip one finalized flag back
 * to false. They differ only in which flag they flip and the "voters" vs
 * "candidates" word substituted into the guard-failure message; the
 * capability check and revalidation call stay in each caller since those are
 * genuinely per-file (different capability string, different revalidate
 * function).
 */
export async function unfinalizeRoster(
  electionId: string,
  field: UnfinalizeRosterField,
  label: string,
): Promise<{ success: boolean; error?: string }> {
  const election = await prisma.election.findUnique({
    where: { id: electionId },
    select: { status: true, archivedAt: true },
  });
  if (!election) return { success: false, error: "Election not found." };

  const guard = canFinalizeUnlock(election.status, election.archivedAt);
  if (!guard.ok) {
    return {
      success: false,
      error: guard.reason.replace("Cannot unlock", `Cannot unlock ${label}`),
    };
  }

  await prisma.election.update({
    where: { id: electionId },
    data: { [field]: false },
  });

  return { success: true };
}
