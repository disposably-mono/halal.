import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetRateLimits,
  rateLimit,
  type RateLimitOptions,
} from "@/lib/server/rate-limit";

const OPTS: RateLimitOptions = { limit: 3, windowMs: 1000 };

beforeEach(() => {
  __resetRateLimits();
});

describe("rateLimit", () => {
  it("allows hits up to the limit, then blocks within the window", () => {
    const now = 0;
    expect(rateLimit("k", OPTS, now)).toMatchObject({ ok: true, remaining: 2 });
    expect(rateLimit("k", OPTS, now)).toMatchObject({ ok: true, remaining: 1 });
    expect(rateLimit("k", OPTS, now)).toMatchObject({ ok: true, remaining: 0 });

    const blocked = rateLimit("k", OPTS, now);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterMs).toBe(1000);
    expect(blocked.remaining).toBe(0);
  });

  it("resets once the window elapses", () => {
    rateLimit("k", OPTS, 0);
    rateLimit("k", OPTS, 0);
    rateLimit("k", OPTS, 0);
    expect(rateLimit("k", OPTS, 0).ok).toBe(false);

    // At/after resetAt the bucket is reissued.
    expect(rateLimit("k", OPTS, 1000)).toMatchObject({ ok: true, remaining: 2 });
  });

  it("tracks distinct keys independently", () => {
    rateLimit("a", OPTS, 0);
    rateLimit("a", OPTS, 0);
    rateLimit("a", OPTS, 0);
    expect(rateLimit("a", OPTS, 0).ok).toBe(false);

    // A different key (e.g. a different student or IP) is unaffected.
    expect(rateLimit("b", OPTS, 0).ok).toBe(true);
  });
});

describe("rateLimit eviction under MAX_BUCKETS", () => {
  // MAX_BUCKETS is an internal constant (10_000), mirrored here so the test
  // doesn't need to export it. If the module's cap ever changes, update this.
  const MAX_BUCKETS = 10_000;

  it("never evicts a blocked, unexpired bucket even when flooded with new unique keys", () => {
    const now = 0;
    // Drive one key to blocked (at its limit) — this is the bucket an
    // attacker would want to force-reset, e.g. admin-login:<ip>.
    const victimOpts: RateLimitOptions = { limit: 3, windowMs: 60_000 };
    rateLimit("victim", victimOpts, now);
    rateLimit("victim", victimOpts, now);
    rateLimit("victim", victimOpts, now);
    expect(rateLimit("victim", victimOpts, now).ok).toBe(false);

    // Flood past MAX_BUCKETS with fresh, non-blocked, attacker-controlled
    // keys (e.g. fabricated studentIds) to force pruneIfNeeded to run.
    const floodOpts: RateLimitOptions = { limit: 100, windowMs: 60_000 };
    for (let i = 0; i < MAX_BUCKETS + 500; i++) {
      rateLimit(`flood-${i}`, floodOpts, now);
    }

    // The victim bucket must still be blocked — it was never evicted.
    expect(rateLimit("victim", victimOpts, now).ok).toBe(false);
  });

  it("prunes expired buckets before evicting anything else", () => {
    const now = 0;
    const shortOpts: RateLimitOptions = { limit: 5, windowMs: 10 };
    // Fill up to the cap with buckets that will have expired by `later`.
    for (let i = 0; i < MAX_BUCKETS; i++) {
      rateLimit(`expiring-${i}`, shortOpts, now);
    }

    const later = now + 1000; // well past the 10ms window for all of them
    // A single new key at `later` should trigger pruneIfNeeded, which drops
    // all expired buckets first — no non-expired eviction should be needed.
    const result = rateLimit("fresh", shortOpts, later);
    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(shortOpts.limit - 1);

    // A previously-expired key is treated as a brand-new bucket, not evicted.
    const reissued = rateLimit("expiring-0", shortOpts, later);
    expect(reissued.ok).toBe(true);
    expect(reissued.remaining).toBe(shortOpts.limit - 1);
  });

  it("evicts oldest-inserted non-blocked keys when over cap with no expired entries", () => {
    const now = 0;
    const longOpts: RateLimitOptions = { limit: 100, windowMs: 60_000 };
    // Fill to MAX_BUCKETS with long-lived, non-blocked buckets in insertion order.
    for (let i = 0; i < MAX_BUCKETS; i++) {
      rateLimit(`old-${i}`, longOpts, now);
    }

    // One more unique key pushes past the cap; nothing has expired, so the
    // oldest-inserted (non-blocked) key(s) must be evicted to make room.
    rateLimit("newcomer", longOpts, now);

    // The very first-inserted key should have been evicted and therefore
    // reissued fresh (remaining = limit - 1) rather than continuing its old count.
    const oldest = rateLimit("old-0", longOpts, now);
    expect(oldest.ok).toBe(true);
    expect(oldest.remaining).toBe(longOpts.limit - 1);
  });
});
