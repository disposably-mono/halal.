import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

// Mirrors the tx stub pattern in tests/admin/archive-restore-race.test.ts and
// tests/admin/control-lifecycle-actions.test.ts: a shared mock transaction
// client, driven through a mocked `prisma.$transaction`.
const txMock = {
  adminUser: {
    findMany: vi.fn(async () => [] as { officerKey: string }[]),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(async () => ({})),
    delete: vi.fn(async () => ({})),
    count: vi.fn(async () => 2),
  },
  adminAccountLog: {
    create: vi.fn(async () => ({})),
  },
};

const transactionMock = vi.fn(async (cb: (tx: typeof txMock) => Promise<void>) => cb(txMock));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (...args: Parameters<typeof transactionMock>) => transactionMock(...args),
  },
}));

const defaultSession = {
  user: { id: "admin-1", email: "admin@example.com", role: "SUPERADMIN", name: "Admin" },
};

type GuardResult =
  | { ok: true; session: typeof defaultSession }
  | { ok: false; error: "Unauthorized" | "Forbidden" };

const requireCapabilityOrError = vi.fn<() => Promise<GuardResult>>(async () => ({
  ok: true,
  session: defaultSession,
}));

vi.mock("@/lib/server/auth", () => ({
  requireCapabilityOrError: (...args: unknown[]) => requireCapabilityOrError(...(args as [])),
  adminEmailFromSession: (session: typeof defaultSession) => session.user?.email ?? "unknown",
  adminNameFromSession: (session: typeof defaultSession) => session.user?.name ?? "unknown",
  adminIdFromSession: (session: typeof defaultSession) => session.user?.id ?? "unknown",
}));

vi.mock("@/lib/server/revalidate", () => ({
  revalidateAdminAccounts: vi.fn(),
}));

// Fast, deterministic stand-ins so tests don't pay real bcrypt cost-12 hashing
// time. `hash` tags the plaintext so assertions can check what got hashed;
// `compare` matches against that same tag.
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(async (value: string) => `hashed:${value}`),
    compare: vi.fn(async (plain: string, hash: string) => hash === `hashed:${plain}`),
  },
}));

import {
  createAdmin,
  deleteAdmin,
  resetAdminOfficerKey,
  resetAdminPassword,
  updateAdminRole,
} from "@/app/(admin)/admin/accounts/actions";
import { revalidateAdminAccounts } from "@/lib/server/revalidate";

function buildCreateFormData(overrides: Record<string, string> = {}): FormData {
  const fields = {
    email: "new@example.com",
    name: "New Admin",
    role: "COMMISSIONER",
    password: "supersecret1",
    officerKey: "officer-key-1",
    ...overrides,
  };
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

beforeEach(() => {
  txMock.adminUser.findMany.mockReset().mockResolvedValue([]);
  txMock.adminUser.findUnique.mockReset();
  txMock.adminUser.create.mockReset();
  txMock.adminUser.update.mockClear();
  txMock.adminUser.delete.mockClear();
  txMock.adminUser.count.mockReset().mockResolvedValue(2);
  txMock.adminAccountLog.create.mockClear();
  transactionMock.mockClear();
  requireCapabilityOrError.mockClear();
  requireCapabilityOrError.mockResolvedValue({ ok: true, session: defaultSession });
  vi.mocked(revalidateAdminAccounts).mockClear();
});

describe("createAdmin", () => {
  it("returns the permission error without touching the transaction when capability check fails", async () => {
    requireCapabilityOrError.mockResolvedValue({ ok: false, error: "Forbidden" });

    const result = await createAdmin(null, buildCreateFormData());

    expect(result.success).toBe(false);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("rejects invalid form data", async () => {
    const result = await createAdmin(null, buildCreateFormData({ email: "not-an-email" }));

    expect(result.success).toBe(false);
    expect(txMock.adminUser.create).not.toHaveBeenCalled();
  });

  it("rejects a non-grantable role", async () => {
    const result = await createAdmin(null, buildCreateFormData({ role: "SUPERADMIN" }));

    expect(result).toEqual({ success: false, error: "Super-admin can no longer be granted." });
    expect(txMock.adminUser.create).not.toHaveBeenCalled();
  });

  it("rejects an officer key that is already in use", async () => {
    txMock.adminUser.findMany.mockResolvedValue([{ officerKey: "hashed:officer-key-1" }]);

    const result = await createAdmin(null, buildCreateFormData());

    expect(result).toEqual({
      success: false,
      error: "That officer key is already assigned to another account.",
    });
    expect(txMock.adminUser.create).not.toHaveBeenCalled();
  });

  it("maps a P2002 duplicate-email error to a friendly message", async () => {
    transactionMock.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    const result = await createAdmin(null, buildCreateFormData());

    expect(result).toEqual({
      success: false,
      error: "An account with that email already exists.",
    });
    expect(revalidateAdminAccounts).not.toHaveBeenCalled();
  });

  it("maps a serialization conflict (P2034) to the concurrent-write message", async () => {
    transactionMock.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("could not serialize access", {
        code: "P2034",
        clientVersion: "test",
      }),
    );

    const result = await createAdmin(null, buildCreateFormData());

    expect(result).toEqual({
      success: false,
      error: "Another account change happened at the same time. Please try again.",
    });
  });

  it("creates the account, writes the audit row, and revalidates on success", async () => {
    txMock.adminUser.create.mockResolvedValue({
      id: "new-1",
      email: "new@example.com",
      name: "New Admin",
      role: "COMMISSIONER",
    });

    const result = await createAdmin(null, buildCreateFormData());

    expect(result).toEqual({ success: true });
    expect(txMock.adminUser.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "new@example.com",
        name: "New Admin",
        role: "COMMISSIONER",
        passwordHash: "hashed:supersecret1",
        officerKey: "hashed:officer-key-1",
      }),
    });
    expect(txMock.adminAccountLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "Created account",
        targetId: "new-1",
        targetRole: "COMMISSIONER",
      }),
    });
    expect(revalidateAdminAccounts).toHaveBeenCalledTimes(1);
  });
});

