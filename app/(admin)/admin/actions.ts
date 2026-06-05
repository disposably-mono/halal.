"use server";

import { prisma } from "@/lib/prisma";
import {
  requireAdminSession,
  requireAdminSessionOrError,
  adminEmailFromSession,
} from "@/lib/server/auth";
import {
  revalidateAdminDashboard,
  revalidateElectionControl,
} from "@/lib/server/revalidate";
import { ElectionStatusSchema } from "@/lib/validation/schemas";
import { canArchive, canRestore } from "@/lib/domain/election-state";

type ActionResult = { success: true } | { success: false; error: string };

export async function updateElectionStatus(
  electionId: string,
  status: string,
): Promise<void> {
  await requireAdminSession();

  const parsed = ElectionStatusSchema.safeParse(status);
  if (!parsed.success) {
    throw new Error(`Invalid election status: ${status}`);
  }
  const nextStatus = parsed.data;

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

  await prisma.election.update({
    where: { id: electionId },
    data: { status: nextStatus },
  });

  revalidateAdminDashboard();
}

export async function archiveElection(electionId: string): Promise<ActionResult> {
  const guard = await requireAdminSessionOrError();
  if (!guard.ok) return { success: false, error: guard.error };

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
  const guard = await requireAdminSessionOrError();
  if (!guard.ok) return { success: false, error: guard.error };

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
