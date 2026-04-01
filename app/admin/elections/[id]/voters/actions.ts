"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DIVISION_GRADE_RANGE } from "../../lib/constants";

function generateControlNumber(
  year: number,
  grade: number,
  section: string,
  seq: number
): string {
  const yy = String(year).slice(-2);
  const gg = String(grade).padStart(2, "0");
  const s = section.toUpperCase();
  const nnn = String(seq).padStart(3, "0");
  return `${yy}${gg}${s}${nnn}`;
}

export type CSVImportResult = {
  added: number;
  rejected: number;
  reasons: string[];
};

export type ManualAddResult = {
  success: boolean;
  error?: string;
};

export async function addVotersFromCSV(
  _prevState: CSVImportResult | null,
  formData: FormData
): Promise<CSVImportResult | null> {
  const electionId = formData.get("electionId") as string;
  const csvText = formData.get("csvText") as string;
  const schoolYear = parseInt(formData.get("schoolYear") as string);

  if (!electionId || !csvText || !schoolYear) {
    return { added: 0, rejected: 0, reasons: ["Missing required fields."] };
  }

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    select: { division: true },
  });

  if (!election) {
    return { added: 0, rejected: 0, reasons: ["Election not found."] };
  }

  const range = DIVISION_GRADE_RANGE[election.division];
  if (!range) {
    return { added: 0, rejected: 0, reasons: [`Configuration error: No grade range defined for ${election.division}.`] };
  }

  const lines = csvText.trim().split("\n").slice(1); // skip header

  const existing = await prisma.voter.findMany({
    where: { electionId },
    select: { studentId: true, voterCode: true, gradeLevel: true, section: true },
  });

  const existingStudentIds = new Set(existing.map((v) => v.studentId));
  const existingVoterCodes = new Set(existing.map((v) => v.voterCode));

  const seqMap: Record<string, number> = {};
  for (const v of existing) {
    const key = `${v.gradeLevel}-${v.section}`;
    seqMap[key] = (seqMap[key] ?? 0) + 1;
  }

  const toCreate = [];
  let rejected = 0;
  const reasons: Set<string> = new Set(); // Using a Set to avoid duplicate reason messages
  const rejectedGrades = new Set<number>();

  for (const line of lines) {
    // Anti-crash: Skip entirely empty lines
    if (!line.trim()) continue;

    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const [studentId, gradeLevelRaw, section] = cols;

    // Anti-crash: Catch missing columns
    if (!studentId || !gradeLevelRaw || !section) {
      rejected++;
      reasons.add("One or more rows had missing columns.");
      continue;
    }

    const gradeLevel = parseInt(gradeLevelRaw);

    // Anti-crash: Catch non-numeric grades
    if (isNaN(gradeLevel)) {
      rejected++;
      reasons.add(`Invalid grade format found (e.g., "${gradeLevelRaw}").`);
      continue;
    }

    // Grade validation using min/max object
    if (gradeLevel < range.min || gradeLevel > range.max) {
      rejected++;
      rejectedGrades.add(gradeLevel);
      continue;
    }

    // Skip duplicates quietly
    if (existingStudentIds.has(studentId)) continue;

    const key = `${gradeLevel}-${section.toUpperCase()}`;
    seqMap[key] = (seqMap[key] ?? 0) + 1;

    const voterCode = generateControlNumber(
      schoolYear,
      gradeLevel,
      section,
      seqMap[key]
    );

    // Skip control number collisions quietly
    if (existingVoterCodes.has(voterCode)) continue;

    toCreate.push({
      electionId,
      studentId,
      gradeLevel,
      section: section.toUpperCase(),
      division: election.division,
      voterCode,
    });

    existingStudentIds.add(studentId);
    existingVoterCodes.add(voterCode);
  }

  if (rejectedGrades.size > 0) {
    const gradeList = Array.from(rejectedGrades).sort((a, b) => a - b).join(", ");
    reasons.add(
      `Rows rejected: Grade(s) ${gradeList} are outside the ${election.division} range (${range.min}–${range.max}).`
    );
  }

  if (toCreate.length > 0) {
    await prisma.voter.createMany({ data: toCreate });
    revalidatePath(`/admin/elections/${electionId}/voters`);
  }

  return { added: toCreate.length, rejected, reasons: Array.from(reasons) };
}

export async function addVoterManual(
  _prevState: ManualAddResult | null,
  formData: FormData
): Promise<ManualAddResult | null> {
  const electionId = formData.get("electionId") as string;
  const studentId = formData.get("studentId") as string;
  const gradeLevelRaw = formData.get("gradeLevel") as string;
  const section = formData.get("section") as string;
  const schoolYear = parseInt(formData.get("schoolYear") as string);

  if (!electionId || !studentId || !gradeLevelRaw || !section || !schoolYear) {
    return { success: false, error: "All fields are required." };
  }

  const gradeLevel = parseInt(gradeLevelRaw);
  if (isNaN(gradeLevel)) {
    return { success: false, error: "Grade must be a number." };
  }

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    select: { division: true },
  });

  if (!election) {
    return { success: false, error: "Election not found." };
  }

  const range = DIVISION_GRADE_RANGE[election.division];
  if (!range) {
    return { success: false, error: `Configuration error: No grade range for ${election.division}.` };
  }

  // Grade validation using min/max object
  if (gradeLevel < range.min || gradeLevel > range.max) {
    return {
      success: false,
      error: `Grade ${gradeLevel} is outside the ${election.division} range (${range.min}–${range.max}).`,
    };
  }

  const existingStudent = await prisma.voter.findFirst({
    where: { electionId, studentId },
  });

  if (existingStudent) {
    return { success: false, error: `Student ID ${studentId} is already registered.` };
  }

  const count = await prisma.voter.count({
    where: { electionId, gradeLevel, section: section.toUpperCase() },
  });

  const voterCode = generateControlNumber(schoolYear, gradeLevel, section, count + 1);

  const existingCode = await prisma.voter.findFirst({ where: { voterCode } });
  if (existingCode) {
    return { success: false, error: "Control number collision — please try again." };
  }

  await prisma.voter.create({
    data: {
      electionId,
      studentId,
      gradeLevel,
      section: section.toUpperCase(),
      division: election.division,
      voterCode,
    },
  });

  revalidatePath(`/admin/elections/${electionId}/voters`);
  return { success: true };
}

export async function removeVoter(formData: FormData) {
  const voterId = formData.get("voterId") as string;
  const electionId = formData.get("electionId") as string;
  if (!voterId) return;
  await prisma.voter.delete({ where: { id: voterId } });
  revalidatePath(`/admin/elections/${electionId}/voters`);
}