describe("updateAdminRole", () => {
  it("reports account-not-found", async () => {
    txMock.adminUser.findUnique.mockResolvedValue(null);

    const result = await updateAdminRole("missing", "CANVASSER");

    expect(result).toEqual({ success: false, error: "Account not found." });
    expect(txMock.adminUser.update).not.toHaveBeenCalled();
  });

  it("no-ops (success, no write) when the role is unchanged", async () => {
    txMock.adminUser.findUnique.mockResolvedValue({
      id: "a1",
      email: "a1@example.com",
      name: "A1",
      role: "CANVASSER",
    });

    const result = await updateAdminRole("a1", "CANVASSER");

    expect(result).toEqual({ success: true });
    expect(txMock.adminUser.update).not.toHaveBeenCalled();
    expect(txMock.adminAccountLog.create).not.toHaveBeenCalled();
    expect(revalidateAdminAccounts).toHaveBeenCalledTimes(1);
  });

  it("rejects a non-grantable target role", async () => {
    txMock.adminUser.findUnique.mockResolvedValue({
      id: "a1",
      email: "a1@example.com",
      name: "A1",
      role: "CANVASSER",
    });

    const result = await updateAdminRole("a1", "SUPERADMIN");

    expect(result).toEqual({ success: false, error: "Super-admin can no longer be granted." });
    expect(txMock.adminUser.update).not.toHaveBeenCalled();
  });

  it("blocks demoting a SUPERADMIN account", async () => {
    txMock.adminUser.findUnique.mockResolvedValue({
      id: "a1",
      email: "a1@example.com",
      name: "A1",
      role: "SUPERADMIN",
    });

    const result = await updateAdminRole("a1", "CANVASSER");

    expect(result).toEqual({ success: false, error: "Super-admin accounts are locked." });
    expect(txMock.adminUser.update).not.toHaveBeenCalled();
  });

  it("updates the role, writes the audit row, and revalidates on success", async () => {
    txMock.adminUser.findUnique.mockResolvedValue({
      id: "a1",
      email: "a1@example.com",
      name: "A1",
      role: "OFFICER",
    });

    const result = await updateAdminRole("a1", "CANVASSER");

    expect(result).toEqual({ success: true });
    expect(txMock.adminUser.update).toHaveBeenCalledWith({
      where: { id: "a1" },
      data: { role: "CANVASSER" },
    });
    expect(txMock.adminAccountLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "Changed role: OFFICER → CANVASSER",
        targetId: "a1",
      }),
    });
    expect(revalidateAdminAccounts).toHaveBeenCalledTimes(1);
  });
});

