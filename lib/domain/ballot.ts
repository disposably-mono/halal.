import type { Division } from "@prisma/client";
import { DIVISION_POSITIONS, type PositionDefinition } from "@/lib/elections/constants";

export function eligiblePositionsForGrade(division: Division, grade: number): PositionDefinition[] {
  return (DIVISION_POSITIONS[division] ?? []).filter((p) => p.eligibleGrades.includes(grade));
}

export function parseCandidateGrades(raw: string): number[] {
  return raw
    .split(",")
    .map((g) => parseInt(g.trim(), 10))
    .filter((n) => !isNaN(n));
}

export function pickCandidateDefaultGrade(raw: string): number {
  const grades = parseCandidateGrades(raw);
  return grades.length === 1 ? grades[0] : 0;
}
