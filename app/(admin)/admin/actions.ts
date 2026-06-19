"use server";

import { prisma } from "@/lib/prisma";
import {
  requireCapability,
  requireCapabilityOrError,
  adminEmailFromSession,
} from "@/lib/server/auth";
import {
  revalidateAdminDashboard,
  revalidateElectionControl,
} from "@/lib/server/revalidate";
import { permissionErrorMessage } from "@/lib/auth/permissions";
import { ElectionStatusSchema } from "@/lib/validation/schemas";
import { canArchive, canRestore } from "@/lib/domain/election-state";
import { closeElectionWithCertification } from "@/lib/server/close-election";

type ActionResult = { success: true } | { success: false; error: string };

export async function updateElectionStatus(
  electionId: string,
  status: string,
): Promise<void> {
  const parsed = ElectionStatusSchema.safeParse(status);
  if (!parsed.success) {
    throw new Error(`Invalid election status: ${status}`);
  }
  const nextStatus = parsed.data;

  // Closing an election is the Canvassing Head's domain; all other transitions
  // belong to the Commissioner (election lifecycle).
  const session = await requireCapability(
    nextStatus === "CLOSED" ? "election:close" : "election:lifecycle",
  );

  if (nextStatus === "SCHEDULED" || nextStatus === "OPEN") {
    const election = await prisma.election.findUnique({
      where: { id: electionId },
      select: { candidatesFinalized: true, votersFinalized: true },
    });
    if (!election?.candidatesFinalized || !election?.votersFinalized) {
      throw new Error(
        "Both candidates and voters must be finalized before changing to this status.",
      );
    }
  }

  if (nextStatus === "CLOSED") {
    await closeElectionWithCertification(electionId, adminEmailFromSession(session));
  } else {
    await prisma.election.update({
      where: { id: electionId },
      data: { status: nextStatus },
    });
  }

  revalidateAdminDashboard();
}

export async function archiveElection(electionId: string): Promise<ActionResult> {
  const guard = await requireCapabilityOrError("election:lifecycle");
  if (!guard.ok) return { success: false, error: permissionErrorMessage(guard.error) };

  const election = await prisma.election.findUnique({ where: { id: electionId } });
  if (!election) return { success: false, error: "Election not found" };

  const check = canArchive(election.status, election.archivedAt);
  if (!check.ok) return { success: false, error: check.reason };

  const adminEmail = adminEmailFromSession(guard.session);
  await prisma.$transaction([
    prisma.election.update({
      where: { id: electionId },
      data: { archivedAt: new Date(), archivedBy: adminEmail },
    }),
    prisma.auditLog.create({
      data: { electionId, action: "Archived election", toStatus: null, adminEmail },
    }),
  ]);

  revalidateAdminDashboard();
  revalidateElectionControl(electionId);
  return { success: true };
}

export async function restoreElection(electionId: string): Promise<ActionResult> {
  const guard = await requireCapabilityOrError("election:lifecycle");
  if (!guard.ok) return { success: false, error: permissionErrorMessage(guard.error) };

  const election = await prisma.election.findUnique({ where: { id: electionId } });
  if (!election) return { success: false, error: "Election not found" };

  const check = canRestore(election.archivedAt);
  if (!check.ok) return { success: false, error: check.reason };

  const adminEmail = adminEmailFromSession(guard.session);
  await prisma.$transaction([
    prisma.election.update({
      where: { id: electionId },
      data: { archivedAt: null, archivedBy: null },
    }),
    prisma.auditLog.create({
      data: { electionId, action: "Restored election", toStatus: null, adminEmail },
    }),
  ]);

  revalidateAdminDashboard();
  revalidateElectionControl(electionId);
  return { success: true };
}
