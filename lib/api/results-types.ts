/**
 * Wire types returned by `GET /api/results/[id]`.
 *
 * Only the truly-identical fragments of the response are shared here.
 * Admin (`?admin=1`) and public consumers see different overall payload
 * shapes (admin gets `abstentions`; public gets `name`/`division`/
 * `embargoed`), so each consumer keeps its own narrower payload type
 * locally and re-exports the pieces below.
 *
 * Distinct from `lib/domain/tally.ts`'s `CandidateResult`, which is the
 * server-side computed shape with optional domain-only fields.
 */

export interface CandidateResult {
  id: string;
  fullName: string;
  gradeLevel: number;
  votes: number;
  isWinner: boolean;
  isTie: boolean;
}

export interface TurnoutData {
  voted: number;
  total: number;
  pct: number;
}
