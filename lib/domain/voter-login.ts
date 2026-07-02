/**
 * Pure copy/selection for the voter-login "election is not open" branch. Kept
 * out of the server action so it can be unit-tested and so the wording lives in
 * one place.
 */

/** Human messages for each non-OPEN status a voter code can resolve to. */
export const NOT_OPEN_STATUS_MESSAGES: Record<string, string> = {
  DRAFT: "This election has not been opened yet.",
  SCHEDULED: "Voting has not started yet. Check the schedule.",
  CLOSED: "This election has already closed.",
};

/**
 * Appended when the voter's code resolves to a non-open election BUT the same
 * student has another election that is currently open and unvoted. Deliberately
 * generic: it names no election, code, or count — it only nudges the voter to
 * try their other slip.
 */
export const OTHER_OPEN_ELECTION_HINT =
  " If you were given more than one voter slip, check your other control number.";

export function notOpenMessage(
  status: string,
  hasOtherOpenElection: boolean,
): string {
  const base =
    NOT_OPEN_STATUS_MESSAGES[status] ?? "This election is not currently open.";
  return hasOtherOpenElection ? base + OTHER_OPEN_ELECTION_HINT : base;
}
