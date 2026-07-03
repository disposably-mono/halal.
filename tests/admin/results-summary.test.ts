import { describe, expect, test } from "vitest";
import {
  orderResultsElections,
  getResultStatusMeta,
  getTurnoutPercent,
} from "@/app/(admin)/admin/results/admin-results-summary";

describe("admin results summary helpers", () => {
  test("orders closed results before live results while preserving recency within each group", () => {
    const ordered = orderResultsElections([
      { id: "open-new", status: "OPEN", createdAt: new Date("2026-07-02T03:00:00Z") },
      { id: "closed-old", status: "CLOSED", createdAt: new Date("2026-07-02T01:00:00Z") },
      { id: "closed-new", status: "CLOSED", createdAt: new Date("2026-07-02T02:00:00Z") },
    ]);

    expect(ordered.map((election) => election.id)).toEqual(["closed-new", "closed-old", "open-new"]);
  });

  test("returns stable status labels for final and live result rows", () => {
    expect(getResultStatusMeta("CLOSED")).toEqual({
      label: "Final",
      badgeClassName: "bg-white/5 text-white/60",
      dotClassName: "bg-white/20",
      barClassName: "bg-white/30",
    });
    expect(getResultStatusMeta("OPEN").label).toBe("Live");
  });

  test("calculates turnout percent without dividing by zero", () => {
    expect(getTurnoutPercent({ voted: 7, voters: 10 })).toBe(70);
    expect(getTurnoutPercent({ voted: 7, voters: 0 })).toBe(0);
  });
});
