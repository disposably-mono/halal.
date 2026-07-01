import { describe, expect, it } from "vitest";
import {
  DIVISION_CODES,
  DIVISION_LABELS,
  formatDivisionGrades,
} from "@/lib/ui/division-labels";

describe("division labels", () => {
  it("maps acronyms", () => {
    expect(DIVISION_CODES.GS).toBe("GSSCT");
    expect(DIVISION_CODES.SHS).toBe("SSHSSC");
    expect(DIVISION_CODES.HC).toBe("HC");
  });
  it("uses full council names", () => {
    expect(DIVISION_LABELS.SHS).toBe("Supreme Senior High School Student Council");
    expect(DIVISION_LABELS.HC).toBe("House Council");
  });
  it("derives grade text from the division range", () => {
    expect(formatDivisionGrades("GS")).toBe("Grades 3–5");
    expect(formatDivisionGrades("SHS")).toBe("Grades 10–11");
    expect(formatDivisionGrades("HC")).toBe("Grades 11–12");
  });
});
