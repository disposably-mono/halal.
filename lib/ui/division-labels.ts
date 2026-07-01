import type { Division } from "@prisma/client";
import { gradesForDivision } from "@/lib/elections/constants";
import { formatGradeList } from "@/lib/domain/grade-format";

export const DIVISION_LABELS: Record<string, string> = {
  GS: "Grade School Student Coordinating Team",
  JHS: "Junior High School Coordinating Team",
  SHS: "Supreme Senior High School Student Council",
  HC: "House Council",
};

export const DIVISION_CODES: Record<string, string> = {
  GS: "GSSCT",
  JHS: "JHSSCT",
  SHS: "SSHSSC",
  HC: "HC",
};

export const DIVISION_ORDER = ["GS", "JHS", "SHS", "HC"] as const;

/** Landing grade text, derived from the real range so it can't drift. */
export function formatDivisionGrades(division: Division): string {
  return formatGradeList(gradesForDivision(division));
}
