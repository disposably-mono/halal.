/**
 * Persistence layer for the admin live-monitor replay timeline.
 *
 * History is SERVER-OWNED: the only writer is `lib/server/monitor-broadcast.ts`,
 * driven by election-state changes (a ballot commit, a lifecycle transition) —
 * never by a browser observing results. This module persists the same anonymous
 * aggregate payload (candidate vote counts, abstention counts, turnout — never
 * voter-identifying data) that the live frame carries, so the replay timeline
 * survives a reload and is identical across every admin device.
 *
 * Design: one row per 30s "bucket" per election, so a busy election's history
 * stays bounded (a coarse sampled timeline) no matter how many votes land. The
 * `(electionId, bucket)` unique constraint dedupes: the first commit in a bucket
 * writes the row; later commits in the same bucket collide (P2002) and are
 * swallowed as a no-op. Unexpected DB failures bubble so the caller can log
 * them with election context, but the live frame between samples is still
 * delivered in real time over SSE — only the persisted history is coarsened.
 *
 * Pure helpers (`bucketFor`, `pruneCutoffIndex`) are exported and unit-tested;
 * the DB-touching functions are kept thin wrappers around them so there is
 * minimal untested logic.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { POLL_INTERVAL } from "@/app/(admin)/admin/elections/[id]/monitor/_components/monitor-shared";
import type { ResultsPayload } from "@/app/(admin)/admin/elections/[id]/monitor/_components/monitor-shared";

/** ~2 hours of history at one snapshot per POLL_INTERVAL (30s). Tunable. */
export const SNAPSHOT_RETENTION = 240;

/** Prune opportunistically rather than on every write — every 10th bucket. */
const PRUNE_EVERY_N_BUCKETS = 10;

/**
 * Maps a wall-clock instant to its 30s time bucket. Pure and deterministic:
 * any two calls within the same POLL_INTERVAL window return the same bucket,
 * which is what lets concurrent writes from different admin devices collide
 * on the same row instead of creating duplicates.
 */
export function bucketFor(epochMs: number): number {
  return Math.floor(epochMs / POLL_INTERVAL);
}

/**
 * Given capturedAt timestamps (ms epoch, any order) and a retention count,
 * returns the cutoff timestamp: rows strictly older than the cutoff should be
 * pruned. Returns `null` when there is nothing to prune (fewer rows than the
 * retention limit). Pure — the caller supplies the timestamps already loaded
 * from (or about to be loaded from) the DB.
 */
export function pruneCutoffIndex(
  capturedAtMs: readonly number[],
  retention: number,
): number | null {
  if (capturedAtMs.length <= retention) return null;
  const sortedDesc = [...capturedAtMs].sort((a, b) => b - a);
  // Keep the newest `retention` rows; the cutoff is the timestamp of the last
  // kept row — anything strictly older gets pruned.
  return sortedDesc[retention - 1];
}

/**
 * Records one monitor snapshot for `electionId`. No-ops silently when this
 * bucket was already written (P2002 unique violation on `(electionId, bucket)`
 * — the expected "another vote already sampled this 30s window" case). Any
 * other DB error is rethrown so the monitor broadcaster can log it with the
 * relevant election id while still keeping the live frame path non-fatal.
 */
export async function recordSnapshot(
  electionId: string,
  payload: ResultsPayload,
  now: Date = new Date(),
): Promise<void> {
  const bucket = bucketFor(now.getTime());

  try {
    await prisma.monitorSnapshot.create({
      data: {
        electionId,
        bucket,
        capturedAt: now,
        payload: payload as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // This 30s bucket was already sampled by an earlier commit — expected
      // under a stream of votes, not an error.
      return;
    }
    throw error;
  }

  if (bucket % PRUNE_EVERY_N_BUCKETS === 0) {
    await pruneOldSnapshots(electionId);
  }
}

/**
 * Opportunistic prune: deletes rows for the election beyond the newest
 * `SNAPSHOT_RETENTION`. Swallows errors the same way `recordSnapshot` does —
 * pruning is best-effort housekeeping, not part of the request's correctness.
 */
async function pruneOldSnapshots(electionId: string): Promise<void> {
  try {
    const rows = await prisma.monitorSnapshot.findMany({
      where: { electionId },
      select: { capturedAt: true },
      orderBy: { capturedAt: "desc" },
    });
    const cutoff = pruneCutoffIndex(
      rows.map((r) => r.capturedAt.getTime()),
      SNAPSHOT_RETENTION,
    );
    if (cutoff === null) return;

    await prisma.monitorSnapshot.deleteMany({
      where: { electionId, capturedAt: { lt: new Date(cutoff) } },
    });
  } catch (error) {
    console.error(`monitor-snapshots: failed to prune old snapshots for election ${electionId}`, error);
  }
}

/**
 * Loads stored snapshots for an election, ascending by capture time (oldest
 * first — matches the shape the replay timeline expects), capped at the
 * newest `limit` rows.
 */
export async function loadSnapshots(
  electionId: string,
  limit: number = SNAPSHOT_RETENTION,
): Promise<{ capturedAt: Date; payload: ResultsPayload }[]> {
  const rows = await prisma.monitorSnapshot.findMany({
    where: { electionId },
    select: { capturedAt: true, payload: true },
    orderBy: { capturedAt: "desc" },
    take: limit,
  });

  return rows
    .map((row) => ({
      capturedAt: row.capturedAt,
      payload: row.payload as unknown as ResultsPayload,
    }))
    .reverse();
}
