"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { nextControlNumber } from "@/lib/domain/control-number";
import { canEditVoterRoster, canFinalizeUnlock } from "@/lib/domain/election-state";
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
    select: { division: true, status: true, votersFinalized: true },
  });
  if (!election) {
    return { added: 0, rejected: 0, skippedDuplicates: 0, reasons: ["Election not found."] };
  }
  const editGuard = canEditVoterRoster(election.status, election.votersFinalized);
  if (!editGuard.ok) {
    return {
      added: 0,
      rejected: 0,
      skippedDuplicates: 0,
      reasons: [editGuard.reason],
    };
  }

  // O(n) by design: control-number uniqueness is enforced globally, so we load
  // every existing voterCode into a Set for collision checks during import. This
  // scans the whole Voter table per import; at school scale (a few thousand rows
  // across all elections) that's a cheap single query and an accepted tradeoff
  // versus a per-row existence check.
  const [existingForElection, allCodes] = await Promise.all([
    prisma.voter.findMany({ where: { electionId }, select: { studentId: true } }),
    prisma.voter.findMany({ select: { voterCode: true } }),
  ]);

  const result = parseVotersCSV(csvText, {
    division: election.division,
    schoolYear,
    existingStudentIds: new Set(existingForElection.map((v) => v.studentId)),
    existingVoterCodes: new Set(allCodes.map((v) => v.voterCode)),
  });

  let createdCount = result.toCreate.length;

  if (result.toCreate.length > 0) {
    try {
      // skipDuplicates degrades a whole-batch unique-constraint failure into a
      // partial insert: rows that lose a race against a concurrent import (same
      // voterCode or electionId+studentId claimed between our uniqueness scan
      // above and this write) are silently dropped instead of aborting every
      // row in the batch.
      const outcome = await prisma.voter.createMany({
        data: result.toCreate.map((row) => ({ ...row, electionId })),
        skipDuplicates: true,
      });
      createdCount = outcome.count;
    } catch (error) {
      // Defensive fallback: if the driver still surfaces a raw unique-constraint
      // violation despite skipDuplicates, degrade gracefully instead of letting
      // it crash the server action — same P2002 handling as addVoterManual.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        createdCount = 0;
      } else {
        throw error;
      }
    }

    if (createdCount > 0) revalidateElectionVoters(electionId);
  }

  const collided = result.toCreate.length - createdCount;
  const reasons =
    collided > 0
      ? [
          ...result.reasons,
          `${createdCount} of ${result.toCreate.length} voters imported; ${collided} had control-number collisions with a concurrent import — please retry the import for the remainder.`,
        ]
      : result.reasons;

  return {
    added: createdCount,
    rejected: result.rejected,
    skippedDuplicates: result.skippedDuplicates,
    reasons,
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
    select: { division: true, status: true, votersFinalized: true },
  });
  if (!election) return { success: false, error: "Election not found." };
  const editGuard = canEditVoterRoster(election.status, election.votersFinalized);
  if (!editGuard.ok) return { success: false, error: editGuard.reason };

  if (!isGradeInDivisionRange(election.division, gradeLevel)) {
    return { success: false, error: `Grade outside ${election.division} range.` };
  }

  const existingStudent = await prisma.voter.findFirst({
    where: { electionId, studentId },
  });
  if (existingStudent) return { success: false, error: "Student ID already registered." };

  const sectionUp = section.toUpperCase();
  // Issue one above the highest code already in this year+grade+section cohort
  // (across every election), so the number is monotonic and never collides.
  const cohort = await prisma.voter.findMany({
    where: { gradeLevel, section: sectionUp },
    select: { voterCode: true },
  });
  const voterCode = nextControlNumber(
    schoolYear,
    gradeLevel,
    sectionUp,
    cohort.map((v) => v.voterCode),
  );

  try {
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
  } catch (error) {
    // A concurrent add can claim the same next code; the unique constraint guards
    // it. Surface a friendly retry instead of a raw Prisma error.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { success: false, error: "That control number was just taken. Please try again." };
    }
    throw error;
  }

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
    select: { status: true, votersFinalized: true },
  });
  if (!election || !canEditVoterRoster(election.status, election.votersFinalized).ok) return;

  await prisma.voter.deleteMany({ where: { id: voterId, electionId } });
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

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    select: { status: true, votersFinalized: true },
  });
  if (!election) return { success: false, error: "Election not found." };
  const editGuard = canEditVoterRoster(election.status, election.votersFinalized);
  if (!editGuard.ok) return { success: false, error: editGuard.reason };

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
    select: { status: true, archivedAt: true },
  });
  if (!election) return { success: false, error: "Election not found." };

  const guard = canFinalizeUnlock(election.status, election.archivedAt);
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
    select: { status: true, votersFinalized: true },
  });
  if (!election || !canEditVoterRoster(election.status, election.votersFinalized).ok) return;

  await prisma.voter.deleteMany({ where: { id: voterId, electionId } });
  revalidateElectionVoters(electionId);
}
