import type { Division } from "@prisma/client";
import { DIVISION_GRADE_RANGE } from "@/lib/elections/constants";
import { nextControlNumber } from "@/lib/domain/control-number";

export interface VoterImportContext {
  division: Division;
  schoolYear: number;
  existingStudentIds: ReadonlySet<string>;
  /**
   * Every control number already issued (any election/year). New codes are
   * assigned one above the highest in each cohort, so this set seeds the
   * monotonic counter and guarantees no collisions.
   */
  existingVoterCodes: ReadonlySet<string>;
}

export interface VoterImportRow {
  studentId: string;
  gradeLevel: number;
  section: string;
  division: Division;
  voterCode: string;
}

export interface VoterImportResult {
  toCreate: VoterImportRow[];
  rejected: number;
  skippedDuplicates: number;
  reasons: string[];
}

export function isGradeInDivisionRange(division: Division, grade: number): boolean {
  const range = DIVISION_GRADE_RANGE[division];
  return grade >= range.min && grade <= range.max;
}

export function parseVotersCSV(csvText: string, ctx: VoterImportContext): VoterImportResult {
  const range = DIVISION_GRADE_RANGE[ctx.division];
  const lines = csvText.trim().split("\n").slice(1);
  const studentIds = new Set<string>(ctx.existingStudentIds);
  // Grows as we assign so every new code is monotonic vs. both stored and
  // just-issued codes — never colliding and never reusing a freed number.
  const issuedCodes = new Set<string>(ctx.existingVoterCodes);
  const toCreate: VoterImportRow[] = [];
  let rejected = 0;
  let skippedDuplicates = 0;
  const reasons = new Set<string>();

  for (const line of lines) {
    if (!line.trim()) continue;
    const [studentId, gradeLevelRaw, section] = line
      .split(",")
      .map((c) => c.trim().replace(/^"|"$/g, ""));

    if (!studentId || !gradeLevelRaw || !section) {
      rejected++;
      reasons.add("Rows with missing columns were skipped.");
      continue;
    }

    const gradeLevel = parseInt(gradeLevelRaw, 10);
    if (isNaN(gradeLevel) || gradeLevel < range.min || gradeLevel > range.max) {
      rejected++;
      reasons.add(`Rows rejected: Grades must be within ${range.min}–${range.max}.`);
      continue;
    }

    // A row is only a duplicate if the *student* is already registered — never
    // because a control number happened to be taken. Codes are issued, not matched.
    if (studentIds.has(studentId)) {
      skippedDuplicates++;
      continue;
    }

    const sectionUp = section.toUpperCase();
    const voterCode = nextControlNumber(ctx.schoolYear, gradeLevel, sectionUp, issuedCodes);

    toCreate.push({
      studentId,
      gradeLevel,
      section: sectionUp,
      division: ctx.division,
      voterCode,
    });
    studentIds.add(studentId);
    issuedCodes.add(voterCode);
  }

  if (skippedDuplicates > 0) {
    reasons.add(
      `${skippedDuplicates} duplicate row${skippedDuplicates !== 1 ? "s were" : " was"} skipped.`,
    );
  }

  return { toCreate, rejected, skippedDuplicates, reasons: Array.from(reasons) };
}
