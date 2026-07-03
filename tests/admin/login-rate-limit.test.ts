import { beforeEach, describe, expect, it, vi } from "vitest";

// checkAdminCredentials always "fails" here (wrong password) — these tests
// only exercise the M3 per-account throttle added around it, not the actual
// credential-verification logic (covered elsewhere / requires a real DB).
const checkAdminCredentials = vi.fn().mockResolvedValue({ ok: false, reason: "primary" });
vi.mock("@/lib/auth/admin-login", () => ({
  checkAdminCredentials: (...args: unknown[]) => checkAdminCredentials(...args),
}));

// Simulate a spoofed, rotating x-forwarded-for header (no sanitizing proxy in
// front) so the IP-keyed limit alone would never trip.
let forwardedFor = "203.0.113.1";
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: (name: string) => (name === "x-forwarded-for" ? forwardedFor : null),
  })),
}));

// `@/app/admin/*` is aliased to the (admin) route group (see tsconfig.json),
// so the legacy app/admin/login/actions.ts (outside that group) must be
// imported by relative path, matching app/admin/login/page.tsx's own import.
import { verifyAdminCredentials } from "../../app/admin/login/actions";
import { __resetRateLimits, RATE_LIMITS } from "@/lib/server/rate-limit";

beforeEach(() => {
  __resetRateLimits();
  checkAdminCredentials.mockClear();
  forwardedFor = "203.0.113.1";
});

describe("verifyAdminCredentials per-account throttle (M3 defense in depth)", () => {
  it("blocks further attempts against one account even when the IP rotates every request", async () => {
    const email = "target@example.com";

    for (let i = 0; i < RATE_LIMITS.adminLogin.limit; i++) {
      forwardedFor = `203.0.113.${i}`; // a fresh spoofed IP on every attempt
      const result = await verifyAdminCredentials(email, "wrong-password");
      expect(result).toEqual({ ok: false, reason: "primary" });
    }

    // The (limit + 1)th attempt is throttled by the per-email bucket alone,
    // despite yet another new IP.
    forwardedFor = "203.0.113.250";
    const blocked = await verifyAdminCredentials(email, "wrong-password");
    expect(blocked).toEqual({ ok: false, reason: "rateLimited" });
  });

  it("normalizes email case/whitespace so the throttle can't be bypassed by varying them", async () => {
    for (let i = 0; i < RATE_LIMITS.adminLogin.limit; i++) {
      await verifyAdminCredentials("Target@Example.com", "wrong-password");
    }

    const blocked = await verifyAdminCredentials("  target@example.com  ", "wrong-password");
    expect(blocked).toEqual({ ok: false, reason: "rateLimited" });
  });

  it("does not throttle a different account, even from an IP that's already exhausted", async () => {
    // Exhaust the victim's email bucket, rotating IPs so only the email
    // bucket (not the shared IP bucket) ends up blocked.
    for (let i = 0; i < RATE_LIMITS.adminLogin.limit; i++) {
      forwardedFor = `198.51.100.${i}`;
      await verifyAdminCredentials("victim@example.com", "wrong-password");
    }
    forwardedFor = "198.51.100.250";
    expect(await verifyAdminCredentials("victim@example.com", "wrong-password")).toEqual({
      ok: false,
      reason: "rateLimited",
    });

    // A different account, from a fresh IP, is unaffected by the victim's
    // exhausted email bucket.
    forwardedFor = "198.51.100.251";
    const result = await verifyAdminCredentials("other-admin@example.com", "wrong-password");
    expect(result).toEqual({ ok: false, reason: "primary" });
  });

  it("still calls checkAdminCredentials for attempts within both throttles", async () => {
    await verifyAdminCredentials("fresh@example.com", "wrong-password");
    expect(checkAdminCredentials).toHaveBeenCalledWith("fresh@example.com", "wrong-password", undefined);
  });
});
