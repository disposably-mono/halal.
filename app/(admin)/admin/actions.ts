"use server";

import { adminEmailFromSession } from "@/lib/server/auth";
import {
  revalidateAdminDashboard,
  revalidateElectionControl,
} from "@/lib/server/revalidate";
import { canArchive, canRestore } from "@/lib/domain/election-state";
import {
  auditedAction,
  TransitionValidationError,
  type ActionResult,
} from "@/lib/server/audited-action";

function revalidateAfterTransition(electionId: string) {
  revalidateAdminDashboard();
  revalidateElectionControl(electionId);
}

const runArchiveElection = auditedAction<[electionId: string]>({
  name: "archiveElection",
  capability: "election:lifecycle",
  errorMessage: "Failed to archive election",
  run: async (tx, session, electionId) => {
    // Row-lock before reading so a concurrent status transition (e.g.
    // openElectionNow) can't slip in between our guard check and write.
    await tx.$queryRaw`SELECT "id" FROM "Election" WHERE "id" = ${electionId} FOR UPDATE`;
    const election = await tx.election.findUnique({ where: { id: electionId } });
    if (!election) throw new TransitionValidationError("Election not found");

    const check = canArchive(election.status, election.archivedAt);
    if (!check.ok) throw new TransitionValidationError(check.reason);

    const adminEmail = adminEmailFromSession(session);
    await tx.election.update({
      where: { id: electionId },
      data: { archivedAt: new Date(), archivedBy: adminEmail },
    });
    await tx.auditLog.create({
      data: { electionId, action: "Archived election", toStatus: null, adminEmail },
    });
  },
});

export async function archiveElection(electionId: string): Promise<ActionResult> {
  const result = await runArchiveElection(electionId);
  if (result.success) revalidateAfterTransition(electionId);
  return result;
}

const runRestoreElection = auditedAction<[electionId: string]>({
  name: "restoreElection",
  capability: "election:lifecycle",
  errorMessage: "Failed to restore election",
  run: async (tx, session, electionId) => {
    await tx.$queryRaw`SELECT "id" FROM "Election" WHERE "id" = ${electionId} FOR UPDATE`;
    const election = await tx.election.findUnique({ where: { id: electionId } });
    if (!election) throw new TransitionValidationError("Election not found");

    const check = canRestore(election.archivedAt);
    if (!check.ok) throw new TransitionValidationError(check.reason);

    const adminEmail = adminEmailFromSession(session);
    await tx.election.update({
      where: { id: electionId },
      data: { archivedAt: null, archivedBy: null },
    });
    await tx.auditLog.create({
      data: { electionId, action: "Restored election", toStatus: null, adminEmail },
    });
  },
});

export async function restoreElection(electionId: string): Promise<ActionResult> {
  const result = await runRestoreElection(electionId);
  if (result.success) revalidateAfterTransition(electionId);
  return result;
}
