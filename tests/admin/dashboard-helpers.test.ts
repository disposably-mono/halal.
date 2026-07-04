import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  buildDashboardSummary,
  filterDashboardBuckets,
  filterDashboardElections,
  snapshotsToTurnoutTrend,
  type DashboardElection,
} from "@/app/(admin)/admin/_components/dashboard-helpers";
import type { PersistedMonitorSnapshot } from "@/app/(admin)/admin/_components/dashboard-live-stats";

const baseElection: DashboardElection = {
  id: "election-1",
  name: "JHS Election",
  division: "JHS",
  status: "OPEN",
  scheduledOpen: null,
  scheduledClose: null,
  archivedAt: null,
  archivedBy: null,
  createdAt: new Date("2026-07-01T00:00:00.000Z"),
  _count: { voters: 100, votes: 30, positions: 4, candidates: 8 },
  votedCount: 30,
};

describe("dashboard helpers", () => {
  // snapshotsToTurnoutTrend formats labels with toLocaleTimeString, which resolves
  // against the system TZ (the "en-PH" locale only controls formatting, not the
  // timezone conversion) — pin it so the expected "08:0x AM" labels below don't
  // depend on the machine/CI runner's local timezone.
  const originalTZ = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = "Asia/Manila";
  });

  afterAll(() => {
    if (originalTZ === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTZ;
    }
  });

  test("summarizes active election state without mutating input", () => {
    const elections = [
      baseElection,
      { ...baseElection, id: "election-2", name: "GS Election", status: "DRAFT", votedCount: 0 },
    ] satisfies DashboardElection[];

    expect(buildDashboardSummary(elections, 80, 120)).toEqual({
      activeNames: "JHS Election",
      activeTurnout: 30,
      avgTurnout: null,
      closedCount: 0,
      openCount: 1,
      statusBreakdown: "1 open · 1 drafted",
      totalBallotsCast: 30,
      totalElections: 2,
      totalRegistrations: 120,
      uniqueStudentCount: 80,
    });
    expect(elections[0].status).toBe("OPEN");
  });

  test("filters elections by query and status", () => {
    const elections = [
      baseElection,
      { ...baseElection, id: "election-2", name: "GS Election", status: "DRAFT" },
    ] satisfies DashboardElection[];

    expect(filterDashboardElections(elections, { query: "gs", status: "ALL" }).map((e) => e.id)).toEqual(["election-2"]);
    expect(filterDashboardElections(elections, { query: "", status: "OPEN" }).map((e) => e.id)).toEqual(["election-1"]);
  });

  test("filters dashboard buckets by archive scope and recent election count", () => {
    const active = [
      { ...baseElection, id: "active-old", name: "Old Active", createdAt: new Date("2026-01-01T00:00:00.000Z") },
      { ...baseElection, id: "active-new", name: "New Active", createdAt: new Date("2026-04-01T00:00:00.000Z") },
    ] satisfies DashboardElection[];
    const archived = [
      { ...baseElection, id: "archived-new", name: "Archived New", archivedAt: new Date("2026-06-01T00:00:00.000Z"), createdAt: new Date("2026-05-01T00:00:00.000Z") },
      { ...baseElection, id: "archived-old", name: "Archived Old", archivedAt: new Date("2026-03-01T00:00:00.000Z"), createdAt: new Date("2026-02-01T00:00:00.000Z") },
    ] satisfies DashboardElection[];

    const recentAll = filterDashboardBuckets(active, archived, {
      query: "",
      status: "ALL",
      recentElectionCount: 2,
      archiveScope: "ALL",
    });
    expect(recentAll.active.map((election) => election.id)).toEqual(["active-new"]);
    expect(recentAll.archived.map((election) => election.id)).toEqual(["archived-new"]);
    expect(recentAll.totalScoped).toBe(4);
    expect(recentAll.totalVisible).toBe(2);

    const archivedOnly = filterDashboardBuckets(active, archived, {
      query: "old",
      status: "ALL",
      recentElectionCount: "ALL",
      archiveScope: "ARCHIVED",
    });
    expect(archivedOnly.active).toEqual([]);
    expect(archivedOnly.archived.map((election) => election.id)).toEqual(["archived-old"]);
  });

  test("converts persisted snapshots to a capped turnout trend", () => {
    const snapshots = [
      snapshot("2026-01-01T00:00:00.000Z", 1, 10),
      snapshot("2026-01-01T00:00:30.000Z", 4, 10),
      snapshot("2026-01-01T00:01:00.000Z", 7, 10),
    ];

    expect(snapshotsToTurnoutTrend(snapshots, 2)).toEqual([
      { label: "08:00 AM", pct: 40, voted: 4, total: 10 },
      { label: "08:01 AM", pct: 70, voted: 7, total: 10 },
    ]);
  });
});

function snapshot(capturedAt: string, voted: number, total: number): PersistedMonitorSnapshot {
  return {
    capturedAt,
    payload: {
      electionId: "election-1",
      status: "OPEN",
      positions: [],
      turnout: { voted, total, pct: Math.round((voted / total) * 100) },
    },
  };
}
