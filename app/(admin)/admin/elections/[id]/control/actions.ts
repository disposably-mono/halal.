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
import {
  auditedAction,
  TransitionValidationError,
  type ActionResult,
} from "@/lib/server/audited-action";

const fmtDate = (d: Date | null) =>
  d?.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }) ?? "—";

function revalidateAfterTransition(electionId: string) {
  revalidateAdminDashboard();
  revalidateElectionControl(electionId);
}

const runOpenElectionNow = auditedAction<[electionId: string]>({
  name: "openElectionNow",
  capability: "election:lifecycle",
  errorMessage: "Failed to open election",
  run: async (tx, session, electionId) => {
    await tx.$queryRaw`SELECT "id" FROM "Election" WHERE "id" = ${electionId} FOR UPDATE`;
    const election = await tx.election.findUnique({ where: { id: electionId } });
    if (!election) throw new TransitionValidationError("Election not found");
    if (!election.auditVersion || !election.auditKeyEncrypted) {
      throw new TransitionValidationError("Legacy elections are read-only and cannot be opened");
    }

    const check = canManuallyOpen(election.status, election.archivedAt);
    if (!check.ok) throw new TransitionValidationError(check.reason);

    const adminEmail = adminEmailFromSession(session);
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
  },
});

export async function openElectionNow(electionId: string): Promise<ActionResult> {
  const result = await runOpenElectionNow(electionId);
  if (result.success) {
    // Broadcast the new lifecycle state so open monitors flip live (OPEN frame).
    void scheduleMonitorRefresh(electionId);
    revalidateAfterTransition(electionId);
  }
  return result;
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

const runInitiateRecount = auditedAction<[electionId: string]>({
  name: "initiateRecount",
  capability: "recounts:run",
  errorMessage: "Recount failed",
  run: async (tx, session, electionId) => {
    const initiatedBy = adminEmailFromSession(session);
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
    // Deliberately plain `Error` here, not `TransitionValidationError`: the
    // wrapper's generic-error path already returns the fixed "Recount failed"
    // message below, matching this action's pre-existing behavior of never
    // surfacing the specific reason to the admin UI.
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
  },
});

export async function initiateRecount(electionId: string): Promise<ActionResult> {
  const result = await runInitiateRecount(electionId);
  if (result.success) revalidateAfterTransition(electionId);
  return result;
}

const runRescheduleElection = auditedAction<
  [electionId: string, openDate: Date | null, closeDate: Date | null]
>({
  name: "rescheduleElection",
  capability: "election:lifecycle",
  errorMessage: "Failed to reschedule election",
  run: async (tx, session, electionId, openDate, closeDate) => {
    await tx.$queryRaw`SELECT "id" FROM "Election" WHERE "id" = ${electionId} FOR UPDATE`;
    const election = await tx.election.findUnique({ where: { id: electionId } });
    if (!election) throw new TransitionValidationError("Election not found");

    const check = canReschedule(election.status, openDate, closeDate, election.archivedAt);
    if (!check.ok) throw new TransitionValidationError(check.reason);

    const adminEmail = adminEmailFromSession(session);
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
  },
});

export async function rescheduleElection(
  electionId: string,
  scheduledOpen: string | null,
  scheduledClose: string | null,
): Promise<ActionResult> {
  const openDate = scheduledOpen ? new Date(scheduledOpen) : null;
  const closeDate = scheduledClose ? new Date(scheduledClose) : null;

  const result = await runRescheduleElection(electionId, openDate, closeDate);
  if (result.success) revalidateAfterTransition(electionId);
  return result;
}

const runAdvanceToScheduled = auditedAction<[electionId: string]>({
  name: "advanceToScheduled",
  capability: "election:lifecycle",
  errorMessage: "Failed to advance election to scheduled",
  run: async (tx, session, electionId) => {
    await tx.$queryRaw`SELECT "id" FROM "Election" WHERE "id" = ${electionId} FOR UPDATE`;
    const election = await tx.election.findUnique({ where: { id: electionId } });
    if (!election) throw new TransitionValidationError("Election not found");

    const check = canAdvanceToScheduled(election.status, election.scheduledOpen, election.archivedAt);
    if (!check.ok) throw new TransitionValidationError(check.reason);

    const adminEmail = adminEmailFromSession(session);
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
  },
});

export async function advanceToScheduled(electionId: string): Promise<ActionResult> {
  const result = await runAdvanceToScheduled(electionId);
  if (result.success) revalidateAfterTransition(electionId);
  return result;
}
