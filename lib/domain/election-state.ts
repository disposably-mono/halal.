import type { ElectionStatus } from "@prisma/client";

export type ValidationResult = { ok: true } | { ok: false; reason: string };

const ok = (): ValidationResult => ({ ok: true });
const fail = (reason: string): ValidationResult => ({ ok: false, reason });

export function canManuallyOpen(status: ElectionStatus): ValidationResult {
  if (status === "OPEN") return fail("Already open");
  if (status === "CLOSED") return fail("Cannot reopen a closed election");
  if (status === "DRAFT") return fail("Cannot open a draft election directly — advance to Scheduled first");
  return ok();
}

export function canManuallyClose(status: ElectionStatus): ValidationResult {
  if (status !== "OPEN") return fail("Election must be Open to close it");
  return ok();
}

export function canReschedule(
  status: ElectionStatus,
  scheduledOpen: Date | null,
  scheduledClose: Date | null,
): ValidationResult {
  if (status === "CLOSED") return fail("Cannot reschedule a closed election");
  if (scheduledOpen && scheduledClose && scheduledOpen >= scheduledClose) {
    return fail("Open time must be before close time");
  }
  return ok();
}

export function canAdvanceToScheduled(
  status: ElectionStatus,
  scheduledOpen: Date | null,
): ValidationResult {
  if (status !== "DRAFT") return fail("Only DRAFT elections can be advanced to Scheduled");
  if (!scheduledOpen) return fail("Set a scheduled open time first");
  return ok();
}

export function nextStatusForReschedule(scheduledOpen: Date | null): ElectionStatus {
  return scheduledOpen ? "SCHEDULED" : "DRAFT";
}

export function canFinalizeUnlock(status: ElectionStatus): ValidationResult {
  if (status === "OPEN" || status === "CLOSED") {
    return fail("Cannot unlock while the election is Open or Closed.");
  }
  return ok();
}

export function canArchive(
  status: ElectionStatus,
  archivedAt: Date | null,
): ValidationResult {
  if (archivedAt) return fail("Already archived");
  if (status === "OPEN") return fail("Close the election before archiving");
  if (status === "SCHEDULED") return fail("Unschedule the election before archiving");
  return ok();
}

export function canRestore(archivedAt: Date | null): ValidationResult {
  if (!archivedAt) return fail("Election is not archived");
  return ok();
}
