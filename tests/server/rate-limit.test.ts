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
