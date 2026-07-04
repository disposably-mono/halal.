import { DIVISION_LABELS, DIVISION_ORDER } from "@/lib/ui/division-labels";
import {
  getRecentElectionIds,
  includesRecentElection,
  type RecentElectionFilter,
} from "../shared/recent-election-filter";

export type ResultsIndexStatus = "OPEN" | "CLOSED";
export type ResultsDivisionFilter = string | "ALL";
export type ResultsStatusFilter = ResultsIndexStatus | "ALL";

export type ResultsIndexCandidate = {
  id: string;
  fullName: string;
};

export type ResultsIndexPosition = {
  id: string;
  title: string;
  candidates: ResultsIndexCandidate[];
  winner: (ResultsIndexCandidate & { votes: number }) | null;
  draw: (ResultsIndexCandidate & { votes: number })[] | null;
  winnerVotes: number;
  totalVotes: number;
};

export type ResultsIndexElection = {
  id: string;
  name: string;
  division: string;
  createdAt: Date | string;
  status: ResultsIndexStatus;
  votedCount: number;
  voterCount: number;
  integrityFailure: boolean;
  positions: ResultsIndexPosition[];
};

export type ResultsElectionGroup = ResultsIndexElection;

export type ResultsDivisionGroup = {
  division: string;
  label: string;
  elections: ResultsElectionGroup[];
};

export type ResultsIndexFilters = {
  query: string;
  division: ResultsDivisionFilter;
  status: ResultsStatusFilter;
  recentElectionCount?: RecentElectionFilter;
};

export function buildResultsIndex(elections: readonly ResultsIndexElection[]): ResultsDivisionGroup[] {
  const byDivision = new Map<string, ResultsElectionGroup[]>();

  for (const election of elections) {
    const bucket = byDivision.get(election.division) ?? [];
    bucket.push(election);
    byDivision.set(election.division, bucket);
  }

  return orderDivisions(Array.from(byDivision.entries())).map(([division, groupElections]) => ({
    division,
    label: DIVISION_LABELS[division] ?? division,
    elections: groupElections,
  }));
}

export function filterResultsIndex(
  groups: readonly ResultsDivisionGroup[],
  filters: ResultsIndexFilters,
): ResultsDivisionGroup[] {
  const query = normalize(filters.query);
  const recentElectionIds = getRecentElectionIds(groups, filters.recentElectionCount ?? "ALL");

  return groups
    .filter((group) => filters.division === "ALL" || group.division === filters.division)
    .map((group) => ({
      division: group.division,
      label: group.label,
      elections: group.elections
        .filter((election) => includesRecentElection(election.id, recentElectionIds))
        .filter((election) => filters.status === "ALL" || election.status === filters.status)
        .map((election) => filterResultsElection(election, query))
        .filter((election): election is ResultsElectionGroup => election !== null),
    }))
    .filter((group) => group.elections.length > 0);
}

export function summarizeResultsIndex(groups: readonly ResultsDivisionGroup[]) {
  const elections = groups.reduce((sum, group) => sum + group.elections.length, 0);
  const positions = groups.reduce(
    (sum, group) => sum + group.elections.reduce((s, election) => s + election.positions.length, 0),
    0,
  );
  return { divisions: groups.length, elections, positions };
}

function filterResultsElection(election: ResultsElectionGroup, query: string): ResultsElectionGroup | null {
  if (!query) return election;

  const electionMatches = matches(election.name, query);
  if (electionMatches) return election;

  const positions = election.positions.filter((position) => {
    if (matches(position.title, query)) return true;
    return position.candidates.some((candidate) => matches(candidate.fullName, query));
  });

  if (positions.length === 0) return null;
  return { ...election, positions };
}

function orderDivisions<T>(entries: [string, T][]) {
  return [...entries].sort(([a], [b]) => divisionRank(a) - divisionRank(b) || a.localeCompare(b));
}

function divisionRank(division: string) {
  const index = DIVISION_ORDER.findIndex((value) => value === division);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function matches(value: string, query: string) {
  return normalize(value).includes(query);
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}
