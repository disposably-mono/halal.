import { encode } from "@auth/core/jwt";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getEdgeAdminRole } from "@/lib/auth/edge-session";

const ORIGINAL_AUTH_SECRET = process.env.AUTH_SECRET;
const ORIGINAL_NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
const TEST_SECRET = "test-secret-with-enough-entropy-for-authjs";

describe("edge admin session reader", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "";
    process.env.NEXTAUTH_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    vi.useRealTimers();
    restoreEnv("AUTH_SECRET", ORIGINAL_AUTH_SECRET);
    restoreEnv("NEXTAUTH_SECRET", ORIGINAL_NEXTAUTH_SECRET);
  });

  it("reads the admin role from an Auth.js session token", async () => {
    const token = await encode({
      token: { id: "admin-1", role: "SUPERADMIN" },
      secret: TEST_SECRET,
      salt: "authjs.session-token",
    });
    const req = new NextRequest("https://example.test/admin", {
      headers: { cookie: `authjs.session-token=${token}` },
    });

    expect(await getEdgeAdminRole(req)).toBe("SUPERADMIN");
  });

  it("returns null when no session cookie is present", async () => {
    const req = new NextRequest("https://example.test/admin");

    expect(await getEdgeAdminRole(req)).toBeNull();
  });

  it("reads chunked Auth.js session cookies in numeric order", async () => {
    const token = await encode({
      token: { id: "admin-1", role: "COMMISSIONER" },
      secret: TEST_SECRET,
      salt: "authjs.session-token",
    });
    const midpoint = Math.floor(token.length / 2);
    const req = new NextRequest("https://example.test/admin", {
      headers: {
        cookie: [
          `authjs.session-token.1=${token.slice(midpoint)}`,
          `authjs.session-token.0=${token.slice(0, midpoint)}`,
        ].join("; "),
      },
    });

    expect(await getEdgeAdminRole(req)).toBe("COMMISSIONER");
  });

  it("ignores expired session tokens", async () => {
    const token = await encode({
      token: { id: "admin-1", role: "SUPERADMIN" },
      secret: TEST_SECRET,
      salt: "authjs.session-token",
    });
    const expiresAt = Date.now() + 40 * 24 * 60 * 60 * 1000;
    const req = new NextRequest("https://example.test/admin", {
      headers: { cookie: `authjs.session-token=${token}` },
    });

    vi.useFakeTimers();
    vi.setSystemTime(expiresAt);

    expect(await getEdgeAdminRole(req)).toBeNull();
  });

  it("ignores session tokens that are not active yet", async () => {
    const token = await encode({
      token: {
        id: "admin-1",
        role: "SUPERADMIN",
        nbf: Math.floor(Date.now() / 1000) + 60,
      },
      secret: TEST_SECRET,
      salt: "authjs.session-token",
    });
    const req = new NextRequest("https://example.test/admin", {
      headers: { cookie: `authjs.session-token=${token}` },
    });

    expect(await getEdgeAdminRole(req)).toBeNull();
  });

  it("returns null when the session has no string role", async () => {
    const token = await encode({
      token: { id: "admin-1" },
      secret: TEST_SECRET,
      salt: "authjs.session-token",
    });
    const req = new NextRequest("https://example.test/admin", {
      headers: { cookie: `authjs.session-token=${token}` },
    });

    expect(await getEdgeAdminRole(req)).toBeNull();
  });

  it("logs a configuration failure when the session secret is missing", async () => {
    const token = await encode({
      token: { id: "admin-1", role: "SUPERADMIN" },
      secret: TEST_SECRET,
      salt: "authjs.session-token",
    });
    const req = new NextRequest("https://example.test/admin", {
      headers: { cookie: `authjs.session-token=${token}` },
    });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    process.env.AUTH_SECRET = "";
    process.env.NEXTAUTH_SECRET = "";

    expect(await getEdgeAdminRole(req)).toBeNull();
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });
});

function restoreEnv(name: "AUTH_SECRET" | "NEXTAUTH_SECRET", value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}
