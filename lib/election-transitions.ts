/**
 * lib/election-transitions.ts
 *
 * Shared logic for auto-transitioning elections based on scheduled times.
 * Called by the cron route handler and optionally on admin page load.
 *
 * Handles catch-up: if the server was offline during a scheduled window,
 * the next invocation will still apply the correct final state.
 */

import { prisma } from "@/lib/prisma";
import { closeElectionWithCertification } from "@/lib/server/close-election";

export type TransitionSummary = {
  opened: string[]; // IDs flipped SCHEDULED → OPEN
  closed: string[]; // IDs flipped OPEN → CLOSED  (or SCHEDULED → CLOSED on miss)
};

export async function applyScheduledTransitions(): Promise<TransitionSummary> {
  const now = new Date();

  // ── 1. SCHEDULED → OPEN ───────────────────────────────────────────────────
  //   scheduledOpen  <= now  (window has started)
  //   scheduledClose >  now  (window has not ended yet)
  //   both finalized flags must be true — safety guard
  const toOpen = await prisma.election.findMany({
    where: {
      status: "SCHEDULED",
      archivedAt: null,
      candidatesFinalized: true,
      votersFinalized: true,
      auditVersion: { not: null },
      scheduledOpen: { lte: now },
      scheduledClose: { gt: now },
    },
    select: { id: true },
  });

  // Flip status and record an audit entry per election, one row-locked
  // transaction at a time — mirrors closeElectionWithCertification's
  // SELECT ... FOR UPDATE + recheck pattern so a double-fired cron (network
  // retry, overlapping schedules, etc.) can't double-process the same
  // election or write duplicate audit entries.
  const openedIds: string[] = [];
  for (const { id } of toOpen) {
    const opened = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Election" WHERE "id" = ${id} FOR UPDATE`;
      const election = await tx.election.findUnique({
        where: { id },
        select: { status: true },
      });
      if (!election || election.status !== "SCHEDULED") return false;

      await tx.election.update({ where: { id }, data: { status: "OPEN" } });
      await tx.auditLog.create({
        data: {
          electionId: id,
          action: "Automatically opened election (scheduled)",
          toStatus: "OPEN",
          adminEmail: "scheduler",
        },
      });
      return true;
    });
    if (opened) openedIds.push(id);
  }

  // ── 2. OPEN → CLOSED ──────────────────────────────────────────────────────
  //   scheduledClose <= now
  const toClose = await prisma.election.findMany({
    where: {
      status: "OPEN",
      archivedAt: null,
      scheduledClose: { lte: now },
    },
    select: { id: true },
  });

  const closedIds: string[] = [];
  for (const election of toClose) {
    try {
      await closeElectionWithCertification(election.id, "scheduler", ["OPEN"]);
      closedIds.push(election.id);
    } catch (err) {
      // One election losing a status-recheck race (e.g. a concurrent cron
      // invocation) must not abort the rest of the batch — it'll self-heal
      // on the next cron pass, so just log and move on to the next election.
      console.error(
        `[election-transitions] failed to close election ${election.id} (OPEN→CLOSED):`,
        err,
      );
    }
  }

  // ── 3. SCHEDULED → CLOSED (missed entire window while server was down) ────
  //   scheduledOpen  <= now  (window started but was never caught by step 1)
  //   scheduledClose <= now  (window already ended)
  //   still in SCHEDULED (never got to OPEN)
  const missedWindow = await prisma.election.findMany({
    where: {
      status: "SCHEDULED",
      archivedAt: null,
      scheduledOpen: { lte: now },
      scheduledClose: { lte: now },
    },
    select: { id: true },
  });

  const missedClosedIds: string[] = [];
  for (const election of missedWindow) {
    try {
      await closeElectionWithCertification(
        election.id,
        "scheduler",
        ["SCHEDULED"],
        "Closed without opening — scheduled window missed during downtime",
      );
      missedClosedIds.push(election.id);
    } catch (err) {
      console.error(
        `[election-transitions] failed to close election ${election.id} (SCHEDULED→CLOSED, missed window):`,
        err,
      );
    }
  }

  return {
    opened: openedIds,
    closed: [...closedIds, ...missedClosedIds],
  };
}
