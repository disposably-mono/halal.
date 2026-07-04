export const RECENT_ELECTION_OPTIONS = [1, 2, 5, 10] as const;

export type RecentElectionCount = (typeof RECENT_ELECTION_OPTIONS)[number];
export type RecentElectionFilter = RecentElectionCount | "ALL";

export type RecentElection = {
  id: string;
  createdAt?: Date | string | null;
};

export type RecentElectionGroup = {
  elections: readonly RecentElection[];
};

export function getRecentElectionIds(
  groups: readonly RecentElectionGroup[],
  recentElectionCount: RecentElectionFilter,
): readonly string[] | null {
  if (recentElectionCount === "ALL") return null;

  return groups
    .flatMap((group) => group.elections)
    .map((election, index) => ({
      id: election.id,
      createdAtMs: toCreatedAtMs(election.createdAt),
      index,
    }))
    .toSorted((a, b) => b.createdAtMs - a.createdAtMs || a.index - b.index)
    .slice(0, recentElectionCount)
    .map((election) => election.id);
}

export function includesRecentElection(
  electionId: string,
  recentElectionIds: readonly string[] | null,
) {
  return recentElectionIds === null || recentElectionIds.includes(electionId);
}

export function formatRecentElectionFilter(value: RecentElectionFilter) {
  if (value === "ALL") return "All elections";
  if (value === 1) return "Most recent election";
  return `Most recent ${value} elections`;
}

function toCreatedAtMs(createdAt: Date | string | null | undefined) {
  if (!createdAt) return 0;

  const time = createdAt instanceof Date
    ? createdAt.getTime()
    : new Date(createdAt).getTime();

  return Number.isFinite(time) ? time : 0;
}
