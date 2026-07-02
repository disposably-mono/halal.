import { DIVISION_LABELS, DIVISION_ORDER } from "@/lib/ui/division-labels";

export type VoterIndexStatus = "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED";
export type VoterStatusFilter = VoterIndexStatus | "ALL";
export type VoterDivisionFilter = string | "ALL";
export type VoteStatusFilter = "ALL" | "VOTED" | "PENDING";

export type VoterIndexRow = {
  id: string;
  studentId: string;
  voterCode: string;
  gradeLevel: number;
  section: string;
  hasVoted: boolean;
  division: string;
  election: {
    id: string;
    name: string;
    division: string;
    status: VoterIndexStatus;
  };
};

export type VoterElectionGroup = {
  id: string;
  name: string;
  division: string;
  status: VoterIndexStatus;
  voters: VoterIndexRow[];
  voterCount: number;
  votedCount: number;
};

export type VoterDivisionGroup = {
  division: string;
  label: string;
  elections: VoterElectionGroup[];
  voterCount: number;
  votedCount: number;
};

export type VoterIndexFilters = {
  query: string;
  status: VoterStatusFilter;
  division: VoterDivisionFilter;
  voteStatus: VoteStatusFilter;
};

export function buildVoterIndex(voters: readonly VoterIndexRow[]): VoterDivisionGroup[] {
  const byDivision = new Map<string, Map<string, VoterElectionGroup>>();

  for (const voter of voters) {
    const division = voter.division;
    const electionId = voter.election.id;
    const electionMap = byDivision.get(division) ?? new Map<string, VoterElectionGroup>();
    const election = electionMap.get(electionId) ?? {
      id: electionId,
      name: voter.election.name,
      division,
      status: voter.election.status,
      voters: [],
      voterCount: 0,
      votedCount: 0,
    };
    const nextVoter = cloneVoter(voter);

    electionMap.set(electionId, {
      ...election,
      voters: [...election.voters, nextVoter],
      voterCount: election.voterCount + 1,
      votedCount: election.votedCount + (nextVoter.hasVoted ? 1 : 0),
    });
    byDivision.set(division, electionMap);
  }

  return orderDivisions(Array.from(byDivision.entries())).map(([division, electionMap]) =>
    buildVoterDivisionGroup(division, Array.from(electionMap.values())),
  );
}

export function filterVoterIndex(
  groups: readonly VoterDivisionGroup[],
  filters: VoterIndexFilters,
): VoterDivisionGroup[] {
  const query = normalize(filters.query);

  return groups
    .filter((group) => filters.division === "ALL" || group.division === filters.division)
    .map((group) => {
      const elections = group.elections
        .filter((election) => filters.status === "ALL" || election.status === filters.status)
        .map((election) => filterVoterElection(election, query, filters.voteStatus))
        .filter((election): election is VoterElectionGroup => election !== null);

      return buildVoterDivisionGroup(group.division, elections);
    })
    .filter((group) => group.elections.length > 0);
}

export function summarizeVoterIndex(groups: readonly VoterDivisionGroup[]) {
  const elections = groups.reduce((sum, group) => sum + group.elections.length, 0);
  const voters = groups.reduce((sum, group) => sum + group.voterCount, 0);
  const voted = groups.reduce((sum, group) => sum + group.votedCount, 0);
  return { divisions: groups.length, elections, voters, voted, pending: voters - voted };
}

function filterVoterElection(
  election: VoterElectionGroup,
  query: string,
  voteStatus: VoteStatusFilter,
): VoterElectionGroup | null {
  const electionMatches = query.length > 0 && matches(election.name, query);
  const voters = election.voters.filter((voter) =>
    matchesVoteStatus(voter, voteStatus) && (electionMatches || matchesVoter(voter, query)),
  );
  if (voters.length === 0) return null;
  return buildVoterElectionGroup(election, voters);
}

function buildVoterElectionGroup(
  election: Pick<VoterElectionGroup, "id" | "name" | "division" | "status">,
  voters: VoterIndexRow[],
): VoterElectionGroup {
  return {
    id: election.id,
    name: election.name,
    division: election.division,
    status: election.status,
    voters,
    voterCount: voters.length,
    votedCount: voters.filter((voter) => voter.hasVoted).length,
  };
}

function buildVoterDivisionGroup(division: string, elections: VoterElectionGroup[]): VoterDivisionGroup {
  return {
    division,
    label: DIVISION_LABELS[division] ?? division,
    elections,
    voterCount: elections.reduce((sum, election) => sum + election.voterCount, 0),
    votedCount: elections.reduce((sum, election) => sum + election.votedCount, 0),
  };
}

function matchesVoteStatus(voter: VoterIndexRow, voteStatus: VoteStatusFilter) {
  if (voteStatus === "VOTED") return voter.hasVoted;
  if (voteStatus === "PENDING") return !voter.hasVoted;
  return true;
}

function matchesVoter(voter: VoterIndexRow, query: string) {
  if (!query) return true;
  return [
    voter.voterCode,
    voter.studentId,
    voter.section,
    String(voter.gradeLevel),
  ].some((value) => matches(value, query));
}

function cloneVoter(voter: VoterIndexRow): VoterIndexRow {
  return { ...voter, election: { ...voter.election } };
}

function orderDivisions<T>(entries: [string, T][]) {
  return [...entries].sort(
    ([a], [b]) => divisionRank(a) - divisionRank(b) || a.localeCompare(b),
  );
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
