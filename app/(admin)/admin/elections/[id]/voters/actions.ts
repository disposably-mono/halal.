"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { DIVISION_GRADE_RANGE } from "../../lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CSVImportResult = {
  added: number;
  rejected: number;
  reasons: string[];
};

export type ManualAddResult = {
  success: boolean;
  error?: string;
};

export type FinalizeResult = {
  success: boolean;
  error?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireSession() {
  const session = await auth();
  if (!session) redirect("/admin/login");
}

function revalidate(electionId: string) {
  revalidatePath(`/admin/elections/${electionId}/voters`);
}

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

// ─── CSV Import ───────────────────────────────────────────────────────────────

export async function addVotersFromCSV(
  _prevState: CSVImportResult | null,
  formData: FormData
): Promise<CSVImportResult | null> {
  await requireSession();
  const electionId = formData.get("electionId") as string;
  const csvText = formData.get("csvText") as string;
  const schoolYear = parseInt(formData.get("schoolYear") as string);

  if (!electionId || !csvText || !schoolYear) {
    return { added: 0, rejected: 0, reasons: ["Missing required fields."] };
  }

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    select: { division: true, votersFinalized: true },
  });

  if (!election)
    return { added: 0, rejected: 0, reasons: ["Election not found."] };
  if (election.votersFinalized)
    return {
      added: 0,
      rejected: 0,
      reasons: ["Voter list is finalized and cannot be modified."],
    };

  const range = DIVISION_GRADE_RANGE[election.division];
  const lines = csvText.trim().split("\n").slice(1); // skip header

  const existing = await prisma.voter.findMany({
    where: { electionId },
    select: { studentId: true },
  });
  const existingStudentIds = new Set(existing.map((v) => v.studentId));

  const allCodes = await prisma.voter.findMany({
    select: { voterCode: true },
  });
  const existingVoterCodes = new Set(allCodes.map((v) => v.voterCode));

  const allVoters = await prisma.voter.findMany({
    select: { gradeLevel: true, section: true },
  });
  const seqMap: Record<string, number> = {};
  for (const v of allVoters) {
    const key = `${v.gradeLevel}-${v.section}`;
    seqMap[key] = (seqMap[key] ?? 0) + 1;
  }

  const toCreate = [];
  let rejected = 0;
  const reasons: Set<string> = new Set();

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

    const gradeLevel = parseInt(gradeLevelRaw);
    if (isNaN(gradeLevel) || gradeLevel < range.min || gradeLevel > range.max) {
      rejected++;
      reasons.add(`Rows rejected: Grades must be within ${range.min}–${range.max}.`);
      continue;
    }

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
      division: election.division,
      voterCode,
    });

    existingStudentIds.add(studentId);
    existingVoterCodes.add(voterCode);
  }

  if (toCreate.length > 0) {
    await prisma.voter.createMany({ data: toCreate });
    revalidate(electionId);
  }

  return { added: toCreate.length, rejected, reasons: Array.from(reasons) };
}

// ─── Manual Add ───────────────────────────────────────────────────────────────

export async function addVoterManual(
  _prevState: ManualAddResult | null,
  formData: FormData
): Promise<ManualAddResult | null> {
  await requireSession();
  const electionId = formData.get("electionId") as string;
  const studentId = (formData.get("studentId") as string).trim();
  const gradeLevelRaw = formData.get("gradeLevel") as string;
  const section = (formData.get("section") as string).trim();
  const schoolYear = parseInt(formData.get("schoolYear") as string);

  // Validate schoolYear
  if (isNaN(schoolYear)) {
    return { success: false, error: "Invalid school year." };
  }

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    select: { division: true, votersFinalized: true },
  });

  if (!election) return { success: false, error: "Election not found." };
  if (election.votersFinalized)
    return { success: false, error: "Voter list is locked." };

  // Parse and validate gradeLevel
  const gradeLevel = parseInt(gradeLevelRaw);
  if (isNaN(gradeLevel)) {
    return { success: false, error: "Valid grade level is required." };
  }

  const range = DIVISION_GRADE_RANGE[election.division];

  if (gradeLevel < range.min || gradeLevel > range.max) {
    return {
      success: false,
      error: `Grade outside ${election.division} range.`,
    };
  }

  // Validate section
  if (!section) {
    return { success: false, error: "Section is required." };
  }

  const existingStudent = await prisma.voter.findFirst({
    where: { electionId, studentId },
  });
  if (existingStudent)
    return { success: false, error: "Student ID already registered." };

  // FIXED: Added gradeLevel validation to ensure it's not undefined
  const count = await prisma.voter.count({
    where: {
      gradeLevel: gradeLevel,
      section: section.toUpperCase()
    },
  });

  const voterCode = generateControlNumber(
    schoolYear,
    gradeLevel,
    section,
    count + 1
  );

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

  revalidate(electionId);
  return { success: true };
}

// ─── Remove voter ─────────────────────────────────────────────────────────────

export async function removeVoter(formData: FormData) {
  await requireSession();
  const voterId = formData.get("voterId") as string;
  const electionId = formData.get("electionId") as string;

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    select: { votersFinalized: true },
  });

  if (election?.votersFinalized) return;

  await prisma.voter.delete({ where: { id: voterId } });
  revalidate(electionId);
}

// ─── Finalize voters ──────────────────────────────────────────────────────────
// Returns a result object instead of throwing — prevents crash pages.

export async function finalizeVoters(
  _prevState: FinalizeResult | null,
  formData: FormData
): Promise<FinalizeResult> {
  await requireSession();
  const electionId = formData.get("electionId") as string;

  const count = await prisma.voter.count({ where: { electionId } });
  if (count < 1) {
    return {
      success: false,
      error: "At least 1 voter must be registered before finalizing.",
    };
  }

  await prisma.election.update({
    where: { id: electionId },
    data: { votersFinalized: true },
  });

  revalidate(electionId);
  return { success: true };
}

// ─── Unfinalize voters ────────────────────────────────────────────────────────

export async function unfinalizeVoters(
  _prevState: FinalizeResult | null,
  formData: FormData
): Promise<FinalizeResult> {
  await requireSession();
  const electionId = formData.get("electionId") as string;

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    select: { status: true },
  });

  if (election?.status === "OPEN" || election?.status === "CLOSED") {
    return {
      success: false,
      error: "Cannot unlock voters while the election is Open or Closed.",
    };
  }

  await prisma.election.update({
    where: { id: electionId },
    data: { votersFinalized: false },
  });

  revalidate(electionId);
  return { success: true };
}
