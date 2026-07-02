import { describe, expect, test } from "vitest";
import {
  buildVoterIndex,
  filterVoterIndex,
  summarizeVoterIndex,
  type VoterIndexRow,
} from "@/app/(admin)/admin/voters/voter-index";

const voters: VoterIndexRow[] = [
  {
    id: "voter-1",
    studentId: "2026-001",
    voterCode: "HC-001",
    gradeLevel: 11,
    section: "Wisdom",
    hasVoted: true,
    division: "HC",
    election: { id: "election-house", name: "House Elections", division: "HC", status: "OPEN" },
  },
  {
    id: "voter-2",
    studentId: "2026-002",
    voterCode: "HC-002",
    gradeLevel: 12,
    section: "Charity",
    hasVoted: false,
    division: "HC",
    election: { id: "election-house", name: "House Elections", division: "HC", status: "OPEN" },
  },
  {
    id: "voter-3",
    studentId: "2026-003",
    voterCode: "SHS-001",
    gradeLevel: 12,
    section: "Faith",
    hasVoted: false,
    division: "SHS",
    election: { id: "election-shs", name: "SHS Elections", division: "SHS", status: "DRAFT" },
  },
  {
    id: "voter-archived",
    studentId: "2026-004",
    voterCode: "OLD-001",
    gradeLevel: 12,
    section: "Archive",
    hasVoted: true,
    division: "HC",
    election: {
      id: "election-archived",
      name: "Archived Election",
      division: "HC",
      status: "CLOSED",
      archivedAt: "2026-07-01T00:00:00.000Z",
    },
  },
];

describe("voter index helpers", () => {
  test("groups voters by division and election without mutating input", () => {
    const groups = buildVoterIndex(voters);

    expect(groups.map((group) => group.division)).toEqual(["SHS", "HC"]);
    expect(groups[1]?.elections[0]?.voters).toHaveLength(2);
    expect(groups[1]?.elections[0]?.votedCount).toBe(1);
    expect(groups[1]?.elections[0]?.voters[0]).not.toBe(voters[0]);
    expect(groups.flatMap((group) => group.elections).map((election) => election.id)).not.toContain("election-archived");
  });

  test("filters by division, status, vote state, and query", () => {
    const groups = buildVoterIndex(voters);
    const filtered = filterVoterIndex(groups, {
      query: "charity",
      division: "HC",
      status: "OPEN",
      voteStatus: "PENDING",
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.elections[0]?.voters).toEqual([
      expect.objectContaining({ id: "voter-2", section: "Charity" }),
    ]);
  });

  test("summarizes visible voter counts", () => {
    expect(summarizeVoterIndex(buildVoterIndex(voters))).toEqual({
      divisions: 2,
      elections: 2,
      voters: 3,
      voted: 1,
      pending: 2,
    });
  });
});
