"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

function gradeToDiv(grade: number): "GS" | "JHS" | "SHS" {
  if (grade >= 3 && grade <= 5) return "GS";
  if (grade >= 6 && grade <= 9) return "JHS";
  return "SHS";
}

export async function addVotersFromCSV(formData: FormData) {
  const electionId = formData.get("electionId") as string;
  const csvText = formData.get("csvText") as string;
  const schoolYear = parseInt(formData.get("schoolYear") as string);

  if (!electionId || !csvText || !schoolYear) return;

  const lines = csvText.trim().split("\n").slice(1); // skip header

  const existing = await prisma.voter.findMany({
    where: { electionId },
    select: { studentId: true, voterCode: true, gradeLevel: true, section: true },
  });

  const existingStudentIds = new Set(existing.map((v) => v.studentId));
  const existingVoterCodes = new Set(existing.map((v) => v.voterCode));

  // Seed sequence map from existing voters
  const seqMap: Record<string, number> = {};
  for (const v of existing) {
    const key = `${v.gradeLevel}-${v.section}`;
    seqMap[key] = (seqMap[key] ?? 0) + 1;
  }

  const toCreate = [];

  for (const line of lines) {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const [studentId, gradeLevelRaw, section] = cols;

    if (!studentId || !gradeLevelRaw || !section) continue;

    const gradeLevel = parseInt(gradeLevelRaw);
    if (isNaN(gradeLevel)) continue;

    // Skip if studentId or generated voterCode already exists
    if (existingStudentIds.has(studentId)) continue;

    const key = `${gradeLevel}-${section.toUpperCase()}`;
    seqMap[key] = (seqMap[key] ?? 0) + 1;

    const voterCode = generateControlNumber(
      schoolYear,
      gradeLevel,
      section,
      seqMap[key]
    );

    if (existingVoterCodes.has(voterCode)) continue;

    toCreate.push({
      electionId,
      studentId,
      gradeLevel,
      section: section.toUpperCase(),
      division: gradeToDiv(gradeLevel),
      voterCode,
    });

    existingStudentIds.add(studentId);
    existingVoterCodes.add(voterCode);
  }

  if (toCreate.length === 0) return;

  await prisma.voter.createMany({ data: toCreate });
  revalidatePath(`/admin/elections/${electionId}/voters`);
}

export async function addVoterManual(formData: FormData) {
  const electionId = formData.get("electionId") as string;
  const studentId = formData.get("studentId") as string;
  const gradeLevelRaw = formData.get("gradeLevel") as string;
  const section = formData.get("section") as string;
  const schoolYear = parseInt(formData.get("schoolYear") as string);

  if (!electionId || !studentId || !gradeLevelRaw || !section || !schoolYear) return;

  const gradeLevel = parseInt(gradeLevelRaw);
  if (isNaN(gradeLevel)) return;

  // Check for duplicate studentId
  const existingStudent = await prisma.voter.findFirst({
    where: { electionId, studentId },
  });
  if (existingStudent) return;

  const count = await prisma.voter.count({
    where: { electionId, gradeLevel, section: section.toUpperCase() },
  });

  const voterCode = generateControlNumber(schoolYear, gradeLevel, section, count + 1);

  // Check for duplicate voterCode
  const existingCode = await prisma.voter.findFirst({
    where: { voterCode },
  });
  if (existingCode) return;

  await prisma.voter.create({
    data: {
      electionId,
      studentId,
      gradeLevel,
      section: section.toUpperCase(),
      division: gradeToDiv(gradeLevel),
      voterCode,
    },
  });

  revalidatePath(`/admin/elections/${electionId}/voters`);
}

export async function removeVoter(formData: FormData) {
  const voterId = formData.get("voterId") as string;
  const electionId = formData.get("electionId") as string;
  if (!voterId) return;
  await prisma.voter.delete({ where: { id: voterId } });
  revalidatePath(`/admin/elections/${electionId}/voters`);
}
