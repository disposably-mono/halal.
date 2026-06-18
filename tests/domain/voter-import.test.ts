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
    seqByGradeSection: {},
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

  it("reports rows whose generated voterCode collides with an existing code", () => {
    const csv = [header, "2025-0001,11,A"].join("\n");
    const result = parseVotersCSV(
      csv,
      ctx({ existingVoterCodes: new Set(["2611A001"]) }),
    );
    expect(result.toCreate).toHaveLength(0);
    expect(result.rejected).toBe(0);
    expect(result.skippedDuplicates).toBe(1);
    expect(result.reasons).toContain("1 duplicate row was skipped.");
  });

  it("continues sequence numbering from existing seqByGradeSection", () => {
    const csv = [header, "2025-0099,11,A"].join("\n");
    const result = parseVotersCSV(
      csv,
      ctx({ seqByGradeSection: { "11-A": 4 } }),
    );
    expect(result.toCreate[0].voterCode).toBe("2611A005");
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
    const seqByGradeSection = { "11-A": 1 };
    const csv = [header, "2025-0002,11,A", "2025-0003,11,B"].join("\n");

    parseVotersCSV(csv, {
      division: "SHS",
      schoolYear: 2026,
      existingStudentIds,
      existingVoterCodes,
      seqByGradeSection,
    });

    expect(existingStudentIds.size).toBe(1);
    expect(existingVoterCodes.size).toBe(1);
    expect(seqByGradeSection).toEqual({ "11-A": 1 });
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
