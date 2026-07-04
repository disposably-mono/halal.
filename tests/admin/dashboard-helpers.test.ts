import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  buildDashboardSummary,
  filterDashboardBuckets,
  filterDashboardElections,
  getDashboardAccordionOpenState,
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
      { ...baseElection, id: "active-1", name: "Active 1", createdAt: new Date("2026-07-06T00:00:00.000Z") },
      { ...baseElection, id: "active-2", name: "Active 2", createdAt: new Date("2026-07-05T00:00:00.000Z") },
      { ...baseElection, id: "active-3", name: "Active 3", createdAt: new Date("2026-07-04T00:00:00.000Z") },
      { ...baseElection, id: "active-5", name: "Active 5", createdAt: new Date("2026-07-02T00:00:00.000Z") },
      { ...baseElection, id: "active-6", name: "Active 6", createdAt: new Date("2026-07-01T00:00:00.000Z") },
    ] satisfies DashboardElection[];
    const archived = [
      { ...baseElection, id: "archived-4", name: "Archived 4", archivedAt: new Date("2026-07-03T00:00:00.000Z"), createdAt: new Date("2026-07-03T00:00:00.000Z") },
    ] satisfies DashboardElection[];

    const recentAll = filterDashboardBuckets(active, archived, {
      query: "",
      status: "ALL",
      recentElectionCount: 5,
      archiveScope: "ALL",
    });
    expect(recentAll.active.map((election) => election.id)).toEqual(["active-1", "active-2", "active-3", "active-5"]);
    expect(recentAll.archived.map((election) => election.id)).toEqual(["archived-4"]);
    expect(recentAll.totalScoped).toBe(6);
    expect(recentAll.totalVisible).toBe(5);

    const activeOnly = filterDashboardBuckets(active, archived, {
      query: "",
      status: "ALL",
      recentElectionCount: 5,
      archiveScope: "ACTIVE",
    });
    expect(activeOnly.active.map((election) => election.id)).toEqual(["active-1", "active-2", "active-3", "active-5"]);
    expect(activeOnly.archived).toEqual([]);

    const archivedOnly = filterDashboardBuckets(active, archived, {
      query: "",
      status: "ALL",
      recentElectionCount: 5,
      archiveScope: "ARCHIVED",
    });
    expect(archivedOnly.active).toEqual([]);
    expect(archivedOnly.archived.map((election) => election.id)).toEqual(["archived-4"]);
  });

  test("opens both accordions when active and archived elections are both in scope", () => {
    expect(
      getDashboardAccordionOpenState({
        archiveScope: "ALL",
      }),
    ).toEqual({
      shouldOpenActive: true,
      shouldOpenArchived: true,
    });

    expect(
      getDashboardAccordionOpenState({
        archiveScope: "ACTIVE",
      }),
    ).toEqual({
      shouldOpenActive: true,
      shouldOpenArchived: false,
    });

    expect(
      getDashboardAccordionOpenState({
        archiveScope: "ARCHIVED",
      }),
    ).toEqual({
      shouldOpenActive: false,
      shouldOpenArchived: true,
    });
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
