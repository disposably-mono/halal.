import { describe, expect, test } from "vitest";
import type { AdminRole } from "@prisma/client";
import {
  ROLE_CAPABILITIES,
  can,
  capabilitiesFor,
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
  "admin:view",
];

// The authoritative separation-of-duties matrix. Mirrors the product decision:
// COMELEC manages accounts only; Canvasser owns results; Commissioner runs
// setup; Officer observes.
const EXPECTED: Record<AdminRole, Capability[]> = {
  SUPERADMIN: ["accounts:manage", "admin:view"],
  CANVASSER: ["election:close", "results:export", "admin:view"],
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

describe("ROLE_CAPABILITIES map", () => {
  test("matches the expected matrix exactly", () => {
    for (const role of ROLES) {
      expect([...ROLE_CAPABILITIES[role]].sort()).toEqual(
        [...EXPECTED[role]].sort(),
      );
    }
  });
});
