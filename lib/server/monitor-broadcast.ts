/**
 * Write-driven monitor engine: the server's response to an election-state
 * change (a vote committing, a lifecycle transition).
 *
 * On each change we:
 *   1. compute the latest aggregate ONCE (`computeAdminMonitorPayload`),
 *   2. persist a coarse replay snapshot (bucketed, so history stays bounded),
 *   3. broadcast the frame to every connected monitor via the hub.
 *
 * Nothing here runs on the read path — viewing the monitor never mutates the
 * database. Callers invoke `scheduleMonitorRefresh` fire-and-forget
 * (`void scheduleMonitorRefresh(id)`); it never throws, so a monitor hiccup can
 * never fail a voter's ballot submission or an admin lifecycle action.
 *
 * Coalescing: a burst of votes must not trigger a burst of tally scans. Per
 * election we keep at most one compute in flight; triggers that arrive while a
 * compute is running collapse into a single trailing recompute. Sustained load
 * therefore serialises into back-to-back computes (one at a time) rather than
 * N concurrent scans hammering the connection pool.
 */

import { computeAdminMonitorPayload } from "@/lib/server/results-aggregate";
import { recordSnapshot } from "@/lib/server/monitor-snapshots";
import { publish } from "@/lib/server/monitor-hub";

interface RefreshState {
  running: boolean;
  pending: boolean;
}

const MONITOR_COMPUTE_TIMEOUT_MS = 15_000;

const globalForBroadcast = globalThis as unknown as {
  __monitorRefresh?: Map<string, RefreshState>;
};

const refreshStates: Map<string, RefreshState> =
  globalForBroadcast.__monitorRefresh ??
  (globalForBroadcast.__monitorRefresh = new Map());

async function computeAndBroadcast(electionId: string): Promise<void> {
  const payload = await withTimeout(
    computeAdminMonitorPayload(electionId),
    MONITOR_COMPUTE_TIMEOUT_MS,
    `monitor compute timed out for election ${electionId}`,
  );
  if (!payload) return; // election was deleted mid-flight
  // Persist first (bucket-deduped, bounded history), then broadcast. Snapshot
  // persistence is best-effort: if it fails, log it with election context and
  // keep the live frame flowing so voting/admin actions stay non-fatal.
  try {
    await recordSnapshot(electionId, payload);
  } catch (error) {
    console.error(`monitor-broadcast: snapshot failed for election ${electionId}`, error);
  }
  publish(electionId, payload);
}

/**
 * Requests a recompute + broadcast for an election. Safe to call fire-and-forget
 * from any state-changing path; coalesces concurrent calls per election and
 * never rejects.
 */
export async function scheduleMonitorRefresh(electionId: string): Promise<void> {
  const state = refreshStates.get(electionId) ?? { running: false, pending: false };
  refreshStates.set(electionId, state);

  if (state.running) {
    // A compute is already in flight — fold this trigger into a single trailing
    // recompute so late votes are reflected without stacking scans.
    state.pending = true;
    return;
  }

  state.running = true;
  try {
    do {
      state.pending = false;
      try {
        await computeAndBroadcast(electionId);
      } catch (error) {
        // Never propagate into the caller's request path.
        console.error(`monitor-broadcast: refresh failed for election ${electionId}`, error);
      }
    } while (state.pending);
  } finally {
    state.running = false;
    if (!state.pending) refreshStates.delete(electionId);
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<T>((_resolve, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId !== null) clearTimeout(timeoutId);
  }
}
