import { describe, expect, it } from "vitest";
import { parseGrades, formatGradeList } from "@/lib/domain/grade-format";

describe("parseGrades", () => {
  it("parses a single grade", () => {
    expect(parseGrades("9")).toEqual([9]);
  });
  it("parses comma-separated grades", () => {
    expect(parseGrades("6,8")).toEqual([6, 8]);
  });
  it("parses 'or' lists", () => {
    expect(parseGrades("10 or 11")).toEqual([10, 11]);
  });
  it("expands 'to' ranges", () => {
    expect(parseGrades("6 to 9")).toEqual([6, 7, 8, 9]);
  });
  it("expands dash ranges", () => {
    expect(parseGrades("6-9")).toEqual([6, 7, 8, 9]);
    expect(parseGrades("6–9")).toEqual([6, 7, 8, 9]);
  });
  it("sorts and dedupes", () => {
    expect(parseGrades("11, 10, 10")).toEqual([10, 11]);
  });
  it("treats empty / 0 / all as no restriction", () => {
    expect(parseGrades("")).toEqual([]);
    expect(parseGrades("0")).toEqual([]);
    expect(parseGrades("all")).toEqual([]);
  });
});

describe("formatGradeList", () => {
  it("shows All grades for empty", () => {
    expect(formatGradeList([])).toBe("All grades");
  });
  it("shows All grades when equal to the full range", () => {
    expect(formatGradeList([10, 11], [10, 11])).toBe("All grades");
  });
  it("shows a single grade", () => {
    expect(formatGradeList([11])).toBe("Grade 11");
  });
  it("shows a contiguous range with an en-dash", () => {
    expect(formatGradeList([11, 12])).toBe("Grades 11–12");
  });
  it("shows a comma list when there are gaps", () => {
    expect(formatGradeList([6, 8])).toBe("Grades 6, 8");
  });
});
