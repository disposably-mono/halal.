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

/** The `YYGGS` prefix (year · grade · section) that all codes in one cohort share. */
export function controlNumberPrefix(year: number, grade: number, section: string): string {
  const yy = String(year).slice(-2).padStart(2, "0");
  const gg = String(grade).padStart(2, "0");
  const s = section.toUpperCase();
  return `${yy}${gg}${s}`;
}

export function formatControlNumber({ year, grade, section, seq }: ControlNumberInput): string {
  const nnn = String(seq).padStart(3, "0");
  return `${controlNumberPrefix(year, grade, section)}${nnn}`;
}

export function generateControlNumber(year: number, grade: number, section: string, seq: number): string {
  return formatControlNumber({ year, grade, section, seq });
}

/**
 * Next control number for a (year, grade, section) cohort, assigned
 * monotonically: one above the highest sequence already issued in that cohort.
 *
 * Only codes sharing this cohort's `YYGGS` prefix are considered, so `existingCodes`
 * may safely contain codes from other cohorts/years/elections. Because the result
 * is strictly greater than every existing sequence, it can never collide with an
 * issued code, and gap numbers freed by mid-roster deletions are never reused —
 * avoiding any clash with a control slip already handed out.
 */
export function nextControlNumber(
  year: number,
  grade: number,
  section: string,
  existingCodes: Iterable<string>,
): string {
  const prefix = controlNumberPrefix(year, grade, section);
  const maxSeq = Array.from(existingCodes).reduce((max, code) => {
    const normalized = normalizeControlNumber(code);
    if (!normalized.startsWith(prefix)) return max;
    const seq = parseInt(normalized.slice(5, 8), 10);
    return !Number.isNaN(seq) && seq > max ? seq : max;
  }, 0);
  return formatControlNumber({ year, grade, section, seq: maxSeq + 1 });
}
