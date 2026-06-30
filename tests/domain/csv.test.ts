import { describe, expect, it } from "vitest";
import { escapeCsvCell, rowsToCsv } from "@/lib/domain/csv";

describe("escapeCsvCell", () => {
  it("leaves a plain value untouched", () => {
    expect(escapeCsvCell("2611A001")).toBe("2611A001");
    expect(escapeCsvCell("2025-0001")).toBe("2025-0001");
  });

  it("stringifies numbers", () => {
    expect(escapeCsvCell(11)).toBe("11");
  });

  it("quotes values containing a comma", () => {
    expect(escapeCsvCell("Dela Cruz, Juan")).toBe('"Dela Cruz, Juan"');
  });

  it("quotes and doubles embedded double quotes", () => {
    expect(escapeCsvCell('She said "hi"')).toBe('"She said ""hi"""');
  });

  it("quotes values containing newlines or carriage returns", () => {
    expect(escapeCsvCell("line1\nline2")).toBe('"line1\nline2"');
  });

  it("neutralizes formula-triggering leading characters", () => {
    expect(escapeCsvCell("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");
    expect(escapeCsvCell("+1")).toBe("'+1");
    expect(escapeCsvCell("-1")).toBe("'-1");
    expect(escapeCsvCell("@cmd")).toBe("'@cmd");
  });

  it("neutralizes then quotes a formula that also needs quoting", () => {
    // Leading "=" is neutralized with an apostrophe, and the comma forces quotes.
    expect(escapeCsvCell("=1,2")).toBe("\"'=1,2\"");
  });

  it("leaves an interior +/- untouched (only the first char triggers)", () => {
    expect(escapeCsvCell("2025-0001")).toBe("2025-0001");
    expect(escapeCsvCell("a-b")).toBe("a-b");
  });
});

describe("rowsToCsv", () => {
  it("joins cells with commas and rows with CRLF, escaping each cell", () => {
    const csv = rowsToCsv([
      ["controlNumber", "studentId"],
      ["2611A001", "2025-0001"],
      ["2611A002", "=evil()"],
    ]);
    expect(csv).toBe(
      "controlNumber,studentId\r\n2611A001,2025-0001\r\n2611A002,'=evil()",
    );
  });
});
