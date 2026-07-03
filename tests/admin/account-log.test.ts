import { describe, expect, test } from "vitest";
import {
  createdAccountEntry,
  deletedAccountEntry,
  officerKeyResetEntry,
  passwordResetEntry,
  roleChangedEntry,
} from "@/app/(admin)/admin/accounts/account-log";

const actor = { id: "actor-1", email: "actor@example.com", name: "Actor One" };
const target = { id: "target-1", email: "target@example.com", name: "Target One", role: "OFFICER" };

describe("account log entry builders", () => {
  test("createdAccountEntry records account creation", () => {
    expect(createdAccountEntry(actor, target)).toEqual({
      action: "Created account",
      actorId: "actor-1",
      actorEmail: "actor@example.com",
      actorName: "Actor One",
      targetId: "target-1",
      targetEmail: "target@example.com",
      targetName: "Target One",
      targetRole: "OFFICER",
    });
  });

  test("roleChangedEntry names both the old and new role", () => {
    const entry = roleChangedEntry(actor, { ...target, role: "CANVASSER" }, "OFFICER");
    expect(entry.action).toBe("Changed role: OFFICER → CANVASSER");
    expect(entry.targetRole).toBe("CANVASSER");
  });

  test("passwordResetEntry embeds the target role in the action string", () => {
    const superadminTarget = { ...target, role: "SUPERADMIN" };
    const entry = passwordResetEntry(actor, superadminTarget);
    expect(entry.action).toBe("Reset password (target role: SUPERADMIN)");
    expect(entry.targetRole).toBe("SUPERADMIN");
  });

  test("officerKeyResetEntry embeds the target role in the action string", () => {
    const superadminTarget = { ...target, role: "SUPERADMIN" };
    const entry = officerKeyResetEntry(actor, superadminTarget);
    expect(entry.action).toBe("Reset officer key (target role: SUPERADMIN)");
    expect(entry.targetRole).toBe("SUPERADMIN");
  });

  test("deletedAccountEntry records account deletion", () => {
    const entry = deletedAccountEntry(actor, target);
    expect(entry.action).toBe("Deleted account");
    expect(entry.targetId).toBe("target-1");
  });
});
