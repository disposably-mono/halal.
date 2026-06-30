import { headers } from "next/headers";

/**
 * Lightweight in-memory fixed-window rate limiter for credential and voting
 * entry points (admin login, officer-key unlock, voter code validation).
 *
 * Scope & caveats:
 *  - State lives in this process's memory. The app runs as a single Next.js
 *    instance (Docker), so one shared counter is sufficient. If this is ever
 *    scaled to multiple instances, swap the `buckets` Map for a shared store
 *    (e.g. Redis) — the public API here is intentionally tiny to make that easy.
 *  - Fixed-window (not sliding) keeps it allocation-free and predictable; the
 *    worst case is up to 2× `limit` across a window boundary, which is fine for
 *    brute-force / enumeration throttling.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Bound memory: distinct keys (per-IP, per-studentId) are purged once expired,
// and we hard-cap total buckets so a flood of unique keys can't grow unbounded.
const MAX_BUCKETS = 10_000;

export interface RateLimitOptions {
  /** Max allowed hits within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  /** Milliseconds until the window resets (0 when allowed). */
  retryAfterMs: number;
  /** Hits remaining in the current window (0 when blocked). */
  remaining: number;
}

/**
 * Records a hit against `key` and reports whether it is within the limit.
 * Exported for direct/unit use; most callers go through the helpers below.
 */
export function rateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
  now: number = Date.now(),
): RateLimitResult {
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    pruneIfNeeded(now);
    return { ok: true, retryAfterMs: 0, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return { ok: false, retryAfterMs: existing.resetAt - now, remaining: 0 };
  }

  existing.count += 1;
  return { ok: true, retryAfterMs: 0, remaining: limit - existing.count };
}

function pruneIfNeeded(now: number): void {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of Array.from(buckets.entries())) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  // If still over the cap (all live), drop the oldest-inserted keys.
  if (buckets.size >= MAX_BUCKETS) {
    const overflow = buckets.size - MAX_BUCKETS + 1;
    let dropped = 0;
    for (const key of Array.from(buckets.keys())) {
      if (dropped++ >= overflow) break;
      buckets.delete(key);
    }
  }
}

/** Test-only: clear all counters between cases. */
export function __resetRateLimits(): void {
  buckets.clear();
}

/**
 * Best-effort client IP from proxy headers. `trustHost` is enabled, so requests
 * arrive through a proxy/tunnel that sets `x-forwarded-for`. Falls back to a
 * shared "unknown" bucket when no header is present (e.g. local dev).
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Per-entry-point limits. Tunable in one place.
 *
 * Voter validation is keyed by *studentId*, not IP, on purpose: an entire
 * computer lab or exam hall behind one campus NAT shares a single public IP, so
 * an IP-keyed limit would lock out legitimate voters on election day. Keying by
 * the account being attacked instead caps brute-forcing of one student's small
 * control-number space (only the `NNN` digits vary) without throttling the hall.
 */
export const RATE_LIMITS = {
  adminLogin: { limit: 10, windowMs: 5 * 60_000 },
  adminHelpUnlock: { limit: 10, windowMs: 5 * 60_000 },
  voterValidate: { limit: 12, windowMs: 10 * 60_000 },
} as const satisfies Record<string, RateLimitOptions>;
