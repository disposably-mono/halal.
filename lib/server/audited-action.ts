/**
 * Shared wrapper for admin server actions that guard on a capability, run a
 * Prisma transaction, and write an audit row as part of that same transaction
 * (see HANDOFF.md section 5). Centralizes the guard → transaction → error
 * mapping boilerplate that was previously hand-rolled in every actions file;
 * the row lock, status re-check, mutation, and audit write stay inside the
 * caller's `run` callback, since those are load-bearing and action-specific.
 */

import { Prisma } from "@prisma/client";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";
import { requireCapabilityOrError } from "@/lib/server/auth";
import { permissionErrorMessage, type Capability } from "@/lib/auth/permissions";

/** Throw inside `run` for expected validation failures — the message is surfaced verbatim. */
export class TransitionValidationError extends Error {}

export type ActionResult = { success: true } | { success: false; error: string };

type AuditedActionOptions<Args extends unknown[]> = {
  /** Used only in the `[name]` prefix of the console.error log on unexpected failures. */
  name: string;
  capability: Capability;
  /** Returned to the caller (and logged) when `run` throws anything other than TransitionValidationError. */
  errorMessage: string;
  isolationLevel?: Prisma.TransactionIsolationLevel;
  /** Row lock, status re-check, mutation, and audit write all happen here, inside the transaction. */
  run: (tx: Prisma.TransactionClient, session: Session, ...args: Args) => Promise<void>;
  /**
   * Recognize an error thrown by `run` (e.g. a Prisma unique-constraint or
   * serialization-conflict error) and translate it into a user-facing message.
   * Return null to fall through to the generic `errorMessage`.
   */
  mapError?: (error: unknown) => string | null;
};

export function auditedAction<Args extends unknown[]>(
  opts: AuditedActionOptions<Args>,
): (...args: Args) => Promise<ActionResult> {
  return async (...args: Args): Promise<ActionResult> => {
    const guard = await requireCapabilityOrError(opts.capability);
    if (!guard.ok) return { success: false, error: permissionErrorMessage(guard.error) };

    try {
      await prisma.$transaction(
        (tx) => opts.run(tx, guard.session, ...args),
        opts.isolationLevel ? { isolationLevel: opts.isolationLevel } : undefined,
      );
    } catch (error) {
      if (error instanceof TransitionValidationError) {
        return { success: false, error: error.message };
      }
      const mapped = opts.mapError?.(error) ?? null;
      if (mapped) return { success: false, error: mapped };
      console.error(`[${opts.name}] transition failed:`, error);
      return { success: false, error: opts.errorMessage };
    }
    return { success: true };
  };
}
