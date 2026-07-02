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
    election: { id: "election-shs", name: "SHS Elections", division: "SHS", status: "DRAFT" },
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
    election: { id: "election-house", name: "House Elections", division: "HC", status: "OPEN" },
    candidates: [{ id: "candidate-cam", fullName: "Cam Cruz", gradeLevel: 12 }],
  },
];

describe("candidate index helpers", () => {
  test("groups candidates by division and election without mutating input", () => {
    const groups = buildCandidateIndex(positions);

    expect(groups.map((group) => group.division)).toEqual(["SHS", "HC"]);
    expect(groups[0]?.elections[0]?.totalCandidates).toBe(2);
    expect(groups[1]?.elections[0]?.positions[0]?.title).toBe("House Prefect");
    expect(groups[0]?.elections[0]?.positions[0]).not.toBe(positions[0]);
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

  test("summarizes the visible index", () => {
    expect(summarizeCandidateIndex(buildCandidateIndex(positions))).toEqual({
      divisions: 2,
      elections: 2,
      positions: 2,
      candidates: 3,
    });
  });
});
