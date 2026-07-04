"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import type { Session } from "next-auth";
import {
  adminEmailFromSession,
  adminIdFromSession,
  adminNameFromSession,
} from "@/lib/server/auth";
import { isGrantableRole } from "@/lib/auth/permissions";
import { revalidateAdminAccounts } from "@/lib/server/revalidate";
import {
  CreateAdminSchema,
  DeleteAdminSchema,
  ResetOfficerKeySchema,
  ResetPasswordSchema,
  UpdateAdminRoleSchema,
  safeParseFormData,
} from "@/lib/validation/schemas";
import {
  createdAccountEntry,
  deletedAccountEntry,
  officerKeyResetEntry,
  passwordResetEntry,
  roleChangedEntry,
  type AccountLogActor,
} from "./account-log";
import {
  auditedAction,
  TransitionValidationError,
} from "@/lib/server/audited-action";

const HASH_ROUNDS = 12;

function actorFromSession(session: Session): AccountLogActor {
  return {
    id: adminIdFromSession(session),
    email: adminEmailFromSession(session),
    name: adminNameFromSession(session),
  };
}

// H2 audit-trail tradeoff: credential resets (resetAdminPassword,
// resetAdminOfficerKey) are deliberately NOT blocked against SUPERADMIN
// targets. The two bootstrap super-admins must be able to recover each
// other's lost password/officer key — that's the whole point of having two.
// The risk this finding raises (one super-admin silently resetting another's
// credentials and logging in as them) is real, but the fix is visibility, not
// a block: every credential reset writes an AdminAccountLog row naming the
// actor, the target, and the target's role, so the action is unmistakable and
// permanently attributable instead of silent. See AdminAccountLog in
// prisma/schema.prisma and app/(admin)/admin/history/page.tsx for the read side.

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
async function assertNotLastSuperadmin(
  tx: Prisma.TransactionClient,
  targetRole: string,
): Promise<void> {
  if (targetRole !== "SUPERADMIN") return;
  const superadmins = await tx.adminUser.count({ where: { role: "SUPERADMIN" } });
  if (superadmins <= 1) {
    throw new TransitionValidationError("Cannot remove the last COMELEC super-admin.");
  }
}

const runCreateAdmin = auditedAction<[prev: AccountActionResult | null, formData: FormData]>({
  name: "createAdmin",
  capability: "accounts:manage",
  errorMessage: "Failed to create account.",
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  mapError: (error) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return "An account with that email already exists.";
    }
    if (isSerializationConflict(error)) return CONCURRENT_WRITE_MESSAGE;
    return null;
  },
  run: async (tx, session, _prev, formData) => {
    const parsed = safeParseFormData(CreateAdminSchema, formData);
    if (!parsed.success) {
      throw new TransitionValidationError(
        parsed.error.issues[0]?.message ?? "Invalid account details.",
      );
    }

    const { email, name, role, password, officerKey } = parsed.data;
    if (!isGrantableRole(role)) {
      throw new TransitionValidationError("Super-admin can no longer be granted.");
    }

    // Check-then-write on officer-key uniqueness is a TOCTOU hazard: two
    // concurrent createAdmin calls could both pass the check and create two
    // accounts sharing a key, weakening the "different account co-signs login"
    // 2FA guarantee. Serializable isolation (set above) makes Postgres abort
    // one of the two concurrent transactions instead. Checked before hashing
    // so a doomed request skips two bcrypt hashes.
    if (await officerKeyIsInUse(tx, officerKey)) {
      throw new TransitionValidationError(
        "That officer key is already assigned to another account.",
      );
    }

    const [passwordHash, officerKeyHash] = await Promise.all([
      bcrypt.hash(password, HASH_ROUNDS),
      bcrypt.hash(officerKey, HASH_ROUNDS),
    ]);

    const actor = actorFromSession(session);
    const created = await tx.adminUser.create({
      data: { email, name, role, passwordHash, officerKey: officerKeyHash },
    });
    await tx.adminAccountLog.create({
      data: createdAccountEntry(actor, {
        id: created.id,
        email: created.email,
        name: created.name,
        role: created.role,
      }),
    });
  },
});

export async function createAdmin(
  prev: AccountActionResult | null,
  formData: FormData,
): Promise<AccountActionResult> {
  const result = await runCreateAdmin(prev, formData);
  if (result.success) revalidateAdminAccounts();
  return result;
}

