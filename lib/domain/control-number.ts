import type { Division } from "@prisma/client";
import { divisionForGrade } from "@/lib/elections/constants";

export const CONTROL_NUMBER_REGEX = /^\d{4}[A-H]\d{3}$/;
export const STUDENT_ID_REGEX = /^\d{4}-\d{4}$/;

export interface ParsedControlNumber {
  year: number;
  grade: number;
  section: string;
  seq: number;
  division: Division;
}

export function isValidControlNumber(code: string): boolean {
  return CONTROL_NUMBER_REGEX.test(code);
}

export function isValidStudentId(value: string): boolean {
  return STUDENT_ID_REGEX.test(value);
}

export function normalizeControlNumber(code: string): string {
  return code.trim().toUpperCase();
}

export function parseControlNumber(code: string): ParsedControlNumber | null {
  const normalized = normalizeControlNumber(code);
  if (!isValidControlNumber(normalized)) return null;
  const year = parseInt(normalized.slice(0, 2), 10);
  const grade = parseInt(normalized.slice(2, 4), 10);
  const section = normalized.slice(4, 5);
  const seq = parseInt(normalized.slice(5, 8), 10);
  const division = divisionForGrade(grade);
  if (!division) return null;
  return { year, grade, section, seq, division };
}

export interface ControlNumberInput {
  year: number;
  grade: number;
  section: string;
  seq: number;
}

export function formatControlNumber({ year, grade, section, seq }: ControlNumberInput): string {
  const yy = String(year).slice(-2).padStart(2, "0");
  const gg = String(grade).padStart(2, "0");
  const s = section.toUpperCase();
  const nnn = String(seq).padStart(3, "0");
  return `${yy}${gg}${s}${nnn}`;
}

export function generateControlNumber(year: number, grade: number, section: string, seq: number): string {
  return formatControlNumber({ year, grade, section, seq });
}
