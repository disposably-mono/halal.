"use server";

import { prisma } from "@/lib/prisma";
import { generateControlNumber } from "@/lib/domain/control-number";
import { canFinalizeUnlock } from "@/lib/domain/election-state";
import {
  isGradeInDivisionRange,
  parseVotersCSV,
} from "@/lib/domain/voter-import";
import { requireCapability } from "@/lib/server/auth";
import { revalidateElectionVoters } from "@/lib/server/revalidate";
import {
  AddVoterManualSchema,
  AddVotersFromCSVSchema,
  ElectionIdSchema,
  RemoveVoterSchema,
  safeParseFormData,
} from "@/lib/validation/schemas";

export type CSVImportResult = {
  added: number;
  rejected: number;
  skippedDuplicates: number;
  reasons: string[];
};

export type ManualAddResult = { success: boolean; error?: string };
export type FinalizeResult = { success: boolean; error?: string };

export async function addVotersFromCSV(
  _prevState: CSVImportResult | null,
  formData: FormData,
): Promise<CSVImportResult | null> {
  await requireCapability("voters:manage");
  const parsed = safeParseFormData(AddVotersFromCSVSchema, formData);
  if (!parsed.success) {
    return { added: 0, rejected: 0, skippedDuplicates: 0, reasons: ["Missing required fields."] };
  }
  const { electionId, csvText, schoolYear } = parsed.data;

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    select: { division: true, votersFinalized: true },
  });
  if (!election) {
    return { added: 0, rejected: 0, skippedDuplicates: 0, reasons: ["Election not found."] };
  }
  if (election.votersFinalized) {
    return {
      added: 0,
      rejected: 0,
      skippedDuplicates: 0,
      reasons: ["Voter list is finalized and cannot be modified."],
    };
  }

  const [existingForElection, allCodes, allVoters] = await Promise.all([
    prisma.voter.findMany({ where: { electionId }, select: { studentId: true } }),
    prisma.voter.findMany({ select: { voterCode: true } }),
    prisma.voter.findMany({ select: { gradeLevel: true, section: true } }),
  ]);

  const seqMap: Record<string, number> = {};
  for (const v of allVoters) {
    const key = `${v.gradeLevel}-${v.section}`;
    seqMap[key] = (seqMap[key] ?? 0) + 1;
  }

  const result = parseVotersCSV(csvText, {
    division: election.division,
    schoolYear,
    existingStudentIds: new Set(existingForElection.map((v) => v.studentId)),
    existingVoterCodes: new Set(allCodes.map((v) => v.voterCode)),
    seqByGradeSection: seqMap,
  });

  if (result.toCreate.length > 0) {
    await prisma.voter.createMany({
      data: result.toCreate.map((row) => ({ ...row, electionId })),
    });
    revalidateElectionVoters(electionId);
  }

  return {
    added: result.toCreate.length,
    rejected: result.rejected,
    skippedDuplicates: result.skippedDuplicates,
    reasons: result.reasons,
  };
}

export async function addVoterManual(
  _prevState: ManualAddResult | null,
  formData: FormData,
): Promise<ManualAddResult | null> {
  await requireCapability("voters:manage");
  const parsed = safeParseFormData(AddVoterManualSchema, formData);
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }
  const { electionId, studentId, gradeLevel, section, schoolYear } = parsed.data;

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    select: { division: true, votersFinalized: true },
  });
  if (!election) return { success: false, error: "Election not found." };
  if (election.votersFinalized) return { success: false, error: "Voter list is locked." };

  if (!isGradeInDivisionRange(election.division, gradeLevel)) {
    return { success: false, error: `Grade outside ${election.division} range.` };
  }

  const existingStudent = await prisma.voter.findFirst({
    where: { electionId, studentId },
  });
  if (existingStudent) return { success: false, error: "Student ID already registered." };

  const sectionUp = section.toUpperCase();
  const count = await prisma.voter.count({
    where: { gradeLevel, section: sectionUp },
  });

  const voterCode = generateControlNumber(schoolYear, gradeLevel, section, count + 1);

  await prisma.voter.create({
    data: {
      electionId,
      studentId,
      gradeLevel,
      section: sectionUp,
      division: election.division,
      voterCode,
    },
  });

  revalidateElectionVoters(electionId);
  return { success: true };
}

export async function removeVoter(formData: FormData) {
  await requireCapability("voters:manage");
  const parsed = safeParseFormData(RemoveVoterSchema, formData);
  if (!parsed.success) return;
  const { voterId, electionId } = parsed.data;

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    select: { votersFinalized: true },
  });
  if (election?.votersFinalized) return;

  await prisma.voter.delete({ where: { id: voterId } });
  revalidateElectionVoters(electionId);
}

export async function finalizeVoters(
  _prevState: FinalizeResult | null,
  formData: FormData,
): Promise<FinalizeResult> {
  await requireCapability("voters:manage");
  const parsed = safeParseFormData(ElectionIdSchema, formData);
  if (!parsed.success) return { success: false, error: "Missing election." };
  const { electionId } = parsed.data;

  const count = await prisma.voter.count({ where: { electionId } });
  if (count < 1) {
    return { success: false, error: "At least 1 voter must be registered before finalizing." };
  }

  await prisma.election.update({
    where: { id: electionId },
    data: { votersFinalized: true },
  });

  revalidateElectionVoters(electionId);
  return { success: true };
}

export async function unfinalizeVoters(
  _prevState: FinalizeResult | null,
  formData: FormData,
): Promise<FinalizeResult> {
  await requireCapability("voters:manage");
  const parsed = safeParseFormData(ElectionIdSchema, formData);
  if (!parsed.success) return { success: false, error: "Missing election." };
  const { electionId } = parsed.data;

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    select: { status: true },
  });
  if (!election) return { success: false, error: "Election not found." };

  const guard = canFinalizeUnlock(election.status);
  if (!guard.ok) {
    return {
      success: false,
      error: guard.reason.replace("Cannot unlock", "Cannot unlock voters"),
    };
  }

  await prisma.election.update({
    where: { id: electionId },
    data: { votersFinalized: false },
  });

  revalidateElectionVoters(electionId);
  return { success: true };
}

export async function removeVoterById(voterId: string, electionId: string) {
  await requireCapability("voters:manage");

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    select: { votersFinalized: true },
  });
  if (election?.votersFinalized) return;

  await prisma.voter.delete({ where: { id: voterId } });
  revalidateElectionVoters(electionId);
}
