/**
 * Pure builders for `AdminAccountLog` rows (Finding H2). Kept separate from
 * `actions.ts` so the action-string logic is unit-testable without mocking
 * Prisma/session — the caller is responsible for the actual `create()` write,
 * inside the same transaction as the mutation it's recording.
 */

export type AccountLogActor = {
  id: string;
  email: string;
  name: string;
};

export type AccountLogTarget = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type AccountLogEntry = {
  action: string;
  actorId: string;
  actorEmail: string;
  actorName: string;
  targetId: string;
  targetEmail: string;
  targetName: string;
  targetRole: string;
};

function buildEntry(
  action: string,
  actor: AccountLogActor,
  target: AccountLogTarget,
): AccountLogEntry {
  return {
    action,
    actorId: actor.id,
    actorEmail: actor.email,
    actorName: actor.name,
    targetId: target.id,
    targetEmail: target.email,
    targetName: target.name,
    targetRole: target.role,
  };
}

export function createdAccountEntry(
  actor: AccountLogActor,
  target: AccountLogTarget,
): AccountLogEntry {
  return buildEntry("Created account", actor, target);
}

export function roleChangedEntry(
  actor: AccountLogActor,
  target: AccountLogTarget,
  fromRole: string,
): AccountLogEntry {
  return buildEntry(`Changed role: ${fromRole} → ${target.role}`, actor, target);
}

// Credential resets are the security-sensitive case this finding is about: one
// SUPERADMIN can reset another SUPERADMIN's password or officer key. The target
// role is embedded directly in the action string (in addition to the dedicated
// `targetRole` field) so a reset against a super-admin account is unmistakable
// at a glance in the history table, not just visible via a separate column.
export function passwordResetEntry(
  actor: AccountLogActor,
  target: AccountLogTarget,
): AccountLogEntry {
  return buildEntry(`Reset password (target role: ${target.role})`, actor, target);
}

export function officerKeyResetEntry(
  actor: AccountLogActor,
  target: AccountLogTarget,
): AccountLogEntry {
  return buildEntry(`Reset officer key (target role: ${target.role})`, actor, target);
}

export function deletedAccountEntry(
  actor: AccountLogActor,
  target: AccountLogTarget,
): AccountLogEntry {
  return buildEntry("Deleted account", actor, target);
}
