import { describe, expect, test } from "vitest";
import {
  buildResultsIndex,
  filterResultsIndex,
  type ResultsIndexElection,
} from "@/app/(admin)/admin/results/results-index";

const elections = [
  resultElection("old-house", "House Elections", "HC", "2026-01-01T00:00:00.000Z"),
  resultElection("latest-shs", "SHS Elections", "SHS", "2026-03-01T00:00:00.000Z"),
  resultElection("middle-gs", "GS Elections", "GS", "2026-02-01T00:00:00.000Z"),
] satisfies ResultsIndexElection[];

describe("results index helpers", () => {
  test("filters to the most recent elections by creation date", () => {
    const groups = buildResultsIndex(elections);
    const filtered = filterResultsIndex(groups, {
      query: "",
      division: "ALL",
      status: "ALL",
      recentElectionCount: 2,
    });

    const electionIds = filtered.flatMap((group) => group.elections.map((election) => election.id));

    expect(electionIds).toHaveLength(2);
    expect(electionIds).toEqual(expect.arrayContaining(["latest-shs", "middle-gs"]));
    expect(electionIds).not.toContain("old-house");
  });
});

function resultElection(
  id: string,
  name: string,
  division: string,
  createdAt: string,
): ResultsIndexElection & { createdAt: Date } {
  return {
    id,
    name,
    division,
    createdAt: new Date(createdAt),
    status: "CLOSED",
    votedCount: 0,
    voterCount: 0,
    integrityFailure: false,
    positions: [],
  };
}
