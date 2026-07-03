import { describe, expect, test, vi } from "vitest";
import type { JWT } from "next-auth/jwt";
import { refreshTokenRole, ROLE_CHECK_INTERVAL_MS } from "@/lib/auth/token-refresh";

const baseToken: JWT = {
  id: "admin-1",
  role: "COMMISSIONER",
  roleCheckedAt: 0,
};

describe("refreshTokenRole", () => {
  test("skips the DB lookup entirely when still within the check interval", async () => {
    const fetchAdmin = vi.fn();
    const now = ROLE_CHECK_INTERVAL_MS - 1;

    const result = await refreshTokenRole(baseToken, fetchAdmin, now);

    expect(fetchAdmin).not.toHaveBeenCalled();
    expect(result).toEqual(baseToken);
  });

  test("re-checks once the interval has elapsed and refreshes roleCheckedAt", async () => {
    const fetchAdmin = vi.fn().mockResolvedValue({ id: "admin-1", role: "COMMISSIONER" });
    const now = ROLE_CHECK_INTERVAL_MS;

    const result = await refreshTokenRole(baseToken, fetchAdmin, now);

    expect(fetchAdmin).toHaveBeenCalledWith("admin-1");
    expect(result).toEqual({ ...baseToken, role: "COMMISSIONER", roleCheckedAt: now });
  });

  test("updates token.role when the DB role has changed (demotion/promotion)", async () => {
    const fetchAdmin = vi.fn().mockResolvedValue({ id: "admin-1", role: "OFFICER" });
    const now = ROLE_CHECK_INTERVAL_MS;

    const result = await refreshTokenRole(baseToken, fetchAdmin, now);

    expect(result).toEqual({ ...baseToken, role: "OFFICER", roleCheckedAt: now });
  });

  test("returns null when the admin account no longer exists (invalidates the session)", async () => {
    const fetchAdmin = vi.fn().mockResolvedValue(null);
    const now = ROLE_CHECK_INTERVAL_MS;

    const result = await refreshTokenRole(baseToken, fetchAdmin, now);

    expect(result).toBeNull();
  });

  test("keeps the existing token unchanged when the DB query throws (outage safety)", async () => {
    const fetchAdmin = vi.fn().mockRejectedValue(new Error("connection refused"));
    const now = ROLE_CHECK_INTERVAL_MS;
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await refreshTokenRole(baseToken, fetchAdmin, now);

    expect(result).toEqual(baseToken);
    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });

  test("treats a missing roleCheckedAt claim as never-checked and revalidates immediately", async () => {
    const tokenWithoutCheck: JWT = { id: "admin-1", role: "COMMISSIONER" };
    const fetchAdmin = vi.fn().mockResolvedValue({ id: "admin-1", role: "COMMISSIONER" });
    // A realistic epoch timestamp — missing roleCheckedAt defaults to 0, so
    // any real-world `now` is already well past ROLE_CHECK_INTERVAL_MS.
    const now = 1_700_000_000_000;

    const result = await refreshTokenRole(tokenWithoutCheck, fetchAdmin, now);

    expect(fetchAdmin).toHaveBeenCalledWith("admin-1");
    expect(result).toEqual({ ...tokenWithoutCheck, role: "COMMISSIONER", roleCheckedAt: now });
  });

  test("returns the token unchanged (no lookup) when there is no id on it", async () => {
    const tokenWithoutId: JWT = { role: "COMMISSIONER" };
    const fetchAdmin = vi.fn();

    const result = await refreshTokenRole(tokenWithoutId, fetchAdmin, ROLE_CHECK_INTERVAL_MS);

    expect(fetchAdmin).not.toHaveBeenCalled();
    expect(result).toEqual(tokenWithoutId);
  });
});
