export interface CandidateResult {
  id: string;
  fullName: string;
  gradeLevel: number;
  votes: number;
}

export interface PositionResult {
  id: string;
  title: string;
  order: number;
  candidates: CandidateResult[];
  abstentions: number;
  totalVotes: number;
}

export interface TurnoutData {
  voted: number;
  total: number;
  pct: number;
}

export interface ResultsPayload {
  electionId: string;
  status: string;
  positions: PositionResult[];
  turnout: TurnoutData | null;
}

export interface Snapshot {
  timestamp: Date;
  label: string;
  payload: ResultsPayload;
}

export const POLL_INTERVAL = 30_000;
export const MAX_SNAPSHOTS = 60;

export const DIVISION_LABELS: Record<string, string> = {
  GS: "Grade School",
  JHS: "Junior High School",
  SHS: "Senior High School",
  HC: "House Council",
};
