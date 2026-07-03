import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetCache, cached, invalidate, peek } from "@/lib/server/ttl-cache";

beforeEach(() => {
  __resetCache();
});

describe("cached", () => {
  it("runs the producer once within the TTL window", async () => {
    const producer = vi.fn(async () => "v1");
    let clock = 1000;
    const now = () => clock;

    expect(await cached("k", 100, producer, now)).toBe("v1");
    clock = 1050; // still inside TTL
    expect(await cached("k", 100, producer, now)).toBe("v1");

    expect(producer).toHaveBeenCalledTimes(1);
  });

  it("re-runs the producer once the TTL expires", async () => {
    let value = 1;
    const producer = vi.fn(async () => value++);
    let clock = 0;
    const now = () => clock;

    expect(await cached("k", 100, producer, now)).toBe(1);
    clock = 100; // expiresAt was 100, and `expiresAt > now` is false at exactly 100
    expect(await cached("k", 100, producer, now)).toBe(2);
    expect(producer).toHaveBeenCalledTimes(2);
  });

  it("coalesces concurrent misses into a single producer call (single-flight)", async () => {
    let resolve!: (v: string) => void;
    const gate = new Promise<string>((r) => {
      resolve = r;
    });
    const producer = vi.fn(() => gate);

    // Fire many concurrent misses before the producer resolves.
    const inflight = Promise.all(
      Array.from({ length: 50 }, () => cached("k", 1000, producer)),
    );
    resolve("shared");

    const results = await inflight;
    expect(results.every((r) => r === "shared")).toBe(true);
    expect(producer).toHaveBeenCalledTimes(1);
  });

  it("does not wedge a key after the producer rejects", async () => {
    const failing = vi.fn(async () => {
      throw new Error("boom");
    });
    await expect(cached("k", 1000, failing)).rejects.toThrow("boom");

    const ok = vi.fn(async () => "recovered");
    expect(await cached("k", 1000, ok)).toBe("recovered");
    expect(ok).toHaveBeenCalledTimes(1);
  });

  it("invalidate forces the next call to recompute", async () => {
    const producer = vi.fn(async () => Math.random());
    const first = await cached("k", 10_000, producer);
    invalidate("k");
    const second = await cached("k", 10_000, producer);

    expect(producer).toHaveBeenCalledTimes(2);
    expect(second).not.toBe(first);
  });
});

describe("peek", () => {
  it("is false for a key that was never populated", () => {
    expect(peek("missing")).toBe(false);
  });

  it("is true for a fresh (unexpired) entry", async () => {
    const producer = vi.fn(async () => "v1");
    const clock = 1000;
    const now = () => clock;

    await cached("k", 100, producer, now);
    expect(peek("k", now)).toBe(true);
  });

  it("is false once the entry has expired", async () => {
    const producer = vi.fn(async () => "v1");
    let clock = 0;
    const now = () => clock;

    await cached("k", 100, producer, now);
    clock = 100; // expiresAt was 100, and `expiresAt > now` is false at exactly 100
    expect(peek("k", now)).toBe(false);
  });

  it("does not consume the entry or trigger the producer", async () => {
    const producer = vi.fn(async () => "v1");
    const clock = 1000;
    const now = () => clock;

    await cached("k", 100, producer, now);
    expect(peek("k", now)).toBe(true);
    expect(peek("k", now)).toBe(true); // repeated peeks are idempotent
    expect(producer).toHaveBeenCalledTimes(1);

    // A subsequent cached() call should still be a hit (peek didn't mutate state).
    const value = await cached("k", 100, producer, now);
    expect(value).toBe("v1");
    expect(producer).toHaveBeenCalledTimes(1);
  });
});
