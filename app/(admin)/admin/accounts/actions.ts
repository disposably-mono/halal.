"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCapabilityOrError } from "@/lib/server/auth";
import { isGrantableRole, permissionErrorMessage } from "@/lib/auth/permissions";
import { revalidateAdminAccounts } from "@/lib/server/revalidate";
import {
  CreateAdminSchema,
  DeleteAdminSchema,
  ResetOfficerKeySchema,
  ResetPasswordSchema,
  UpdateAdminRoleSchema,
  safeParseFormData,
} from "@/lib/validation/schemas";

const HASH_ROUNDS = 12;

export type AccountActionResult =
  | { success: true }
  | { success: false; error: string };

async function officerKeyIsInUse(
  client: Prisma.TransactionClient,
  officerKey: string,
  excludeAdminId?: string,
): Promise<boolean> {
  // O(n) by design: officer keys are stored as bcrypt hashes (per-row salt), so
  // uniqueness cannot be checked with an indexed lookup — we must bcrypt-compare
  // against every admin's hash. Admin accounts number in the low single digits at
  // school scale, so this linear scan is an accepted tradeoff.
  const accounts = await client.adminUser.findMany({
    where: excludeAdminId ? { id: { not: excludeAdminId } } : undefined,
    select: { officerKey: true },
  });

  for (const account of accounts) {
    if (await bcrypt.compare(officerKey, account.officerKey)) return true;
  }
  return false;
}

const CONCURRENT_WRITE_MESSAGE =
  "Another account change happened at the same time. Please try again.";

/**
 * True when a Prisma error is a serializable-transaction conflict (P2034).
 * The check-then-write for officer-key uniqueness runs inside a Serializable
 * transaction (see createAdmin / resetAdminOfficerKey) so concurrent callers
 * racing on the same key never both succeed — Postgres aborts the loser with
 * this error instead, and we surface it as a "please retry" message.
 */
function isSerializationConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034"
  );
}

/**
 * Guards a SUPERADMIN demotion/deletion so the last super-admin can never be
 * removed (which would lock everyone out of account management). The count and
 * the mutation run in one transaction to avoid a concurrent-removal race.
 */
async function lastSuperadminBlock(
  tx: Prisma.TransactionClient,
  targetRole: string,
): Promise<AccountActionResult | null> {
  if (targetRole !== "SUPERADMIN") return null;
  const superadmins = await tx.adminUser.count({ where: { role: "SUPERADMIN" } });
  if (superadmins <= 1) {
    return { success: false, error: "Cannot remove the last COMELEC super-admin." };
  }
  return null;
}

export async function createAdmin(
  _prev: AccountActionResult | null,
  formData: FormData,
): Promise<AccountActionResult> {
  const guard = await requireCapabilityOrError("accounts:manage");
  if (!guard.ok) return { success: false, error: permissionErrorMessage(guard.error) };

  const parsed = safeParseFormData(CreateAdminSchema, formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid account details.",
    };
  }

  const { email, name, role, password, officerKey } = parsed.data;
  if (!isGrantableRole(role)) {
    return { success: false, error: "Super-admin can no longer be granted." };
  }

  const [passwordHash, officerKeyHash] = await Promise.all([
    bcrypt.hash(password, HASH_ROUNDS),
    bcrypt.hash(officerKey, HASH_ROUNDS),
  ]);

  // Check-then-write on officer-key uniqueness is a TOCTOU hazard: two
  // concurrent createAdmin calls could both pass the check and create two
  // accounts sharing a key, weakening the "different account co-signs login"
  // 2FA guarantee. Serializable isolation makes Postgres abort one of the two
  // concurrent transactions instead.
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        if (await officerKeyIsInUse(tx, officerKey)) {
          return {
            success: false,
            error: "That officer key is already assigned to another account.",
          } as const;
        }
        await tx.adminUser.create({
          data: { email, name, role, passwordHash, officerKey: officerKeyHash },
        });
        return { success: true } as const;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    if (!result.success) return result;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { success: false, error: "An account with that email already exists." };
    }
    if (isSerializationConflict(error)) {
      return { success: false, error: CONCURRENT_WRITE_MESSAGE };
    }
    throw error;
  }

  revalidateAdminAccounts();
  return { success: true };
}

