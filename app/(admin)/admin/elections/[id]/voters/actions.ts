"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { nextControlNumber } from "@/lib/domain/control-number";
import { canEditVoterRoster } from "@/lib/domain/election-state";
import {
  isGradeInDivisionRange,
  parseVotersCSV,
} from "@/lib/domain/voter-import";
import { requireCapability } from "@/lib/server/auth";
import { revalidateElectionVoters } from "@/lib/server/revalidate";
import { guardEditableRoster, unfinalizeRoster } from "../roster-guard";
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

type ImportCohort = {
  gradeLevel: number;
  section: string;
};

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

  const guard = await guardEditableRoster(
    electionId,
    { division: true, status: true, votersFinalized: true },
    (e) => canEditVoterRoster(e.status, e.votersFinalized),
  );
  if (!guard.ok) {
    return { added: 0, rejected: 0, skippedDuplicates: 0, reasons: [guard.error] };
  }
  const election = guard.election;

  // Load only the grade/section cohorts present in this CSV. The control-number
  // prefix is still checked in memory, but the query stays bounded and can use
  // the existing `(gradeLevel, section)` index instead of scanning every voter.
  const importCohorts = collectImportCohorts(csvText);
  const [existingForElection, existingVoterCodes] = await Promise.all([
    prisma.voter.findMany({ where: { electionId }, select: { studentId: true } }),
    loadExistingVoterCodes(importCohorts),
  ]);

  const result = parseVotersCSV(csvText, {
    division: election.division,
    schoolYear,
    existingStudentIds: new Set(existingForElection.map((v) => v.studentId)),
    existingVoterCodes,
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

  const guard = await guardEditableRoster(
    electionId,
    { division: true, status: true, votersFinalized: true },
    (e) => canEditVoterRoster(e.status, e.votersFinalized),
  );
  if (!guard.ok) return { success: false, error: guard.error };
  const election = guard.election;

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

  const guard = await guardEditableRoster(
    electionId,
    { status: true, votersFinalized: true },
    (e) => canEditVoterRoster(e.status, e.votersFinalized),
  );
  if (!guard.ok) return;

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

  const guard = await guardEditableRoster(
    electionId,
    { status: true, votersFinalized: true },
    (e) => canEditVoterRoster(e.status, e.votersFinalized),
  );
  if (!guard.ok) return { success: false, error: guard.error };

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

  const result = await unfinalizeRoster(electionId, "votersFinalized", "voters");
  if (result.success) revalidateElectionVoters(electionId);
  return result;
}

export async function removeVoterById(voterId: string, electionId: string) {
  await requireCapability("voters:manage");

  const guard = await guardEditableRoster(
    electionId,
    { status: true, votersFinalized: true },
    (e) => canEditVoterRoster(e.status, e.votersFinalized),
  );
  if (!guard.ok) return;

  await prisma.voter.deleteMany({ where: { id: voterId, electionId } });
  revalidateElectionVoters(electionId);
}

function collectImportCohorts(csvText: string): ImportCohort[] {
  const seen = new Set<string>();
  const cohorts: ImportCohort[] = [];
  const lines = csvText.trim().split("\n").slice(1);

  for (const line of lines) {
    if (!line.trim()) continue;
    const [, gradeLevelRaw, sectionRaw] = line
      .split(",")
      .map((column) => column.trim().replace(/^"|"$/g, ""));
    const gradeLevel = Number.parseInt(gradeLevelRaw, 10);
    const section = sectionRaw?.toUpperCase();
    if (!Number.isFinite(gradeLevel) || !section) continue;

    const key = `${gradeLevel}:${section}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cohorts.push({ gradeLevel, section });
  }

  return cohorts;
}

async function loadExistingVoterCodes(cohorts: readonly ImportCohort[]): Promise<Set<string>> {
  if (cohorts.length === 0) return new Set();

  const rows = await prisma.voter.findMany({
    where: {
      OR: cohorts.map((cohort) => ({
        gradeLevel: cohort.gradeLevel,
        section: cohort.section,
      })),
    },
    select: { voterCode: true },
  });

  return new Set(rows.map((row) => row.voterCode));
}
