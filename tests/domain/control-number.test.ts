import { describe, expect, it } from "vitest";
import {
  controlNumberPrefix,
  formatControlNumber,
  generateControlNumber,
  isValidControlNumber,
  isValidSection,
  isValidStudentId,
  nextControlNumber,
  normalizeControlNumber,
  parseControlNumber,
} from "@/lib/domain/control-number";

describe("isValidControlNumber", () => {
  it("accepts the canonical YYGGSNNN format", () => {
    expect(isValidControlNumber("2611A001")).toBe(true);
    expect(isValidControlNumber("2603H999")).toBe(true);
  });

  it("rejects lowercase section letter without normalization", () => {
    expect(isValidControlNumber("2611a001")).toBe(false);
  });

  it("rejects section letters outside A–H", () => {
    expect(isValidControlNumber("2611I001")).toBe(false);
    expect(isValidControlNumber("2611Z001")).toBe(false);
  });

  it("rejects wrong-length codes", () => {
    expect(isValidControlNumber("2611A1")).toBe(false);
    expect(isValidControlNumber("2611A0001")).toBe(false);
    expect(isValidControlNumber("")).toBe(false);
  });

  it("rejects whitespace and surrounding chars", () => {
    expect(isValidControlNumber(" 2611A001")).toBe(false);
    expect(isValidControlNumber("2611A001\n")).toBe(false);
  });
});

describe("isValidStudentId", () => {
  it("accepts XXXX-XXXX", () => {
    expect(isValidStudentId("2025-0001")).toBe(true);
    expect(isValidStudentId("0000-9999")).toBe(true);
  });

  it("rejects missing or wrong separator", () => {
    expect(isValidStudentId("20250001")).toBe(false);
    expect(isValidStudentId("2025_0001")).toBe(false);
  });

  it("rejects wrong-length segments", () => {
    expect(isValidStudentId("202-0001")).toBe(false);
    expect(isValidStudentId("2025-001")).toBe(false);
  });
});

describe("isValidSection", () => {
  it("accepts a single A–H letter, case-insensitive and trimmed", () => {
    expect(isValidSection("A")).toBe(true);
    expect(isValidSection("H")).toBe(true);
    expect(isValidSection("b")).toBe(true);
    expect(isValidSection("  c  ")).toBe(true);
  });

  it("rejects letters beyond H, multi-letter, digits, and empty", () => {
    expect(isValidSection("I")).toBe(false);
    expect(isValidSection("Z")).toBe(false);
    expect(isValidSection("AB")).toBe(false);
    expect(isValidSection("1")).toBe(false);
    expect(isValidSection("")).toBe(false);
  });
});

describe("normalizeControlNumber", () => {
  it("trims whitespace and uppercases", () => {
    expect(normalizeControlNumber("  2611a001  ")).toBe("2611A001");
  });
});

describe("parseControlNumber", () => {
  it("parses a SHS grade-11 code", () => {
    expect(parseControlNumber("2611A001")).toEqual({
      year: 26,
      grade: 11,
      section: "A",
      seq: 1,
      division: "SHS",
    });
  });

  it("parses a JHS grade-7 code", () => {
    expect(parseControlNumber("2607C042")).toEqual({
      year: 26,
      grade: 7,
      section: "C",
      seq: 42,
      division: "JHS",
    });
  });

  it("parses a GS grade-5 code", () => {
    expect(parseControlNumber("2605B007")).toEqual({
      year: 26,
      grade: 5,
      section: "B",
      seq: 7,
      division: "GS",
    });
  });

  it("normalizes input before parsing", () => {
    expect(parseControlNumber("  2611a001  ")?.section).toBe("A");
  });

  it("returns null for invalid format", () => {
    expect(parseControlNumber("garbage")).toBeNull();
    expect(parseControlNumber("2611Z001")).toBeNull();
  });

  it("returns null for a grade below all division ranges", () => {
    // Grade 02 is below GS min (3)
    expect(parseControlNumber("2602A001")).toBeNull();
  });

  it("parses grade 12 as HC", () => {
    const parsed = parseControlNumber("2612A001");
    expect(parsed?.grade).toBe(12);
    expect(parsed?.division).toBe("HC");
  });

  it("derives SHS (not HC) for grade 11 — both share grade range, SHS wins by iteration order", () => {
    // Documents existing behavior; HC voters are still tracked correctly via
    // election.division on the Voter row, not via this parse.
    expect(parseControlNumber("2611A001")?.division).toBe("SHS");
    expect(parseControlNumber("2610B001")?.division).toBe("SHS");
  });
});

describe("formatControlNumber", () => {
  it("zero-pads grade and seq, uppercases section", () => {
    expect(formatControlNumber({ year: 2026, grade: 7, section: "c", seq: 3 })).toBe(
      "2607C003",
    );
  });

  it("uses last 2 digits of year", () => {
    expect(formatControlNumber({ year: 2099, grade: 11, section: "A", seq: 1 })).toBe(
      "9911A001",
    );
  });

  it("handles single-digit year padding", () => {
    expect(formatControlNumber({ year: 5, grade: 11, section: "A", seq: 1 })).toBe(
      "0511A001",
    );
  });

  it("round-trips with parseControlNumber for valid inputs", () => {
    const code = formatControlNumber({ year: 2026, grade: 9, section: "B", seq: 17 });
    const parsed = parseControlNumber(code);
    expect(parsed).toMatchObject({ year: 26, grade: 9, section: "B", seq: 17 });
  });
});

describe("generateControlNumber", () => {
  it("matches formatControlNumber", () => {
    expect(generateControlNumber(2026, 11, "A", 1)).toBe(
      formatControlNumber({ year: 2026, grade: 11, section: "A", seq: 1 }),
    );
  });
});

describe("controlNumberPrefix", () => {
  it("builds the YYGGS cohort prefix", () => {
    expect(controlNumberPrefix(2026, 11, "A")).toBe("2611A");
    expect(controlNumberPrefix(2026, 3, "h")).toBe("2603H");
  });
});

describe("nextControlNumber", () => {
  it("starts a fresh cohort at 001", () => {
    expect(nextControlNumber(2026, 11, "A", [])).toBe("2611A001");
  });

  it("issues one above the highest sequence in the cohort", () => {
    expect(
      nextControlNumber(2026, 11, "A", ["2611A001", "2611A002", "2611A003"]),
    ).toBe("2611A004");
  });

  it("never reuses a freed gap number (monotonic)", () => {
    // 002 was deleted; the next code is 004, not the gap 002.
    expect(nextControlNumber(2026, 11, "A", ["2611A001", "2611A003"])).toBe(
      "2611A004",
    );
  });

  it("ignores codes from other cohorts (year, grade, or section)", () => {
    const others = ["2711A050", "2610A050", "2611B050", "2611A007"];
    // Only 2611A007 shares the cohort prefix.
    expect(nextControlNumber(2026, 11, "A", others)).toBe("2611A008");
  });

  it("is robust to mixed-case and untrimmed existing codes", () => {
    expect(nextControlNumber(2026, 11, "A", [" 2611a004 "])).toBe("2611A005");
  });
});