const runUpdateAdminRole = auditedAction<[adminId: string, role: string]>({
  name: "updateAdminRole",
  capability: "accounts:manage",
  errorMessage: "Failed to update account role.",
  run: async (tx, session, adminId, role) => {
    const parsed = UpdateAdminRoleSchema.safeParse({ adminId, role });
    if (!parsed.success) throw new TransitionValidationError("Invalid role.");

    // SUPERADMIN is a fixed tier: it can never be handed out as a new role.
    if (!isGrantableRole(parsed.data.role)) {
      throw new TransitionValidationError("Super-admin can no longer be granted.");
    }

    const target = await tx.adminUser.findUnique({
      where: { id: parsed.data.adminId },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!target) throw new TransitionValidationError("Account not found.");
    if (target.role === parsed.data.role) return;

    // ...and an existing super-admin can never be demoted: the COMELEC tier is locked.
    if (target.role === "SUPERADMIN") {
      throw new TransitionValidationError("Super-admin accounts are locked.");
    }

    await assertNotLastSuperadmin(tx, target.role);

    const actor = actorFromSession(session);
    await tx.adminUser.update({
      where: { id: parsed.data.adminId },
      data: { role: parsed.data.role },
    });
    await tx.adminAccountLog.create({
      data: roleChangedEntry(
        actor,
        { id: target.id, email: target.email, name: target.name, role: parsed.data.role },
        target.role,
      ),
    });
  },
});

export async function updateAdminRole(
  adminId: string,
  role: string,
): Promise<AccountActionResult> {
  const result = await runUpdateAdminRole(adminId, role);
  if (result.success) revalidateAdminAccounts();
  return result;
}

const runResetAdminPassword = auditedAction<[adminId: string, password: string]>({
  name: "resetAdminPassword",
  capability: "accounts:manage",
  errorMessage: "Failed to reset password.",
  run: async (tx, session, adminId, password) => {
    const parsed = ResetPasswordSchema.safeParse({ adminId, password });
    if (!parsed.success) {
      throw new TransitionValidationError(
        parsed.error.issues[0]?.message ?? "Invalid password.",
      );
    }

    const target = await tx.adminUser.findUnique({
      where: { id: parsed.data.adminId },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!target) throw new TransitionValidationError("Account not found.");

    const passwordHash = await bcrypt.hash(parsed.data.password, HASH_ROUNDS);
    const actor = actorFromSession(session);

    await tx.adminUser.update({
      where: { id: parsed.data.adminId },
      data: { passwordHash },
    });
    await tx.adminAccountLog.create({
      data: passwordResetEntry(actor, target),
    });
  },
});

export async function resetAdminPassword(
  adminId: string,
  password: string,
): Promise<AccountActionResult> {
  const result = await runResetAdminPassword(adminId, password);
  if (result.success) revalidateAdminAccounts();
  return result;
}

const runResetAdminOfficerKey = auditedAction<[adminId: string, officerKey: string]>({
  name: "resetAdminOfficerKey",
  capability: "accounts:manage",
  errorMessage: "Failed to reset officer key.",
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  mapError: (error) => (isSerializationConflict(error) ? CONCURRENT_WRITE_MESSAGE : null),
  run: async (tx, session, adminId, officerKey) => {
    const parsed = ResetOfficerKeySchema.safeParse({ adminId, officerKey });
    if (!parsed.success) {
      throw new TransitionValidationError(
        parsed.error.issues[0]?.message ?? "Invalid officer key.",
      );
    }

    const target = await tx.adminUser.findUnique({
      where: { id: parsed.data.adminId },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!target) throw new TransitionValidationError("Account not found.");

    // Same TOCTOU hazard as createAdmin: wrap the uniqueness check and the
    // write in one Serializable transaction (isolationLevel set above) so two
    // concurrent resets can't both land on the same key.
    if (await officerKeyIsInUse(tx, parsed.data.officerKey, parsed.data.adminId)) {
      throw new TransitionValidationError(
        "That officer key is already assigned to another account.",
      );
    }

    const officerKeyHash = await bcrypt.hash(parsed.data.officerKey, HASH_ROUNDS);
    const actor = actorFromSession(session);

    await tx.adminUser.update({
      where: { id: parsed.data.adminId },
      data: { officerKey: officerKeyHash },
    });
    await tx.adminAccountLog.create({
      data: officerKeyResetEntry(actor, target),
    });
  },
});

export async function resetAdminOfficerKey(
  adminId: string,
  officerKey: string,
): Promise<AccountActionResult> {
  const result = await runResetAdminOfficerKey(adminId, officerKey);
  if (result.success) revalidateAdminAccounts();
  return result;
}

const runDeleteAdmin = auditedAction<[adminId: string]>({
  name: "deleteAdmin",
  capability: "accounts:manage",
  errorMessage: "Failed to delete account.",
  run: async (tx, session, adminId) => {
    const parsed = DeleteAdminSchema.safeParse({ adminId });
    if (!parsed.success) throw new TransitionValidationError("Invalid account.");

    // Never let an admin delete their own account (avoids self lock-out).
    if (parsed.data.adminId === session.user?.id) {
      throw new TransitionValidationError("You cannot delete your own account.");
    }

    const target = await tx.adminUser.findUnique({
      where: { id: parsed.data.adminId },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!target) throw new TransitionValidationError("Account not found.");

    await assertNotLastSuperadmin(tx, target.role);

    const actor = actorFromSession(session);
    await tx.adminUser.delete({ where: { id: parsed.data.adminId } });
    await tx.adminAccountLog.create({
      data: deletedAccountEntry(actor, target),
    });
  },
});

export async function deleteAdmin(adminId: string): Promise<AccountActionResult> {
  const result = await runDeleteAdmin(adminId);
  if (result.success) revalidateAdminAccounts();
  return result;
}
