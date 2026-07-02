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
  "elections:view",
  "voters:view",
  "candidates:view",
  "results:view",
  "history:view",
];

const ALL_MANAGE_CAPABILITIES: Capability[] = [
  "accounts:manage",
  "election:lifecycle",
  "election:close",
  "voters:manage",
  "voters:export",
  "candidates:manage",
  "results:export",
  "recounts:run",
];

const ALL_VIEW_CAPABILITIES: Capability[] = [
  "elections:view",
  "voters:view",
  "candidates:view",
  "results:view",
  "history:view",
];

// The authoritative separation-of-duties matrix. Mirrors the product decision:
// COMELEC (SUPERADMIN) has oversight — it can VIEW every admin page but can only
// EDIT admin accounts. Canvasser owns results; Commissioner runs setup; Officer
// observes (dashboard + live monitor only).
const EXPECTED: Record<AdminRole, Capability[]> = {
  SUPERADMIN: [
    "accounts:manage",
    "admin:view",
    "elections:view",
    "voters:view",
    "candidates:view",
    "results:view",
    "history:view",
  ],
  CANVASSER: [
    "election:close",
    "results:export",
    "recounts:run",
    "admin:view",
    "elections:view",
    "results:view",
  ],
  COMMISSIONER: [
    "election:lifecycle",
    "voters:manage",
    "voters:export",
    "candidates:manage",
    "admin:view",
    "elections:view",
    "voters:view",
    "candidates:view",
    "results:view",
  ],
  OFFICER: ["admin:view"],
};

// The pre-Phase-A matrix (before read/view capabilities existed). Used to prove
// no role lost anything it could already do — this phase is additive-only.
const PREVIOUSLY_HELD_MANAGE_CAPS: Record<AdminRole, Capability[]> = {
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

  test("SUPERADMIN cannot run elections (retains oversight-only, not manage)", () => {
    expect(can("SUPERADMIN", "election:lifecycle")).toBe(false);
    expect(can("SUPERADMIN", "election:close")).toBe(false);
    expect(can("SUPERADMIN", "voters:manage")).toBe(false);
    expect(can("SUPERADMIN", "candidates:manage")).toBe(false);
    expect(can("SUPERADMIN", "voters:export")).toBe(false);
    expect(can("SUPERADMIN", "results:export")).toBe(false);
    expect(can("SUPERADMIN", "recounts:run")).toBe(false);
  });

  test("every role can view the admin panel", () => {
    for (const role of ROLES) expect(can(role, "admin:view")).toBe(true);
  });
});

describe("SUPERADMIN oversight (Phase A)", () => {
  test("SUPERADMIN has every *:view capability", () => {
    for (const cap of ALL_VIEW_CAPABILITIES) {
      expect(can("SUPERADMIN", cap)).toBe(true);
    }
  });

  test("SUPERADMIN has no *:manage capability other than accounts:manage", () => {
    const otherManageCaps = ALL_MANAGE_CAPABILITIES.filter((c) => c !== "accounts:manage");
    for (const cap of otherManageCaps) {
      expect(can("SUPERADMIN", cap)).toBe(false);
    }
  });

  test("SUPERADMIN still has accounts:manage and admin:view", () => {
    expect(can("SUPERADMIN", "accounts:manage")).toBe(true);
    expect(can("SUPERADMIN", "admin:view")).toBe(true);
  });

  test("SUPERADMIN capability set is exactly the view caps plus accounts:manage/admin:view", () => {
    const caps = capabilitiesFor("SUPERADMIN");
    expect(caps.size).toBe(ALL_VIEW_CAPABILITIES.length + 2);
    for (const cap of ALL_VIEW_CAPABILITIES) expect(caps.has(cap)).toBe(true);
    expect(caps.has("accounts:manage")).toBe(true);
    expect(caps.has("admin:view")).toBe(true);
  });
});

describe("no role lost a previously-held capability (Phase A is additive-only)", () => {
  for (const role of ROLES) {
    test(`${role} retains every capability it had before Phase A`, () => {
      for (const cap of PREVIOUSLY_HELD_MANAGE_CAPS[role]) {
        expect(can(role, cap)).toBe(true);
      }
    });
  }
});

describe("view capabilities granted to managing roles (keep current access)", () => {
  test("COMMISSIONER gains elections/voters/candidates/results view", () => {
    expect(can("COMMISSIONER", "elections:view")).toBe(true);
    expect(can("COMMISSIONER", "voters:view")).toBe(true);
    expect(can("COMMISSIONER", "candidates:view")).toBe(true);
    expect(can("COMMISSIONER", "results:view")).toBe(true);
    expect(can("COMMISSIONER", "history:view")).toBe(false);
  });

  test("CANVASSER gains elections/results view", () => {
    expect(can("CANVASSER", "elections:view")).toBe(true);
    expect(can("CANVASSER", "results:view")).toBe(true);
    expect(can("CANVASSER", "voters:view")).toBe(false);
    expect(can("CANVASSER", "candidates:view")).toBe(false);
    expect(can("CANVASSER", "history:view")).toBe(false);
  });

  test("OFFICER is unchanged: no new view capabilities", () => {
    for (const cap of ALL_VIEW_CAPABILITIES) {
      expect(can("OFFICER", cap)).toBe(false);
    }
    expect(capabilitiesFor("OFFICER").size).toBe(1);
    expect(can("OFFICER", "admin:view")).toBe(true);
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

  test("deniedMessage resolves the new view capabilities to generic access copy", () => {
    for (const cap of ALL_VIEW_CAPABILITIES) {
      expect(deniedMessage(cap)).toBe(CAPABILITY_DENIED_MESSAGES[cap]);
      expect(deniedMessage(cap)).toBe("You don't have access to that page.");
    }
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
