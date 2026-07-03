"use server";

import { prisma } from "@/lib/prisma";
import {
  requireCapabilityOrError,
  adminEmailFromSession,
} from "@/lib/server/auth";
import {
  revalidateAdminDashboard,
  revalidateElectionControl,
} from "@/lib/server/revalidate";
import { permissionErrorMessage } from "@/lib/auth/permissions";
import { canArchive, canRestore } from "@/lib/domain/election-state";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Thrown for expected validation failures inside a locked transaction so the
 * caller can surface `error.message` verbatim to the admin UI, while any other
 * (unexpected) error is logged and reported generically. Mirrors the pattern
 * in `elections/[id]/control/actions.ts`.
 */
class TransitionValidationError extends Error {}

export async function archiveElection(electionId: string): Promise<ActionResult> {
  const guard = await requireCapabilityOrError("election:lifecycle");
  if (!guard.ok) return { success: false, error: permissionErrorMessage(guard.error) };
  const adminEmail = adminEmailFromSession(guard.session);

  try {
    await prisma.$transaction(async (tx) => {
      // Row-lock before reading so a concurrent status transition (e.g.
      // openElectionNow) can't slip in between our guard check and write.
      await tx.$queryRaw`SELECT "id" FROM "Election" WHERE "id" = ${electionId} FOR UPDATE`;
      const election = await tx.election.findUnique({ where: { id: electionId } });
      if (!election) throw new TransitionValidationError("Election not found");

      const check = canArchive(election.status, election.archivedAt);
      if (!check.ok) throw new TransitionValidationError(check.reason);

      await tx.election.update({
        where: { id: electionId },
        data: { archivedAt: new Date(), archivedBy: adminEmail },
      });
      await tx.auditLog.create({
        data: { electionId, action: "Archived election", toStatus: null, adminEmail },
      });
    });
  } catch (error) {
    if (error instanceof TransitionValidationError) return { success: false, error: error.message };
    console.error("[archiveElection] transition failed:", error);
    return { success: false, error: "Failed to archive election" };
  }

  revalidateAdminDashboard();
  revalidateElectionControl(electionId);
  return { success: true };
}

export async function restoreElection(electionId: string): Promise<ActionResult> {
  const guard = await requireCapabilityOrError("election:lifecycle");
  if (!guard.ok) return { success: false, error: permissionErrorMessage(guard.error) };
  const adminEmail = adminEmailFromSession(guard.session);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Election" WHERE "id" = ${electionId} FOR UPDATE`;
      const election = await tx.election.findUnique({ where: { id: electionId } });
      if (!election) throw new TransitionValidationError("Election not found");

      const check = canRestore(election.archivedAt);
      if (!check.ok) throw new TransitionValidationError(check.reason);

      await tx.election.update({
        where: { id: electionId },
        data: { archivedAt: null, archivedBy: null },
      });
      await tx.auditLog.create({
        data: { electionId, action: "Restored election", toStatus: null, adminEmail },
      });
    });
  } catch (error) {
    if (error instanceof TransitionValidationError) return { success: false, error: error.message };
    console.error("[restoreElection] transition failed:", error);
    return { success: false, error: "Failed to restore election" };
  }

  revalidateAdminDashboard();
  revalidateElectionControl(electionId);
  return { success: true };
}
