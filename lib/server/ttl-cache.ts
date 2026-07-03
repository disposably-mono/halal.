/**
 * Tiny in-process TTL cache with single-flight (request coalescing).
 *
 * Purpose: the public results page and admin monitor poll the same tally every
 * 30s, so many viewers trigger identical, expensive vote scans at nearly the
 * same instant. This cache collapses that into one computation per short TTL
 * window, and — critically — single-flight ensures that when the entry is cold
 * and N requests miss simultaneously, only ONE runs the producer while the rest
 * await its promise. Without that, a burst of pollers would each open a DB query
 * and exhaust the connection pool (the documented election-day risk).
 *
 * Single-instance scope, same as the rate limiter: state is per-process, which
 * matches the single Docker deployment. Multi-instance would want a shared cache
 * (e.g. Redis); the API is intentionally minimal so that swap is easy.
 */

interface Entry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

/**
 * Returns the cached value for `key` if still fresh; otherwise runs `producer`,
 * caches the result for `ttlMs`, and returns it. Concurrent misses for the same
 * key share a single `producer` invocation.
 *
 * `now` is injectable for deterministic tests.
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  producer: () => Promise<T>,
  now: () => number = Date.now,
): Promise<T> {
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expiresAt > now()) {
    return hit.value;
  }

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const run = (async () => {
    try {
      const value = await producer();
      store.set(key, { value, expiresAt: now() + ttlMs });
      return value;
    } finally {
      // Always clear the in-flight marker, success or failure, so a failed
      // producer doesn't wedge the key permanently.
      inflight.delete(key);
    }
  })();

  inflight.set(key, run);
  return run;
}

/** Drop a single cached entry (e.g. after a known mutation). */
export function invalidate(key: string): void {
  store.delete(key);
}

/**
 * True when `key` currently has a fresh (unexpired) entry — a cache hit if
 * `cached()` were called now. Does not touch in-flight state.
 */
export function peek(key: string, now: () => number = Date.now): boolean {
  const hit = store.get(key);
  return !!hit && hit.expiresAt > now();
}

/** Test-only: clear all cached state between cases. */
export function __resetCache(): void {
  store.clear();
  inflight.clear();
}
