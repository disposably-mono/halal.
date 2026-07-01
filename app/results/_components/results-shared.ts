export interface ElectionMeta {
  id: string;
  name: string;
  division: string;
  status: string;
}

import type { CandidateResult, TurnoutData, ElectionAuditData } from "@/lib/api/results-types";

export type { CandidateResult, TurnoutData };

export interface PositionResult {
  id: string;
  title: string;
  order: number;
  candidates: CandidateResult[];
  totalVotes: number;
}

export interface ResultsPayload {
  electionId: string;
  status: string;
  name: string;
  division: string;
  embargoed: boolean;
  positions: PositionResult[];
  turnout: TurnoutData | null;
  audit: ElectionAuditData;
  integrityFailure?: boolean;
}

export { DIVISION_LABELS, DIVISION_CODES } from "@/lib/ui/division-labels";

export const POLL_INTERVAL = 30000;
