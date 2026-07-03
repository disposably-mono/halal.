/**
 * Global concurrent-connection cap for the live monitor SSE stream
 * (`app/api/elections/[id]/monitor/stream/route.ts`).
 *
 * Each open stream holds a heartbeat `setInterval` and a `monitor-hub`
 * subscription for the lifetime of the connection. Without a ceiling, any
 * authenticated admin (or a leaked/looping tab) could open an unbounded
 * number of streams and slowly exhaust process resources. The realistic
 * admin headcount is single digits, so the cap here is deliberately generous
 * — it exists to bound a runaway client, not to police normal usage.
 *
 * Scope: a single Node process, matching the app's single-instance Docker
 * deployment (same assumption as `lib/server/monitor-hub.ts` and
 * `lib/server/rate-limit.ts`). State is parked on `globalThis` so Next.js dev
 * HMR doesn't reset the counter out from under live connections across
 * reloads. A multi-instance deployment would need a shared counter (e.g.
 * Redis `INCR`) instead.
 */

interface SseConnectionState {
  count: number;
}

const globalForSse = globalThis as unknown as { __sseConnections?: SseConnectionState };

const state: SseConnectionState =
  globalForSse.__sseConnections ?? (globalForSse.__sseConnections = { count: 0 });

/** Generous ceiling — realistic concurrent admin monitor tabs is single digits. */
export const MAX_SSE_CONNECTIONS = 100;

/**
 * Attempts to reserve a connection slot. Returns `false` (and reserves
 * nothing) once `MAX_SSE_CONNECTIONS` is already in use.
 */
export function tryAcquire(): boolean {
  if (state.count >= MAX_SSE_CONNECTIONS) return false;
  state.count += 1;
  return true;
}

/**
 * Releases a previously-acquired slot. Safe to call defensively — never goes
 * below zero — but callers should still only invoke it once per successful
 * `tryAcquire()` (the stream route's `cleanup()` is guarded to run at most
 * once for exactly this reason).
 */
export function release(): void {
  if (state.count <= 0) return;
  state.count -= 1;
}

/** Current number of reserved slots (diagnostics / tests). */
export function activeConnections(): number {
  return state.count;
}

/** Test-only: reset the counter between cases. */
export function __resetSseConnections(): void {
  state.count = 0;
}
