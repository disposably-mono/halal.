import { describe, expect, test } from "vitest";
import type { AdminRole } from "@prisma/client";
import {
  ROLE_CAPABILITIES,
  GRANTABLE_ROLES,
  CAPABILITY_DENIED_MESSAGES,
  PERMISSION_DENIED_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
  can,
  capabilitiesFor,
  isGrantableRole,
  permissionErrorMessage,
  deniedMessage,
  type Capability,
} from "@/lib/auth/permissions";

const ALL_CAPABILITIES: Capability[] = [
  "accounts:manage",
  "election:lifecycle",
  "election:close",
  "voters:manage",
  "voters:export",
  "candidates:manage",
  "results:export",
  "recounts:run",
  "admin:view",
];

// The authoritative separation-of-duties matrix. Mirrors the product decision:
// COMELEC manages accounts only; Canvasser owns results; Commissioner runs
// setup; Officer observes.
const EXPECTED: Record<AdminRole, Capability[]> = {
  SUPERADMIN: ["accounts:manage", "admin:view"],
  CANVASSER: ["election:close", "results:export", "recounts:run", "admin:view"],
  COMMISSIONER: [
    "election:lifecycle",
    "voters:manage",
    "voters:export",
    "candidates:manage",
    "admin:view",
  ],
  OFFICER: ["admin:view"],
};

const ROLES = Object.keys(EXPECTED) as AdminRole[];

describe("can() truth table", () => {
  for (const role of ROLES) {
    for (const cap of ALL_CAPABILITIES) {
      const expected = EXPECTED[role].includes(cap);
      test(`${role} ${expected ? "can" : "cannot"} ${cap}`, () => {
        expect(can(role, cap)).toBe(expected);
      });
    }
  }
});

describe("separation of duties invariants", () => {
  test("only SUPERADMIN manages accounts", () => {
    expect(ROLES.filter((r) => can(r, "accounts:manage"))).toEqual(["SUPERADMIN"]);
  });

  test("only CANVASSER can close elections or export results", () => {
    expect(ROLES.filter((r) => can(r, "election:close"))).toEqual(["CANVASSER"]);
    expect(ROLES.filter((r) => can(r, "results:export"))).toEqual(["CANVASSER"]);
    expect(ROLES.filter((r) => can(r, "recounts:run"))).toEqual(["CANVASSER"]);
  });

  test("SUPERADMIN cannot run elections", () => {
    expect(can("SUPERADMIN", "election:lifecycle")).toBe(false);
    expect(can("SUPERADMIN", "election:close")).toBe(false);
    expect(can("SUPERADMIN", "voters:manage")).toBe(false);
    expect(can("SUPERADMIN", "candidates:manage")).toBe(false);
  });

  test("every role can view the admin panel", () => {
    for (const role of ROLES) expect(can(role, "admin:view")).toBe(true);
  });
});

describe("can() with invalid roles", () => {
  test("undefined / null / unknown roles are denied everything", () => {
    for (const cap of ALL_CAPABILITIES) {
      expect(can(undefined, cap)).toBe(false);
      expect(can(null, cap)).toBe(false);
      expect(can("NOT_A_ROLE", cap)).toBe(false);
    }
  });
});

describe("capabilitiesFor()", () => {
  for (const role of ROLES) {
    test(`returns the exact capability set for ${role}`, () => {
      const caps = capabilitiesFor(role);
      expect(Array.from(caps).sort()).toEqual([...EXPECTED[role]].sort());
    });
  }

  test("returns an empty set for undefined / null / unknown roles", () => {
    expect(capabilitiesFor(undefined).size).toBe(0);
    expect(capabilitiesFor(null).size).toBe(0);
    expect(capabilitiesFor("NOT_A_ROLE").size).toBe(0);
  });
});

describe("grantable roles (SUPERADMIN is locked)", () => {
  test("SUPERADMIN is never grantable through the UI", () => {
    expect(GRANTABLE_ROLES).not.toContain("SUPERADMIN");
    expect(isGrantableRole("SUPERADMIN")).toBe(false);
  });

  test("the working roles are all grantable", () => {
    for (const role of ["COMMISSIONER", "CANVASSER", "OFFICER"] as const) {
      expect(GRANTABLE_ROLES).toContain(role);
      expect(isGrantableRole(role)).toBe(true);
    }
  });

  test("undefined / null / unknown roles are not grantable", () => {
    expect(isGrantableRole(undefined)).toBe(false);
    expect(isGrantableRole(null)).toBe(false);
    expect(isGrantableRole("NOT_A_ROLE")).toBe(false);
  });

  test("every grantable role is a real role in the capability map", () => {
    for (const role of GRANTABLE_ROLES) {
      expect(ROLE_CAPABILITIES[role]).toBeDefined();
    }
  });
});

describe("permission messages (no silent failures)", () => {
  test("Unauthorized maps to the session-expired message", () => {
    expect(permissionErrorMessage("Unauthorized")).toBe(SESSION_EXPIRED_MESSAGE);
  });

  test("Forbidden (and anything else) maps to the permission-denied message", () => {
    expect(permissionErrorMessage("Forbidden")).toBe(PERMISSION_DENIED_MESSAGE);
    expect(permissionErrorMessage(undefined)).toBe(PERMISSION_DENIED_MESSAGE);
    expect(permissionErrorMessage("weird")).toBe(PERMISSION_DENIED_MESSAGE);
  });

  test("messages never leak the raw guard discriminant", () => {
    for (const raw of ["Forbidden", "Unauthorized"]) {
      expect(permissionErrorMessage(raw)).not.toBe(raw);
    }
  });

  test("every capability has a denied-banner message", () => {
    for (const cap of ALL_CAPABILITIES) {
      expect(CAPABILITY_DENIED_MESSAGES[cap]).toBeTruthy();
    }
  });

  test("deniedMessage resolves known capabilities to their specific copy", () => {
    expect(deniedMessage("accounts:manage")).toBe(
      CAPABILITY_DENIED_MESSAGES["accounts:manage"],
    );
    expect(deniedMessage("election:close")).toBe(
      CAPABILITY_DENIED_MESSAGES["election:close"],
    );
  });

  test("deniedMessage falls back for the legacy sentinel / unknown values", () => {
    expect(deniedMessage("1")).toBe(
      "You don't have permission to access that page.",
    );
    expect(deniedMessage("nonsense")).toBe(
      "You don't have permission to access that page.",
    );
  });

  test("deniedMessage returns null when there is nothing to show", () => {
    expect(deniedMessage(undefined)).toBeNull();
    expect(deniedMessage(null)).toBeNull();
    expect(deniedMessage("")).toBeNull();
  });
});

describe("ROLE_CAPABILITIES map", () => {
  test("matches the expected matrix exactly", () => {
    for (const role of ROLES) {
      expect([...ROLE_CAPABILITIES[role]].sort()).toEqual(
        [...EXPECTED[role]].sort(),
      );
    }
  });
});
