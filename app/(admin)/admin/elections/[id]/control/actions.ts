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
import { closeElectionWithCertification } from "@/lib/server/close-election";
import { loadAuditSnapshot } from "@/lib/server/election-audit";
import {
  hashSnapshot,
  signSnapshot,
  verifySnapshotSignature,
} from "@/lib/domain/ballot-audit";
import { compareAuditSnapshots, type AuditSnapshot } from "@/lib/domain/audit-tally";
import { Prisma } from "@prisma/client";

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
  if (!election.auditVersion || !election.auditKeyEncrypted) {
    return { success: false, error: "Legacy elections are read-only and cannot be opened" };
  }

  const check = canManuallyOpen(election.status, election.archivedAt);
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

  try {
    await closeElectionWithCertification(
      electionId,
      adminEmailFromSession(guard.session),
    );
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to certify and close election" };
  }
  revalidateAfterTransition(electionId);
  return { success: true };
}

export async function initiateRecount(electionId: string): Promise<ActionResult> {
  const guard = await requireCapabilityOrError("recounts:run");
  if (!guard.ok) return { success: false, error: permissionErrorMessage(guard.error) };
  const initiatedBy = adminEmailFromSession(guard.session);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Election" WHERE "id" = ${electionId} FOR UPDATE`;
      const election = await tx.election.findUnique({
        where: { id: electionId },
        select: {
          id: true,
          status: true,
          auditKeyEncrypted: true,
          certification: { select: { snapshot: true, snapshotHash: true, signature: true } },
        },
      });
      if (!election) throw new Error("Election not found");
      if (election.status !== "CLOSED") throw new Error("Recounts are available only after the election closes");
      if (!election.auditKeyEncrypted || !election.certification) {
        throw new Error("Legacy elections do not support cryptographic recounts");
      }

      const now = new Date();
      const { snapshot, auditKey } = await loadAuditSnapshot(
        tx,
        { id: election.id, auditKeyEncrypted: election.auditKeyEncrypted },
        now,
      );
      const official = election.certification.snapshot as unknown as AuditSnapshot;
      const discrepancies = compareAuditSnapshots(official, snapshot);
      if (hashSnapshot(official) !== election.certification.snapshotHash) {
        discrepancies.unshift("Official snapshot hash failed verification");
      }
      if (!verifySnapshotSignature(auditKey, official, election.certification.signature)) {
        discrepancies.unshift("Official snapshot signature failed verification");
      }
      const snapshotHash = hashSnapshot(snapshot);
      await tx.recount.create({
        data: {
          electionId,
          snapshot: snapshot as unknown as Prisma.InputJsonValue,
          snapshotHash,
          signature: signSnapshot(auditKey, snapshot),
          baselineHash: election.certification.snapshotHash,
          ballotCount: snapshot.ballots.total,
          validBallots: snapshot.ballots.valid,
          invalidBallots: snapshot.ballots.invalid,
          matchesOfficial: discrepancies.length === 0,
          discrepancies: discrepancies as Prisma.InputJsonValue,
          initiatedBy,
          createdAt: now,
        },
      });
      await tx.auditLog.create({
        data: {
          electionId,
          action: discrepancies.length === 0 ? "Recount completed: matched official tally" : `Recount completed: ${discrepancies.length} discrepancy(s)`,
          toStatus: null,
          adminEmail: initiatedBy,
        },
      });
    });
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Recount failed" };
  }
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

  const check = canReschedule(election.status, openDate, closeDate, election.archivedAt);
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

  const check = canAdvanceToScheduled(election.status, election.scheduledOpen, election.archivedAt);
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
