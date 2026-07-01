import type { Division } from "@prisma/client";

export interface PositionDefinition {
  title: string;
  eligibleGrades: number[];
  candidateGrade: string;
}

export const DIVISION_POSITIONS: Record<Division, PositionDefinition[]> = {
  SHS: [
    { title: "President", eligibleGrades: [10, 11], candidateGrade: "11" },
    { title: "Internal Vice-President", eligibleGrades: [10, 11], candidateGrade: "11" },
    { title: "External Vice-President", eligibleGrades: [10, 11], candidateGrade: "11" },
    { title: "General Secretary", eligibleGrades: [10, 11], candidateGrade: "10" },
    { title: "Treasurer", eligibleGrades: [10, 11], candidateGrade: "10" },
    { title: "Overall Staff", eligibleGrades: [10, 11], candidateGrade: "11" },
    { title: "Public Relations Officer", eligibleGrades: [10, 11], candidateGrade: "11" },
    { title: "Art Director", eligibleGrades: [10, 11], candidateGrade: "10,11" },
    { title: "Social Media Associate", eligibleGrades: [10, 11], candidateGrade: "10,11" },
  ],
  JHS: [
    { title: "President", eligibleGrades: [6, 7, 8, 9], candidateGrade: "9" },
    { title: "Internal Vice-President", eligibleGrades: [6, 7, 8, 9], candidateGrade: "9" },
    { title: "External Vice-President", eligibleGrades: [6, 7, 8, 9], candidateGrade: "9" },
    { title: "General Secretary", eligibleGrades: [6, 7, 8, 9], candidateGrade: "9" },
    { title: "Treasurer", eligibleGrades: [6, 7, 8, 9], candidateGrade: "9" },
    { title: "Coordinating Staff", eligibleGrades: [6, 7, 8, 9], candidateGrade: "9" },
    { title: "Public Relations Head", eligibleGrades: [6, 7, 8, 9], candidateGrade: "9" },
    { title: "Assistant Internal Vice-President", eligibleGrades: [6, 7, 8, 9], candidateGrade: "8" },
    { title: "Assistant External Vice-President", eligibleGrades: [6, 7, 8, 9], candidateGrade: "8" },
    { title: "Assistant Secretary", eligibleGrades: [6, 7, 8, 9], candidateGrade: "8" },
    { title: "Auditor", eligibleGrades: [6, 7, 8, 9], candidateGrade: "8" },
    { title: "Coordinating Assistant", eligibleGrades: [6, 7, 8, 9], candidateGrade: "8" },
    { title: "CES Officer", eligibleGrades: [6, 7, 8, 9], candidateGrade: "7" },
    { title: "Freshman Governor", eligibleGrades: [6], candidateGrade: "6" },
    { title: "Sophomore Governor", eligibleGrades: [7], candidateGrade: "7" },
    { title: "Junior Governor", eligibleGrades: [8], candidateGrade: "8" },
    { title: "Senior Governor", eligibleGrades: [9], candidateGrade: "9" },
    { title: "Art Director", eligibleGrades: [6, 7, 8, 9], candidateGrade: "6,7,8,9" },
    { title: "Social Media Associate", eligibleGrades: [6, 7, 8, 9], candidateGrade: "6,7,8,9" },
  ],
  GS: [
    { title: "President", eligibleGrades: [3, 4, 5], candidateGrade: "5" },
    { title: "Vice-President", eligibleGrades: [3, 4, 5], candidateGrade: "5" },
    { title: "Secretary", eligibleGrades: [3, 4, 5], candidateGrade: "5" },
    { title: "Treasurer", eligibleGrades: [3, 4, 5], candidateGrade: "5" },
    { title: "Public Relations Officer 1", eligibleGrades: [3, 4, 5], candidateGrade: "5" },
    { title: "Assistant Secretary", eligibleGrades: [3, 4, 5], candidateGrade: "4" },
    { title: "Public Relations Officer 2", eligibleGrades: [3, 4, 5], candidateGrade: "4" },
    { title: "Public Relations Officer 3", eligibleGrades: [3, 4, 5], candidateGrade: "4" },
    { title: "Public Relations Officer 4", eligibleGrades: [3, 4, 5], candidateGrade: "3" },
    { title: "Public Relations Officer 5", eligibleGrades: [3, 4, 5], candidateGrade: "3" },
  ],
  HC: [
    { title: "House Prefect", eligibleGrades: [11, 12], candidateGrade: "12" },
    { title: "Assistant Prefect", eligibleGrades: [11, 12], candidateGrade: "11" },
    { title: "Art Director", eligibleGrades: [11, 12], candidateGrade: "11,12" },
  ],
};

export const DIVISION_GRADE_RANGE: Record<Division, { min: number; max: number }> = {
  GS: { min: 3, max: 5 },
  JHS: { min: 6, max: 9 },
  SHS: { min: 10, max: 11 },
  HC: { min: 11, max: 12 },
};

export function divisionForGrade(grade: number): Division | null {
  for (const [div, range] of Object.entries(DIVISION_GRADE_RANGE) as [Division, { min: number; max: number }][]) {
    if (grade >= range.min && grade <= range.max) return div;
  }
  return null;
}

export function gradesForDivision(division: Division): number[] {
  const { min, max } = DIVISION_GRADE_RANGE[division];
  const out: number[] = [];
  for (let g = min; g <= max; g++) out.push(g);
  return out;
}
