import { describe, expect, test } from "vitest";
import { getAccountSummary } from "@/app/(admin)/admin/accounts/account-display";

describe("account display helpers", () => {
  test("summarizes total accounts and super-admin count", () => {
    expect(getAccountSummary([
      { role: "SUPERADMIN" },
      { role: "OFFICER" },
      { role: "CANVASSER" },
    ])).toEqual({
      totalLabel: "3 accounts",
      superadminCount: 1,
    });
  });

  test("uses singular account copy", () => {
    expect(getAccountSummary([{ role: "SUPERADMIN" }]).totalLabel).toBe("1 account");
  });
});
