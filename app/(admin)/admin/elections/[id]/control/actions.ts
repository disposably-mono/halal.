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
import { scheduleMonitorRefresh } from "@/lib/server/monitor-broadcast";
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

/**
 * Thrown for expected validation failures inside a locked transaction so the
 * caller can surface `error.message` verbatim to the admin UI, while any other
 * (unexpected) error is logged and reported generically.
 */
class TransitionValidationError extends Error {}

export async function openElectionNow(electionId: string): Promise<ActionResult> {
  const guard = await requireCapabilityOrError("election:lifecycle");
  if (!guard.ok) return { success: false, error: permissionErrorMessage(guard.error) };
  const adminEmail = adminEmailFromSession(guard.session);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Election" WHERE "id" = ${electionId} FOR UPDATE`;
      const election = await tx.election.findUnique({ where: { id: electionId } });
      if (!election) throw new TransitionValidationError("Election not found");
      if (!election.auditVersion || !election.auditKeyEncrypted) {
        throw new TransitionValidationError("Legacy elections are read-only and cannot be opened");
      }

      const check = canManuallyOpen(election.status, election.archivedAt);
      if (!check.ok) throw new TransitionValidationError(check.reason);

      await tx.election.update({
        where: { id: electionId },
        data: { status: ElectionStatus.OPEN },
      });
      await tx.auditLog.create({
        data: {
          electionId,
          action: "Manually opened election (override)",
          toStatus: ElectionStatus.OPEN,
          adminEmail,
        },
      });
    });
  } catch (error) {
    if (error instanceof TransitionValidationError) return { success: false, error: error.message };
    console.error("[openElectionNow] transition failed:", error);
    return { success: false, error: "Failed to open election" };
  }
  // Broadcast the new lifecycle state so open monitors flip live (OPEN frame).
  void scheduleMonitorRefresh(electionId);
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
    console.error("[closeElectionNow] certification failed:", error);
    return { success: false, error: "Failed to certify and close election" };
  }
  // Broadcast the CLOSED frame so any monitor still open reflects the freeze.
  void scheduleMonitorRefresh(electionId);
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
    console.error("[initiateRecount] recount failed:", error);
    return { success: false, error: "Recount failed" };
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
  const adminEmail = adminEmailFromSession(guard.session);

  const openDate = scheduledOpen ? new Date(scheduledOpen) : null;
  const closeDate = scheduledClose ? new Date(scheduledClose) : null;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Election" WHERE "id" = ${electionId} FOR UPDATE`;
      const election = await tx.election.findUnique({ where: { id: electionId } });
      if (!election) throw new TransitionValidationError("Election not found");

      const check = canReschedule(election.status, openDate, closeDate, election.archivedAt);
      if (!check.ok) throw new TransitionValidationError(check.reason);

      await tx.election.update({
        where: { id: electionId },
        data: {
          scheduledOpen: openDate,
          scheduledClose: closeDate,
          status: nextStatusForReschedule(election.status, openDate),
        },
      });
      await tx.auditLog.create({
        data: {
          electionId,
          action: `Schedule overridden: ${fmtDate(openDate)} – ${fmtDate(closeDate)}`,
          toStatus: null,
          adminEmail,
        },
      });
    });
  } catch (error) {
    if (error instanceof TransitionValidationError) return { success: false, error: error.message };
    console.error("[rescheduleElection] transition failed:", error);
    return { success: false, error: "Failed to reschedule election" };
  }
  revalidateAfterTransition(electionId);
  return { success: true };
}

export async function advanceToScheduled(electionId: string): Promise<ActionResult> {
  const guard = await requireCapabilityOrError("election:lifecycle");
  if (!guard.ok) return { success: false, error: permissionErrorMessage(guard.error) };
  const adminEmail = adminEmailFromSession(guard.session);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Election" WHERE "id" = ${electionId} FOR UPDATE`;
      const election = await tx.election.findUnique({ where: { id: electionId } });
      if (!election) throw new TransitionValidationError("Election not found");

      const check = canAdvanceToScheduled(election.status, election.scheduledOpen, election.archivedAt);
      if (!check.ok) throw new TransitionValidationError(check.reason);

      await tx.election.update({
        where: { id: electionId },
        data: { status: ElectionStatus.SCHEDULED },
      });
      await tx.auditLog.create({
        data: {
          electionId,
          action: "Advanced to Scheduled",
          toStatus: ElectionStatus.SCHEDULED,
          adminEmail,
        },
      });
    });
  } catch (error) {
    if (error instanceof TransitionValidationError) return { success: false, error: error.message };
    console.error("[advanceToScheduled] transition failed:", error);
    return { success: false, error: "Failed to advance election to scheduled" };
  }
  revalidateAfterTransition(electionId);
  return { success: true };
}