export async function updateAdminRole(
  adminId: string,
  role: string,
): Promise<AccountActionResult> {
  const guard = await requireCapabilityOrError("accounts:manage");
  if (!guard.ok) return { success: false, error: permissionErrorMessage(guard.error) };

  const parsed = UpdateAdminRoleSchema.safeParse({ adminId, role });
  if (!parsed.success) return { success: false, error: "Invalid role." };

  // SUPERADMIN is a fixed tier: it can never be handed out as a new role.
  if (!isGrantableRole(parsed.data.role)) {
    return { success: false, error: "Super-admin can no longer be granted." };
  }

  const result = await prisma.$transaction(async (tx) => {
    const target = await tx.adminUser.findUnique({
      where: { id: parsed.data.adminId },
      select: { role: true },
    });
    if (!target) return { success: false, error: "Account not found." } as const;
    if (target.role === parsed.data.role) return { success: true } as const;

    // ...and an existing super-admin can never be demoted: the COMELEC tier is locked.
    if (target.role === "SUPERADMIN") {
      return { success: false, error: "Super-admin accounts are locked." } as const;
    }

    const blocked = await lastSuperadminBlock(tx, target.role);
    if (blocked) return blocked;

    await tx.adminUser.update({
      where: { id: parsed.data.adminId },
      data: { role: parsed.data.role },
    });
    return { success: true } as const;
  });

  if (result.success) revalidateAdminAccounts();
  return result;
}

export async function resetAdminPassword(
  adminId: string,
  password: string,
): Promise<AccountActionResult> {
  const guard = await requireCapabilityOrError("accounts:manage");
  if (!guard.ok) return { success: false, error: permissionErrorMessage(guard.error) };

  const parsed = ResetPasswordSchema.safeParse({ adminId, password });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid password.",
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, HASH_ROUNDS);
  await prisma.adminUser.update({
    where: { id: parsed.data.adminId },
    data: { passwordHash },
  });

  revalidateAdminAccounts();
  return { success: true };
}

export async function resetAdminOfficerKey(
  adminId: string,
  officerKey: string,
): Promise<AccountActionResult> {
  const guard = await requireCapabilityOrError("accounts:manage");
  if (!guard.ok) return { success: false, error: permissionErrorMessage(guard.error) };

  const parsed = ResetOfficerKeySchema.safeParse({ adminId, officerKey });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid officer key.",
    };
  }

  const officerKeyHash = await bcrypt.hash(parsed.data.officerKey, HASH_ROUNDS);

  // Same TOCTOU hazard as createAdmin: wrap the uniqueness check and the
  // write in one Serializable transaction so two concurrent resets can't both
  // land on the same key.
  const result = await prisma.$transaction(
    async (tx) => {
      if (await officerKeyIsInUse(tx, parsed.data.officerKey, parsed.data.adminId)) {
        return {
          success: false,
          error: "That officer key is already assigned to another account.",
        } as const;
      }
      await tx.adminUser.update({
        where: { id: parsed.data.adminId },
        data: { officerKey: officerKeyHash },
      });
      return { success: true } as const;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  ).catch((error) => {
    if (isSerializationConflict(error)) {
      return { success: false, error: CONCURRENT_WRITE_MESSAGE } as const;
    }
    throw error;
  });

  if (result.success) revalidateAdminAccounts();
  return result;
}

export async function deleteAdmin(adminId: string): Promise<AccountActionResult> {
  const guard = await requireCapabilityOrError("accounts:manage");
  if (!guard.ok) return { success: false, error: permissionErrorMessage(guard.error) };

  const parsed = DeleteAdminSchema.safeParse({ adminId });
  if (!parsed.success) return { success: false, error: "Invalid account." };

  // Never let an admin delete their own account (avoids self lock-out).
  if (parsed.data.adminId === guard.session.user?.id) {
    return { success: false, error: "You cannot delete your own account." };
  }

  const result = await prisma.$transaction(async (tx) => {
    const target = await tx.adminUser.findUnique({
      where: { id: parsed.data.adminId },
      select: { role: true },
    });
    if (!target) return { success: false, error: "Account not found." } as const;

    const blocked = await lastSuperadminBlock(tx, target.role);
    if (blocked) return blocked;

    await tx.adminUser.delete({ where: { id: parsed.data.adminId } });
    return { success: true } as const;
  });

  if (result.success) revalidateAdminAccounts();
  return result;
}
