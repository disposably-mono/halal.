import { beforeEach, describe, expect, it, vi } from "vitest";

// Fixed IP for every request in this suite so rate-limit hits land in the
// same bucket unless a test overrides it.
const headersGet = vi.fn((name: string): string | null =>
  name === "x-forwarded-for" ? "203.0.113.5" : null,
);

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({ get: headersGet })),
}));

// Defaults to "an open election exists" so tests reach the rate-limit / DB
// lookup path; individual tests override via mockResolvedValueOnce.
const electionCount = vi.fn(async () => 1);
const ballotFindUnique = vi.fn(async () => null);
const ballotUpdateMany = vi.fn(async () => ({ count: 0 }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    election: {
      count: (...args: Parameters<typeof electionCount>) => electionCount(...args),
    },
    ballot: {
      findUnique: (...args: Parameters<typeof ballotFindUnique>) => ballotFindUnique(...args),
      updateMany: (...args: Parameters<typeof ballotUpdateMany>) => ballotUpdateMany(...args),
    },
  },
}));

import { __resetRateLimits, RATE_LIMITS } from "@/lib/server/rate-limit";
import { verifyReceiptAction } from "@/app/verify/actions";

function formDataWithCode(code: string): FormData {
  const fd = new FormData();
  fd.set("code", code);
  return fd;
}

beforeEach(() => {
  __resetRateLimits();
  electionCount.mockClear();
  electionCount.mockImplementation(async () => 1);
  ballotFindUnique.mockClear();
  ballotUpdateMany.mockClear();
  headersGet.mockClear();
  headersGet.mockImplementation((name: string) => (name === "x-forwarded-for" ? "203.0.113.5" : null));
});

describe("verifyReceiptAction length cap", () => {
  it("rejects codes longer than 64 characters before any DB work runs", async () => {
    const oversized = "A".repeat(65);

    const result = await verifyReceiptAction({ status: "idle" }, formDataWithCode(oversized));

    expect(result).toEqual({ status: "invalid" });
    expect(electionCount).not.toHaveBeenCalled();
    expect(ballotFindUnique).not.toHaveBeenCalled();
  });

  it("accepts a 64-character code and proceeds past the length gate", async () => {
    const atLimit = "A".repeat(64);

    await verifyReceiptAction({ status: "idle" }, formDataWithCode(atLimit));

    // Having cleared the length gate, hasOpenElection's DB check must run.
    expect(electionCount).toHaveBeenCalledTimes(1);
  });

  it("still reports invalid for a short, malformed code (non-length rejection unaffected)", async () => {
    const result = await verifyReceiptAction({ status: "idle" }, formDataWithCode("too-short"));
    expect(result).toEqual({ status: "invalid" });
  });
});

describe("verifyReceiptAction rate limiting", () => {
  it("blocks after RATE_LIMITS.receiptVerify.limit attempts from the same IP", async () => {
    const code = "A".repeat(32);
    const attempts = RATE_LIMITS.receiptVerify.limit + 1;

    let last;
    for (let i = 0; i < attempts; i++) {
      last = await verifyReceiptAction({ status: "idle" }, formDataWithCode(code));
    }

    expect(last).toEqual({ status: "rate_limited" });
  });

  it("does not rate-limit a different IP once one IP is blocked", async () => {
    const code = "A".repeat(32);
    const attempts = RATE_LIMITS.receiptVerify.limit + 1;

    for (let i = 0; i < attempts; i++) {
      await verifyReceiptAction({ status: "idle" }, formDataWithCode(code));
    }

    // Switch to a different client IP — must not share the exhausted bucket.
    headersGet.mockImplementation((name: string) => (name === "x-forwarded-for" ? "198.51.100.9" : null));
    const result = await verifyReceiptAction({ status: "idle" }, formDataWithCode(code));

    expect(result).not.toEqual({ status: "rate_limited" });
  });

  it("checks the rate limit before hitting the ballot lookup", async () => {
    const code = "A".repeat(32);
    const attempts = RATE_LIMITS.receiptVerify.limit + 1;

    for (let i = 0; i < attempts; i++) {
      await verifyReceiptAction({ status: "idle" }, formDataWithCode(code));
    }
    ballotFindUnique.mockClear();

    await verifyReceiptAction({ status: "idle" }, formDataWithCode(code));

    expect(ballotFindUnique).not.toHaveBeenCalled();
  });
});
