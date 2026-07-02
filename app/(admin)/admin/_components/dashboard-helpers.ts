import { pct, type Election, type ElectionStatus } from "./shared";
import type { PersistedMonitorSnapshot, TurnoutTrendPoint } from "./dashboard-live-stats";

export type DashboardElection = Election;
export type DashboardStatusFilter = ElectionStatus | "ALL";

const STATUS_ORDER: ElectionStatus[] = ["OPEN", "SCHEDULED", "DRAFT", "CLOSED"];

export function buildDashboardSummary(
  elections: readonly DashboardElection[],
  uniqueStudentCount: number,
  totalRegistrations: number,
) {
  const statusCounts = STATUS_ORDER.map((status) => ({
    status,
    count: elections.filter((election) => election.status === status).length,
  }));
  const openElections = elections.filter((election) => election.status === "OPEN");
  const openVoters = openElections.reduce((sum, election) => sum + election._count.voters, 0);
  const openVoted = openElections.reduce((sum, election) => sum + election.votedCount, 0);
  const closedWithVoters = elections.filter(
    (election) => election.status === "CLOSED" && election._count.voters > 0,
  );
  const avgTurnout = closedWithVoters.length
    ? Math.round(
      closedWithVoters.reduce(
        (sum, election) => sum + pct(election.votedCount, election._count.voters),
        0,
      ) / closedWithVoters.length,
    )
    : null;

  return {
    activeNames: openElections.map((election) => election.name).join(", ") || "None active",
    activeTurnout: pct(openVoted, openVoters),
    avgTurnout,
    closedCount: closedWithVoters.length,
    openCount: openElections.length,
    statusBreakdown: statusCounts
      .filter(({ count }) => count > 0)
      .map(({ status, count }) => `${count} ${statusLabel(status, count)}`)
      .join(" · "),
    totalBallotsCast: elections.reduce((sum, election) => sum + election.votedCount, 0),
    totalElections: elections.length,
    totalRegistrations,
    uniqueStudentCount,
  };
}

export function filterDashboardElections(
  elections: readonly DashboardElection[],
  {
    query,
    status,
  }: {
    query: string;
    status: DashboardStatusFilter;
  },
): DashboardElection[] {
  const normalizedQuery = query.trim().toLowerCase();
  return elections.filter((election) => {
    const matchesStatus = status === "ALL" || election.status === status;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      election.name.toLowerCase().includes(normalizedQuery) ||
      election.division.toLowerCase().includes(normalizedQuery);
    return matchesStatus && matchesQuery;
  });
}

export function sortDashboardElections(elections: readonly DashboardElection[]): DashboardElection[] {
  return [...elections].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
  );
}

export function snapshotsToTurnoutTrend(
  snapshots: readonly PersistedMonitorSnapshot[],
  limit: number = 12,
): TurnoutTrendPoint[] {
  return snapshots
    .filter((snapshot) => snapshot.payload.turnout)
    .slice(-limit)
    .map((snapshot) => {
      const turnout = snapshot.payload.turnout!;
      return {
        label: new Date(snapshot.capturedAt).toLocaleTimeString("en-PH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        pct: turnout.pct,
        voted: turnout.voted,
        total: turnout.total,
      };
    });
}

function statusLabel(status: ElectionStatus, count: number): string {
  const labels: Record<ElectionStatus, string> = {
    OPEN: "open",
    SCHEDULED: "scheduled",
    DRAFT: "drafted",
    CLOSED: "closed",
  };
  return count === 1 ? labels[status] : labels[status];
}
