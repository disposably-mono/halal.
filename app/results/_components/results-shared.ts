export interface ElectionMeta {
  id: string;
  name: string;
  division: string;
  status: string;
}

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
  name: string;
  division: string;
  embargoed: boolean;
  positions: PositionResult[];
  turnout: TurnoutData | null;
}

export const DIVISION_LABELS: Record<string, string> = {
  GS: "Grade School",
  JHS: "Junior High School",
  SHS: "Senior High School",
  HC: "House Council",
};

export const POLL_INTERVAL = 30000;
