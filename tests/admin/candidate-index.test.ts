import { describe, expect, test } from "vitest";
import {
  buildCandidateIndex,
  filterCandidateIndex,
  summarizeCandidateIndex,
  type CandidateIndexPosition,
} from "@/app/(admin)/admin/candidates/candidate-index";

const positions: CandidateIndexPosition[] = [
  {
    id: "pos-president",
    title: "President",
    eligibleGrades: [11, 12],
    candidateGrade: "12",
    election: {
      id: "election-shs",
      name: "SHS Elections",
      division: "SHS",
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
      status: "DRAFT",
    },
    candidates: [
      { id: "candidate-ana", fullName: "Ana Reyes", gradeLevel: 12 },
      { id: "candidate-ben", fullName: "Ben Santos", gradeLevel: 12 },
    ],
  },
  {
    id: "pos-prefect",
    title: "House Prefect",
    eligibleGrades: [11, 12],
    candidateGrade: "12",
    election: {
      id: "election-house",
      name: "House Elections",
      division: "HC",
      createdAt: new Date("2026-02-01T00:00:00.000Z"),
      status: "OPEN",
    },
    candidates: [{ id: "candidate-cam", fullName: "Cam Cruz", gradeLevel: 12 }],
  },
  {
    id: "pos-archived",
    title: "Archived Secretary",
    eligibleGrades: [11, 12],
    candidateGrade: "12",
    election: {
      id: "election-archived",
      name: "Archived Election",
      division: "HC",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      status: "CLOSED",
      archivedAt: "2026-07-01T00:00:00.000Z",
    },
    candidates: [{ id: "candidate-old", fullName: "Old Candidate", gradeLevel: 12 }],
  },
];

describe("candidate index helpers", () => {
  test("groups candidates by division and election without mutating input", () => {
    const groups = buildCandidateIndex(positions);

    expect(groups.map((group) => group.division)).toEqual(["SHS", "HC"]);
    expect(groups[0]?.elections[0]?.totalCandidates).toBe(2);
    expect(groups[1]?.elections[0]?.positions[0]?.title).toBe("House Prefect");
    expect(groups[0]?.elections[0]?.positions[0]).not.toBe(positions[0]);
    expect(groups.flatMap((group) => group.elections).map((election) => election.id)).not.toContain("election-archived");
  });

  test("filters by status, division, and candidate query", () => {
    const groups = buildCandidateIndex(positions);
    const filtered = filterCandidateIndex(groups, {
      query: "ana",
      status: "DRAFT",
      division: "SHS",
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.elections[0]?.positions[0]?.candidates).toEqual([
      { id: "candidate-ana", fullName: "Ana Reyes", gradeLevel: 12 },
    ]);
  });

  test("filters to the most recent elections by creation date", () => {
    const recentPositions = [
      positionForElection("old-position", "old-house", "House Elections", "HC", "2026-01-01T00:00:00.000Z"),
      positionForElection("latest-position", "latest-shs", "SHS Elections", "SHS", "2026-03-01T00:00:00.000Z"),
      positionForElection("middle-position", "middle-gs", "GS Elections", "GS", "2026-02-01T00:00:00.000Z"),
    ] satisfies CandidateIndexPosition[];
    const groups = buildCandidateIndex(recentPositions);
    const filtered = filterCandidateIndex(groups, {
      query: "",
      status: "ALL",
      division: "ALL",
      recentElectionCount: 2,
    });

    const electionIds = filtered.flatMap((group) => group.elections.map((election) => election.id));

    expect(electionIds).toHaveLength(2);
    expect(electionIds).toEqual(expect.arrayContaining(["latest-shs", "middle-gs"]));
    expect(electionIds).not.toContain("old-house");
    expect(summarizeCandidateIndex(filtered).positions).toBe(2);
  });

  test("summarizes the visible index", () => {
    expect(summarizeCandidateIndex(buildCandidateIndex(positions))).toEqual({
      divisions: 2,
      elections: 2,
      positions: 2,
      candidates: 3,
    });
  });
});

function positionForElection(
  id: string,
  electionId: string,
  electionName: string,
  division: string,
  createdAt: string,
): CandidateIndexPosition & { election: CandidateIndexPosition["election"] & { createdAt: Date } } {
  return {
    id,
    title: id,
    eligibleGrades: [11, 12],
    candidateGrade: "12",
    election: {
      id: electionId,
      name: electionName,
      division,
      status: "OPEN",
      createdAt: new Date(createdAt),
    },
    candidates: [{ id: `${id}-candidate`, fullName: "Student Candidate", gradeLevel: 12 }],
  };
}
