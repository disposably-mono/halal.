import { DIVISION_LABELS } from "@/lib/ui/division-labels";
import {
  getRecentElectionIds,
  includesRecentElection,
  type RecentElectionFilter,
} from "../shared/recent-election-filter";
import { matches, normalize, orderDivisions } from "../shared/division-index";
import type { ElectionStatus } from "@prisma/client";

// Canonical status union: Prisma's ElectionStatus enum already has exactly
// these 4 values, so alias it instead of redeclaring the union.
export type CandidateIndexStatus = ElectionStatus;
export type CandidateStatusFilter = CandidateIndexStatus | "ALL";
export type CandidateDivisionFilter = string | "ALL";

export type CandidateIndexCandidate = {
  id: string;
  fullName: string;
  gradeLevel: number;
};

export type CandidateIndexPosition = {
  id: string;
  title: string;
  eligibleGrades: number[];
  candidateGrade: string;
  election: {
    id: string;
    name: string;
    division: string;
    createdAt: Date | string;
    status: CandidateIndexStatus;
    archivedAt?: Date | string | null;
  };
  candidates: CandidateIndexCandidate[];
};

export type CandidateElectionGroup = {
  id: string;
  name: string;
  division: string;
  createdAt: Date | string;
  status: CandidateIndexStatus;
  positions: CandidateIndexPosition[];
  positionCount: number;
  totalCandidates: number;
};

export type CandidateDivisionGroup = {
  division: string;
  label: string;
  elections: CandidateElectionGroup[];
  positionCount: number;
  totalCandidates: number;
};

export type CandidateIndexFilters = {
  query: string;
  status: CandidateStatusFilter;
  division: CandidateDivisionFilter;
  recentElectionCount?: RecentElectionFilter;
};

export function buildCandidateIndex(positions: readonly CandidateIndexPosition[]): CandidateDivisionGroup[] {
  const byDivision = new Map<string, Map<string, CandidateElectionGroup>>();

  for (const position of positions) {
    if (position.election.archivedAt) continue;

    const division = position.election.division;
    const electionId = position.election.id;
    const electionMap = byDivision.get(division) ?? new Map<string, CandidateElectionGroup>();
    const election = electionMap.get(electionId) ?? {
      id: electionId,
      name: position.election.name,
      division,
      createdAt: position.election.createdAt,
      status: position.election.status,
      positions: [],
      positionCount: 0,
      totalCandidates: 0,
    };
    const nextPosition = clonePosition(position);

    electionMap.set(electionId, {
      ...election,
      positions: [...election.positions, nextPosition],
      positionCount: election.positionCount + 1,
      totalCandidates: election.totalCandidates + nextPosition.candidates.length,
    });
    byDivision.set(division, electionMap);
  }

  return orderDivisions(Array.from(byDivision.entries())).map(([division, electionMap]) => {
    const elections = Array.from(electionMap.values());
    return {
      division,
      label: DIVISION_LABELS[division] ?? division,
      elections,
      positionCount: elections.reduce((sum, election) => sum + election.positionCount, 0),
      totalCandidates: elections.reduce((sum, election) => sum + election.totalCandidates, 0),
    };
  });
}

export function filterCandidateIndex(
  groups: readonly CandidateDivisionGroup[],
  filters: CandidateIndexFilters,
): CandidateDivisionGroup[] {
  const query = normalize(filters.query);
  const recentElectionIds = getRecentElectionIds(groups, filters.recentElectionCount ?? "ALL");

  return groups
    .filter((group) => filters.division === "ALL" || group.division === filters.division)
    .map((group) => {
      const elections = group.elections
        .filter((election) => includesRecentElection(election.id, recentElectionIds))
        .filter((election) => filters.status === "ALL" || election.status === filters.status)
        .map((election) => filterCandidateElection(election, query))
        .filter((election): election is CandidateElectionGroup => election !== null);

      return buildCandidateDivisionGroup(group.division, elections);
    })
    .filter((group) => group.elections.length > 0);
}

export function summarizeCandidateIndex(groups: readonly CandidateDivisionGroup[]) {
  const elections = groups.reduce((sum, group) => sum + group.elections.length, 0);
  const positions = groups.reduce((sum, group) => sum + group.positionCount, 0);
  const candidates = groups.reduce((sum, group) => sum + group.totalCandidates, 0);
  return { divisions: groups.length, elections, positions, candidates };
}

function filterCandidateElection(election: CandidateElectionGroup, query: string): CandidateElectionGroup | null {
  if (!query) return { ...election, positions: election.positions.map(clonePosition) };

  const electionMatches = matches(election.name, query);
  const positions = election.positions
    .map((position) => filterCandidatePosition(position, query, electionMatches))
    .filter((position): position is CandidateIndexPosition => position !== null);

  if (positions.length === 0) return null;
  return {
    ...election,
    positions,
    positionCount: positions.length,
    totalCandidates: positions.reduce((sum, position) => sum + position.candidates.length, 0),
  };
}

function filterCandidatePosition(
  position: CandidateIndexPosition,
  query: string,
  electionMatches: boolean,
): CandidateIndexPosition | null {
  const positionMatches = matches(position.title, query);
  if (electionMatches || positionMatches) return clonePosition(position);

  const candidates = position.candidates.filter((candidate) =>
    matches(candidate.fullName, query) || matches(String(candidate.gradeLevel), query),
  );
  if (candidates.length === 0) return null;
  return { ...clonePosition(position), candidates };
}

function buildCandidateDivisionGroup(
  division: string,
  elections: CandidateElectionGroup[],
): CandidateDivisionGroup {
  return {
    division,
    label: DIVISION_LABELS[division] ?? division,
    elections,
    positionCount: elections.reduce((sum, election) => sum + election.positionCount, 0),
    totalCandidates: elections.reduce((sum, election) => sum + election.totalCandidates, 0),
  };
}

function clonePosition(position: CandidateIndexPosition): CandidateIndexPosition {
  return {
    ...position,
    eligibleGrades: [...position.eligibleGrades],
    election: { ...position.election },
    candidates: position.candidates.map((candidate) => ({ ...candidate })),
  };
}
