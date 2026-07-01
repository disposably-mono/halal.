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
      candidatesFinalized: true,
      votersFinalized: true,
      auditVersion: { not: null },
      scheduledOpen: { lte: now },
      scheduledClose: { gt: now },
    },
    select: { id: true },
  });

  if (toOpen.length > 0) {
    const openedIds = toOpen.map((e) => e.id);
    // Flip status and record an audit entry per election in one transaction, so
    // a scheduled open is attributable (who="scheduler", when=now) the same way
    // the close path attributes automatic closes. Mirrors the manual-open audit
    // write in the control actions.
    await prisma.$transaction([
      prisma.election.updateMany({
        where: { id: { in: openedIds } },
        data: { status: "OPEN" },
      }),
      prisma.auditLog.createMany({
        data: openedIds.map((electionId) => ({
          electionId,
          action: "Automatically opened election (scheduled)",
          toStatus: "OPEN",
          adminEmail: "scheduler",
        })),
      }),
    ]);
  }

  // ── 2. OPEN → CLOSED ──────────────────────────────────────────────────────
  //   scheduledClose <= now
  const toClose = await prisma.election.findMany({
    where: {
      status: "OPEN",
      scheduledClose: { lte: now },
    },
    select: { id: true },
  });

  for (const election of toClose) {
    await closeElectionWithCertification(election.id, "scheduler", ["OPEN"]);
  }

  // ── 3. SCHEDULED → CLOSED (missed entire window while server was down) ────
  //   scheduledOpen  <= now  (window started but was never caught by step 1)
  //   scheduledClose <= now  (window already ended)
  //   still in SCHEDULED (never got to OPEN)
  const missedWindow = await prisma.election.findMany({
    where: {
      status: "SCHEDULED",
      scheduledOpen: { lte: now },
      scheduledClose: { lte: now },
    },
    select: { id: true },
  });

  for (const election of missedWindow) {
    await closeElectionWithCertification(election.id, "scheduler", ["SCHEDULED"]);
  }

  return {
    opened: toOpen.map((e) => e.id),
    closed: [
      ...toClose.map((e) => e.id),
      ...missedWindow.map((e) => e.id),
    ],
  };
}
