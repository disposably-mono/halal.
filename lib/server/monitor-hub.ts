/**
 * In-process fan-out hub for live monitor frames.
 *
 * The server computes an election's tally once when its state changes (a vote
 * commits, or the lifecycle advances) and publishes the resulting frame here;
 * every connected Server-Sent-Events stream for that election is a subscriber
 * and receives the same object. This is the "compute once, broadcast to N"
 * primitive — the tally is never recomputed per connected browser.
 *
 * Scope: a single Node process, which matches the app's single-instance Docker
 * deployment (same assumption as `lib/server/rate-limit.ts` and the TTL cache).
 * A multi-instance deployment would swap this module's internals for a shared
 * bus (Redis pub/sub, Postgres LISTEN/NOTIFY) without changing callers — the
 * publish/subscribe surface is intentionally tiny. State is parked on
 * `globalThis` so Next.js dev HMR doesn't orphan subscribers across reloads.
 */

import type { ResultsPayload } from "@/app/(admin)/admin/elections/[id]/monitor/_components/monitor-shared";

type Subscriber = (payload: ResultsPayload) => void;

interface HubState {
  subscribers: Map<string, Set<Subscriber>>;
  /** Last frame published per election, replayed to late-joining subscribers. */
  latest: Map<string, ResultsPayload>;
}

const globalForHub = globalThis as unknown as { __monitorHub?: HubState };

const hub: HubState =
  globalForHub.__monitorHub ??
  (globalForHub.__monitorHub = {
    subscribers: new Map(),
    latest: new Map(),
  });

/**
 * Registers a subscriber for an election's frames. Returns an unsubscribe
 * function; the last empty subscriber set is cleaned up so idle elections do
 * not leak Map entries.
 */
export function subscribe(electionId: string, cb: Subscriber): () => void {
  let set = hub.subscribers.get(electionId);
  if (!set) {
    set = new Set();
    hub.subscribers.set(electionId, set);
  }
  set.add(cb);

  return () => {
    const current = hub.subscribers.get(electionId);
    if (!current) return;
    current.delete(cb);
    if (current.size === 0) hub.subscribers.delete(electionId);
  };
}

/**
 * Publishes a frame to every subscriber and caches it as the election's latest.
 * A throwing subscriber can never take down the publisher (or its siblings).
 */
export function publish(electionId: string, payload: ResultsPayload): void {
  hub.latest.set(electionId, payload);
  const set = hub.subscribers.get(electionId);
  if (!set) return;
  // Snapshot to an array first so a subscriber that unsubscribes itself during
  // its callback can't mutate the set mid-iteration.
  for (const cb of Array.from(set)) {
    try {
      cb(payload);
    } catch (error) {
      console.error("monitor-hub: subscriber threw", error);
    }
  }
}

/** The last frame published for an election, if any (for late joiners). */
export function getLatest(electionId: string): ResultsPayload | undefined {
  return hub.latest.get(electionId);
}

/** Number of live subscribers for an election (diagnostics / tests). */
export function subscriberCount(electionId: string): number {
  return hub.subscribers.get(electionId)?.size ?? 0;
}
