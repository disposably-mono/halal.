import { describe, expect, it } from "vitest";
import {
  isGradeInDivisionRange,
  parseVotersCSV,
  type VoterImportContext,
} from "@/lib/domain/voter-import";

describe("isGradeInDivisionRange", () => {
  it("accepts grade inside range", () => {
    expect(isGradeInDivisionRange("SHS", 10)).toBe(true);
    expect(isGradeInDivisionRange("SHS", 11)).toBe(true);
    expect(isGradeInDivisionRange("JHS", 7)).toBe(true);
    expect(isGradeInDivisionRange("GS", 5)).toBe(true);
  });

  it("rejects grade outside range", () => {
    expect(isGradeInDivisionRange("SHS", 9)).toBe(false);
    expect(isGradeInDivisionRange("GS", 6)).toBe(false);
    expect(isGradeInDivisionRange("JHS", 5)).toBe(false);
  });
});

function ctx(overrides: Partial<VoterImportContext> = {}): VoterImportContext {
  return {
    division: "SHS",
    schoolYear: 2026,
    existingStudentIds: new Set(),
    existingVoterCodes: new Set(),
    ...overrides,
  };
}

describe("parseVotersCSV", () => {
  const header = "studentId,gradeLevel,section";

  it("parses a clean SHS payload", () => {
    const csv = [header, "2025-0001,11,A", "2025-0002,11,A", "2025-0003,10,B"].join("\n");
    const result = parseVotersCSV(csv, ctx());

    expect(result.toCreate).toHaveLength(3);
    expect(result.rejected).toBe(0);
    expect(result.skippedDuplicates).toBe(0);
    expect(result.reasons).toEqual([]);
    expect(result.toCreate.map((v) => v.voterCode)).toEqual(["2611A001", "2611A002", "2610B001"]);
    expect(result.toCreate[0]).toMatchObject({
      studentId: "2025-0001",
      gradeLevel: 11,
      section: "A",
      division: "SHS",
    });
  });

  it("uppercases section letters", () => {
    const csv = [header, "2025-0001,11,a"].join("\n");
    const result = parseVotersCSV(csv, ctx());
    expect(result.toCreate[0].section).toBe("A");
    expect(result.toCreate[0].voterCode).toBe("2611A001");
  });

  it("rejects rows with missing columns and reports a reason", () => {
    const csv = [header, "2025-0001,11", "2025-0002,,A", ",11,A"].join("\n");
    const result = parseVotersCSV(csv, ctx());
    expect(result.rejected).toBe(3);
    expect(result.toCreate).toHaveLength(0);
    expect(result.reasons).toContain("Rows with missing columns were skipped.");
  });

  it("rejects rows whose studentId is not in NNNN-NNNN form", () => {
    const csv = [header, "abc,11,A", "20250001,11,A", "2025-0002,11,B"].join("\n");
    const result = parseVotersCSV(csv, ctx());
    expect(result.rejected).toBe(2);
    expect(result.toCreate).toHaveLength(1);
    expect(result.toCreate[0].studentId).toBe("2025-0002");
    expect(result.reasons).toContain("Rows rejected: Student IDs must look like 2025-0001.");
  });

  it("rejects rows whose section is not a single A–H letter", () => {
    const csv = [header, "2025-0001,11,Z", "2025-0002,11,AB", "2025-0003,11,B"].join("\n");
    const result = parseVotersCSV(csv, ctx());
    expect(result.rejected).toBe(2);
    expect(result.toCreate).toHaveLength(1);
    expect(result.toCreate[0].section).toBe("B");
    expect(result.reasons).toContain("Rows rejected: Section must be a single letter A–H.");
  });

  it("rejects grades outside the division range", () => {
    const csv = [header, "2025-0001,9,A", "2025-0002,12,B"].join("\n");
    const result = parseVotersCSV(csv, ctx({ division: "SHS" }));
    expect(result.rejected).toBe(2);
    expect(result.toCreate).toHaveLength(0);
    expect(result.reasons[0]).toMatch(/within 10–11/);
  });

  it("reports rows whose studentId is already present as skipped duplicates", () => {
    const csv = [header, "2025-0001,11,A", "2025-0002,11,A"].join("\n");
    const result = parseVotersCSV(
      csv,
      ctx({ existingStudentIds: new Set(["2025-0001"]) }),
    );
    expect(result.rejected).toBe(0);
    expect(result.skippedDuplicates).toBe(1);
    expect(result.toCreate).toHaveLength(1);
    expect(result.toCreate[0].studentId).toBe("2025-0002");
    expect(result.reasons).toContain("1 duplicate row was skipped.");
  });

  it("issues the next free code instead of dropping a student when a code is taken", () => {
    const csv = [header, "2025-0001,11,A"].join("\n");
    const result = parseVotersCSV(
      csv,
      ctx({ existingVoterCodes: new Set(["2611A001"]) }),
    );
    // The student is registered with the next monotonic code — never silently dropped.
    expect(result.toCreate).toHaveLength(1);
    expect(result.toCreate[0].voterCode).toBe("2611A002");
    expect(result.skippedDuplicates).toBe(0);
  });

  it("continues monotonic numbering above the highest existing code in the cohort", () => {
    const csv = [header, "2025-0099,11,A"].join("\n");
    const result = parseVotersCSV(
      csv,
      ctx({ existingVoterCodes: new Set(["2611A001", "2611A004"]) }),
    );
    expect(result.toCreate[0].voterCode).toBe("2611A005");
  });

  it("never reuses a gap freed by a mid-roster deletion (monotonic)", () => {
    // Codes 001 and 003 exist (002 was deleted); the next code is 004, not 002.
    const csv = [header, "2025-0050,11,A"].join("\n");
    const result = parseVotersCSV(
      csv,
      ctx({ existingVoterCodes: new Set(["2611A001", "2611A003"]) }),
    );
    expect(result.toCreate[0].voterCode).toBe("2611A004");
  });

  it("scopes the sequence per year+grade+section cohort", () => {
    const csv = [header, "2025-0001,11,A", "2025-0002,11,B", "2025-0003,10,A"].join("\n");
    const result = parseVotersCSV(
      csv,
      // Only the 11-A cohort is seeded; other cohorts start fresh at 001.
      ctx({ existingVoterCodes: new Set(["2611A009"]) }),
    );
    expect(result.toCreate.map((v) => v.voterCode)).toEqual([
      "2611A010",
      "2611B001",
      "2610A001",
    ]);
  });

  it("ignores blank lines", () => {
    const csv = [header, "", "2025-0001,11,A", "", "2025-0002,11,A"].join("\n");
    const result = parseVotersCSV(csv, ctx());
    expect(result.toCreate).toHaveLength(2);
    expect(result.rejected).toBe(0);
    expect(result.skippedDuplicates).toBe(0);
  });

  it("strips quotes from CSV cells", () => {
    const csv = [header, '"2025-0001","11","A"'].join("\n");
    const result = parseVotersCSV(csv, ctx());
    expect(result.toCreate).toHaveLength(1);
    expect(result.toCreate[0].studentId).toBe("2025-0001");
  });

  it("does not mutate the input contexts", () => {
    const existingStudentIds = new Set(["2025-0001"]);
    const existingVoterCodes = new Set(["2611A001"]);
    const csv = [header, "2025-0002,11,A", "2025-0003,11,B"].join("\n");

    parseVotersCSV(csv, {
      division: "SHS",
      schoolYear: 2026,
      existingStudentIds,
      existingVoterCodes,
    });

    expect(existingStudentIds.size).toBe(1);
    expect(existingVoterCodes.size).toBe(1);
  });

  it("dedupes within a single batch by studentId", () => {
    const csv = [header, "2025-0001,11,A", "2025-0001,11,A", "2025-0001,11,B"].join("\n");
    const result = parseVotersCSV(csv, ctx());
    expect(result.toCreate).toHaveLength(1);
    expect(result.toCreate[0].section).toBe("A");
    expect(result.rejected).toBe(0);
    expect(result.skippedDuplicates).toBe(2);
    expect(result.reasons).toContain("2 duplicate rows were skipped.");
  });
});
