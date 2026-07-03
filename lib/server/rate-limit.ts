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
 *  - Eviction under the `MAX_BUCKETS` cap never removes a bucket that is BOTH
 *    unexpired AND currently blocked (`count >= limit`). Some limiters key on
 *    attacker-controlled values (e.g. voter validation keys by studentId, which
 *    is only regex-validated), so an attacker can flood ~10k fabricated keys to
 *    force eviction. If eviction were indiscriminate, that flood could evict a
 *    live, mid-count `admin-login:<ip>` bucket and reset the admin brute-force
 *    throttle at will. Protecting blocked buckets means the map can temporarily
 *    exceed `MAX_BUCKETS` in the pathological case where >10k keys are all
 *    simultaneously blocked — accepted, because driving a single key to
 *    "blocked" costs the attacker a full limit's worth of requests, which is
 *    far more expensive than minting a fresh unique key.
 */

interface Bucket {
  count: number;
  resetAt: number;
  /** The limit this bucket was created under; used by `pruneIfNeeded` to tell
   *  whether it is currently blocked (`count >= limit`) and therefore must not
   *  be evicted while still live. */
  limit: number;
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
    buckets.set(key, { count: 1, resetAt: now + windowMs, limit });
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

  // 1. Expired buckets first — always safe to drop regardless of state.
  for (const [key, bucket] of Array.from(buckets.entries())) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }

  // 2. Still over the cap: drop oldest-inserted keys, but only ones that are
  //    NOT currently blocked. A blocked bucket (count >= limit) is actively
  //    throttling something — e.g. a brute-forced admin-login IP or officer
  //    key — and evicting it would hand the attacker a free reset. See the
  //    header comment for the full threat model and the accepted tradeoff
  //    (the map may exceed MAX_BUCKETS while >10k keys are all blocked).
  if (buckets.size >= MAX_BUCKETS) {
    const overflow = buckets.size - MAX_BUCKETS + 1;
    let dropped = 0;
    for (const [key, bucket] of Array.from(buckets.entries())) {
      if (dropped >= overflow) break;
      if (bucket.count >= bucket.limit) continue;
      buckets.delete(key);
      dropped++;
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
 *
 * SECURITY / DEPLOYMENT REQUIREMENT: `x-forwarded-for` (and `x-real-ip`) are
 * client-supplied and trivially spoofable. This function trusts the first hop of
 * `x-forwarded-for` verbatim, so a header-sanitizing reverse proxy that
 * *overwrites* (not appends to) these headers with the real peer address is a
 * hard deployment requirement. WITHOUT such a proxy, per-IP limits are fully
 * bypassable — an attacker rotates the header to a new value per request and
 * never shares a bucket. Note that the most sensitive limit (voter validation)
 * is keyed by studentId, not IP, so it is unaffected; the IP-keyed limits
 * (admin login, officer-key unlock) are the ones that degrade without a proxy.
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
  // Receipt verification is keyed by IP (unauthenticated, no per-account
  // identity to key on). Legitimate voters check receipts from a shared
  // campus NAT on election day, so this must stay generous — it exists to
  // blunt cheap DoS hammering of the DB lookup, not to tightly cap attempts.
  // The receipt code itself is a 160-bit random value, so brute-forcing it
  // within any plausible rate limit is already infeasible; this limit only
  // needs to stop a single client from burning CPU/DB with rapid-fire junk.
  receiptVerify: { limit: 60, windowMs: 10 * 60_000 },
} as const satisfies Record<string, RateLimitOptions>;
