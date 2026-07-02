import { describe, expect, test } from "vitest";
import { filterCandidatePositions } from "@/app/(admin)/admin/elections/[id]/candidates/candidate-search";

const positions = [
  {
    id: "president",
    title: "President",
    candidateGrade: "11",
    eligibleGrades: [11],
    candidates: [
      { id: "ana", fullName: "Ana Cruz", gradeLevel: 11 },
      { id: "ben", fullName: "Ben Santos", gradeLevel: 11 },
    ],
  },
  {
    id: "secretary",
    title: "Secretary",
    candidateGrade: "11",
    eligibleGrades: [11],
    candidates: [
      { id: "cara", fullName: "Cara Reyes", gradeLevel: 11 },
    ],
  },
];

describe("candidate position search", () => {
  test("keeps all candidates when the position title matches", () => {
    expect(filterCandidatePositions(positions, "president")).toEqual([positions[0]]);
  });

  test("filters candidates when the candidate name matches", () => {
    expect(filterCandidatePositions(positions, "ana")).toEqual([
      {
        ...positions[0],
        candidates: [positions[0].candidates[0]],
      },
    ]);
  });
});
