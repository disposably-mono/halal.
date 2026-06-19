"use server";

import { prisma } from "@/lib/prisma";
import { ElectionStatus } from "@prisma/client";
import {
  canAdvanceToScheduled,
  canManuallyClose,
  canManuallyOpen,
  canReschedule,
  nextStatusForReschedule,
} from "@/lib/domain/election-state";
import { requireCapabilityOrError, adminEmailFromSession } from "@/lib/server/auth";
import { permissionErrorMessage } from "@/lib/auth/permissions";
import {
  revalidateAdminDashboard,
  revalidateElectionControl,
} from "@/lib/server/revalidate";

type ActionResult = { success: true } | { success: false; error: string };

const fmtDate = (d: Date | null) =>
  d?.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }) ?? "—";

function revalidateAfterTransition(electionId: string) {
  revalidateAdminDashboard();
  revalidateElectionControl(electionId);
}

async function transitionStatus(
  electionId: string,
  toStatus: ElectionStatus,
  action: string,
  adminEmail: string,
) {
  await prisma.$transaction([
    prisma.election.update({
      where: { id: electionId },
      data: { status: toStatus },
    }),
    prisma.auditLog.create({
      data: { electionId, action, toStatus, adminEmail },
    }),
  ]);
}

export async function openElectionNow(electionId: string): Promise<ActionResult> {
  const guard = await requireCapabilityOrError("election:lifecycle");
  if (!guard.ok) return { success: false, error: permissionErrorMessage(guard.error) };

  const election = await prisma.election.findUnique({ where: { id: electionId } });
  if (!election) return { success: false, error: "Election not found" };

  const check = canManuallyOpen(election.status);
  if (!check.ok) return { success: false, error: check.reason };

  await transitionStatus(
    electionId,
    ElectionStatus.OPEN,
    "Manually opened election (override)",
    adminEmailFromSession(guard.session),
  );
  revalidateAfterTransition(electionId);
  return { success: true };
}

export async function closeElectionNow(electionId: string): Promise<ActionResult> {
  const guard = await requireCapabilityOrError("election:close");
  if (!guard.ok) return { success: false, error: permissionErrorMessage(guard.error) };

  const election = await prisma.election.findUnique({ where: { id: electionId } });
  if (!election) return { success: false, error: "Election not found" };

  const check = canManuallyClose(election.status);
  if (!check.ok) return { success: false, error: check.reason };

  await transitionStatus(
    electionId,
    ElectionStatus.CLOSED,
    "Manually closed election (override)",
    adminEmailFromSession(guard.session),
  );
  revalidateAfterTransition(electionId);
  return { success: true };
}

export async function rescheduleElection(
  electionId: string,
  scheduledOpen: string | null,
  scheduledClose: string | null,
): Promise<ActionResult> {
  const guard = await requireCapabilityOrError("election:lifecycle");
  if (!guard.ok) return { success: false, error: permissionErrorMessage(guard.error) };

  const election = await prisma.election.findUnique({ where: { id: electionId } });
  if (!election) return { success: false, error: "Election not found" };

  const openDate = scheduledOpen ? new Date(scheduledOpen) : null;
  const closeDate = scheduledClose ? new Date(scheduledClose) : null;

  const check = canReschedule(election.status, openDate, closeDate);
  if (!check.ok) return { success: false, error: check.reason };

  await prisma.$transaction([
    prisma.election.update({
      where: { id: electionId },
      data: {
        scheduledOpen: openDate,
        scheduledClose: closeDate,
        status: nextStatusForReschedule(openDate),
      },
    }),
    prisma.auditLog.create({
      data: {
        electionId,
        action: `Schedule overridden: ${fmtDate(openDate)} – ${fmtDate(closeDate)}`,
        toStatus: null,
        adminEmail: adminEmailFromSession(guard.session),
      },
    }),
  ]);
  revalidateAfterTransition(electionId);
  return { success: true };
}

export async function advanceToScheduled(electionId: string): Promise<ActionResult> {
  const guard = await requireCapabilityOrError("election:lifecycle");
  if (!guard.ok) return { success: false, error: permissionErrorMessage(guard.error) };

  const election = await prisma.election.findUnique({ where: { id: electionId } });
  if (!election) return { success: false, error: "Election not found" };

  const check = canAdvanceToScheduled(election.status, election.scheduledOpen);
  if (!check.ok) return { success: false, error: check.reason };

  await transitionStatus(
    electionId,
    ElectionStatus.SCHEDULED,
    "Advanced to Scheduled",
    adminEmailFromSession(guard.session),
  );
  revalidateAfterTransition(electionId);
  return { success: true };
}
