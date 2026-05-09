import { describe, expect, it } from "vitest";
import {
  eligiblePositionsForGrade,
  parseCandidateGrades,
  pickCandidateDefaultGrade,
} from "@/lib/domain/ballot";

describe("eligiblePositionsForGrade", () => {
  it("returns SHS positions for grade 11", () => {
    const positions = eligiblePositionsForGrade("SHS", 11);
    expect(positions.length).toBeGreaterThan(0);
    expect(positions.every((p) => p.eligibleGrades.includes(11))).toBe(true);
  });

  it("returns SHS positions for grade 10 (subset of grade 11)", () => {
    const grade10 = eligiblePositionsForGrade("SHS", 10);
    const grade11 = eligiblePositionsForGrade("SHS", 11);
    expect(grade10.length).toBe(grade11.length); // SHS has shared positions for both
  });

  it("filters JHS Freshman Governor by grade", () => {
    const grade6 = eligiblePositionsForGrade("JHS", 6);
    const grade7 = eligiblePositionsForGrade("JHS", 7);
    expect(grade6.find((p) => p.title === "Freshman Governor")).toBeDefined();
    expect(grade7.find((p) => p.title === "Freshman Governor")).toBeUndefined();
  });

  it("filters JHS Senior Governor to grade 9 only", () => {
    expect(
      eligiblePositionsForGrade("JHS", 9).find((p) => p.title === "Senior Governor"),
    ).toBeDefined();
    expect(
      eligiblePositionsForGrade("JHS", 8).find((p) => p.title === "Senior Governor"),
    ).toBeUndefined();
  });

  it("returns empty array for grade outside division range", () => {
    expect(eligiblePositionsForGrade("SHS", 5)).toEqual([]);
    expect(eligiblePositionsForGrade("GS", 11)).toEqual([]);
  });
});

describe("parseCandidateGrades", () => {
  it("parses a single grade", () => {
    expect(parseCandidateGrades("9")).toEqual([9]);
  });

  it("parses comma-separated grades", () => {
    expect(parseCandidateGrades("9,10,11")).toEqual([9, 10, 11]);
  });

  it("trims whitespace around tokens", () => {
    expect(parseCandidateGrades(" 9 , 10 , 11 ")).toEqual([9, 10, 11]);
  });

  it("filters NaN tokens (e.g. '10 or 11', '6 to 9')", () => {
    // These are display strings — the comma split + parseInt picks first numeric.
    expect(parseCandidateGrades("10 or 11")).toEqual([10]);
    expect(parseCandidateGrades("6 to 9")).toEqual([6]);
  });

  it("returns empty array for fully non-numeric input", () => {
    expect(parseCandidateGrades("any")).toEqual([]);
    expect(parseCandidateGrades("")).toEqual([]);
  });
});

describe("pickCandidateDefaultGrade", () => {
  it("returns the grade when exactly one was parsed", () => {
    expect(pickCandidateDefaultGrade("9")).toBe(9);
    expect(pickCandidateDefaultGrade("11")).toBe(11);
  });

  it("returns 0 when multiple grades parsed", () => {
    expect(pickCandidateDefaultGrade("9,10,11")).toBe(0);
  });

  it("returns 0 when no grades parse", () => {
    expect(pickCandidateDefaultGrade("any")).toBe(0);
  });
});