describe("resetAdminPassword", () => {
  it("reports account-not-found", async () => {
    txMock.adminUser.findUnique.mockResolvedValue(null);

    const result = await resetAdminPassword("missing", "newpassword1");

    expect(result).toEqual({ success: false, error: "Account not found." });
    expect(txMock.adminUser.update).not.toHaveBeenCalled();
  });

  it("resets the password, writes the audit row, and revalidates on success", async () => {
    txMock.adminUser.findUnique.mockResolvedValue({
      id: "a1",
      email: "a1@example.com",
      name: "A1",
      role: "OFFICER",
    });

    const result = await resetAdminPassword("a1", "newpassword1");

    expect(result).toEqual({ success: true });
    expect(txMock.adminUser.update).toHaveBeenCalledWith({
      where: { id: "a1" },
      data: { passwordHash: "hashed:newpassword1" },
    });
    expect(txMock.adminAccountLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "Reset password (target role: OFFICER)",
        targetId: "a1",
      }),
    });
    expect(revalidateAdminAccounts).toHaveBeenCalledTimes(1);
  });
});

describe("resetAdminOfficerKey", () => {
  it("reports account-not-found", async () => {
    txMock.adminUser.findUnique.mockResolvedValue(null);

    const result = await resetAdminOfficerKey("missing", "new-officer-key");

    expect(result).toEqual({ success: false, error: "Account not found." });
    expect(txMock.adminUser.update).not.toHaveBeenCalled();
  });

  it("rejects an officer key already in use by another account", async () => {
    txMock.adminUser.findUnique.mockResolvedValue({
      id: "a1",
      email: "a1@example.com",
      name: "A1",
      role: "OFFICER",
    });
    txMock.adminUser.findMany.mockResolvedValue([{ officerKey: "hashed:new-officer-key" }]);

    const result = await resetAdminOfficerKey("a1", "new-officer-key");

    expect(result).toEqual({
      success: false,
      error: "That officer key is already assigned to another account.",
    });
    expect(txMock.adminUser.update).not.toHaveBeenCalled();
  });

  it("resets the officer key, writes the audit row, and revalidates on success", async () => {
    txMock.adminUser.findUnique.mockResolvedValue({
      id: "a1",
      email: "a1@example.com",
      name: "A1",
      role: "OFFICER",
    });

    const result = await resetAdminOfficerKey("a1", "new-officer-key");

    expect(result).toEqual({ success: true });
    expect(txMock.adminUser.update).toHaveBeenCalledWith({
      where: { id: "a1" },
      data: { officerKey: "hashed:new-officer-key" },
    });
    expect(txMock.adminAccountLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "Reset officer key (target role: OFFICER)",
        targetId: "a1",
      }),
    });
    expect(revalidateAdminAccounts).toHaveBeenCalledTimes(1);
  });
});

describe("deleteAdmin", () => {
  it("blocks deleting your own account", async () => {
    const result = await deleteAdmin("admin-1");

    expect(result).toEqual({ success: false, error: "You cannot delete your own account." });
    expect(txMock.adminUser.delete).not.toHaveBeenCalled();
  });

  it("reports account-not-found", async () => {
    txMock.adminUser.findUnique.mockResolvedValue(null);

    const result = await deleteAdmin("missing");

    expect(result).toEqual({ success: false, error: "Account not found." });
    expect(txMock.adminUser.delete).not.toHaveBeenCalled();
  });

  it("blocks removing the last super-admin", async () => {
    txMock.adminUser.findUnique.mockResolvedValue({
      id: "a1",
      email: "a1@example.com",
      name: "A1",
      role: "SUPERADMIN",
    });
    txMock.adminUser.count.mockResolvedValue(1);

    const result = await deleteAdmin("a1");

    expect(result).toEqual({
      success: false,
      error: "Cannot remove the last COMELEC super-admin.",
    });
    expect(txMock.adminUser.delete).not.toHaveBeenCalled();
  });

  it("deletes the account, writes the audit row, and revalidates on success", async () => {
    txMock.adminUser.findUnique.mockResolvedValue({
      id: "a1",
      email: "a1@example.com",
      name: "A1",
      role: "OFFICER",
    });

    const result = await deleteAdmin("a1");

    expect(result).toEqual({ success: true });
    expect(txMock.adminUser.delete).toHaveBeenCalledWith({ where: { id: "a1" } });
    expect(txMock.adminAccountLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: "Deleted account", targetId: "a1" }),
    });
    expect(revalidateAdminAccounts).toHaveBeenCalledTimes(1);
  });
});
