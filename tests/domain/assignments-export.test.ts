import { describe, expect, it } from "vitest";
import { buildAssignmentsTsv } from "@/lib/domain/assignments-export";

describe("buildAssignmentsTsv", () => {
  it("emits only a header row when there are no voters", () => {
    expect(buildAssignmentsTsv([])).toBe(
      "Control Number\tStudent ID\tGrade\tSection",
    );
  });

  it("emits one tab-separated row per voter after the header", () => {
    const tsv = buildAssignmentsTsv([
      { voterCode: "2611A001", studentId: "0000-0001", gradeLevel: 11, section: "A" },
      { voterCode: "2611A002", studentId: "0000-0002", gradeLevel: 11, section: "A" },
    ]);
    expect(tsv).toBe(
      "Control Number\tStudent ID\tGrade\tSection\n" +
        "2611A001\t0000-0001\t11\tA\n" +
        "2611A002\t0000-0002\t11\tA",
    );
  });

  it("neutralizes spreadsheet formulas in copied cells", () => {
    const tsv = buildAssignmentsTsv([
      {
        voterCode: "2611A001",
        studentId: "0000-0001",
        gradeLevel: 11,
        section: "=evil()",
      },
    ]);

    expect(tsv).toBe(
      "Control Number\tStudent ID\tGrade\tSection\n" +
        "2611A001\t0000-0001\t11\t'=evil()",
    );
  });
});
