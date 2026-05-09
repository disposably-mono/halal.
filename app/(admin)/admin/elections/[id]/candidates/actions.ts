"use server";

import { prisma } from "@/lib/prisma";
import { DIVISION_POSITIONS } from "@/lib/elections/constants";
import { pickCandidateDefaultGrade } from "@/lib/domain/ballot";
import { canFinalizeUnlock } from "@/lib/domain/election-state";
import { requireAdminSession } from "@/lib/server/auth";
import { revalidateElectionCandidates } from "@/lib/server/revalidate";
import {
  AddCandidateSchema,
  AddSinglePositionSchema,
  ElectionIdSchema,
  RemoveCandidateSchema,
  RemovePositionSchema,
  SeedPositionsSchema,
  safeParseFormData,
} from "@/lib/validation/schemas";

export type FinalizeResult = {
  success: boolean;
  error?: string;
};

export async function seedAllPositions(formData: FormData) {
  await requireAdminSession();
  const parsed = safeParseFormData(SeedPositionsSchema, formData);
  if (!parsed.success) return;
  const { electionId, division } = parsed.data;
  const positions = DIVISION_POSITIONS[division] ?? [];

  await prisma.$transaction(
    positions.map((p, i) =>
      prisma.position.create({
        data: {
          electionId,
          title: p.title,
          candidateGrade: p.candidateGrade,
          eligibleGrades: p.eligibleGrades,
          order: i,
          isActive: true,
        },
      }),
    ),
  );
  revalidateElectionCandidates(electionId);
}

export async function addSinglePosition(formData: FormData) {
  await requireAdminSession();
  const parsed = safeParseFormData(AddSinglePositionSchema, formData);
  if (!parsed.success) return;
  const { electionId, division, title } = parsed.data;

  const positionDef = (DIVISION_POSITIONS[division] ?? []).find((p) => p.title === title);
  if (!positionDef) return;

  const last = await prisma.position.findFirst({
    where: { electionId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.position.create({
    data: {
      electionId,
      title: positionDef.title,
      candidateGrade: positionDef.candidateGrade,
      eligibleGrades: positionDef.eligibleGrades,
      order: (last?.order ?? -1) + 1,
      isActive: true,
    },
  });
  revalidateElectionCandidates(electionId);
}

export async function removePosition(formData: FormData) {
  await requireAdminSession();
  const parsed = safeParseFormData(RemovePositionSchema, formData);
  if (!parsed.success) return;
  const { positionId, electionId } = parsed.data;

  await prisma.position.update({
    where: { id: positionId },
    data: { isActive: false },
  });
  revalidateElectionCandidates(electionId);
}

export async function addCandidate(formData: FormData) {
  await requireAdminSession();
  const parsed = safeParseFormData(AddCandidateSchema, formData);
  if (!parsed.success) return;
  const { positionId, electionId, fullName } = parsed.data;

  const position = await prisma.position.findUnique({
    where: { id: positionId },
    select: { candidateGrade: true },
  });
  if (!position) return;

  await prisma.candidate.create({
    data: {
      positionId,
      electionId,
      fullName,
      gradeLevel: pickCandidateDefaultGrade(position.candidateGrade),
    },
  });
  revalidateElectionCandidates(electionId);
}

export async function removeCandidate(formData: FormData) {
  await requireAdminSession();
  const parsed = safeParseFormData(RemoveCandidateSchema, formData);
  if (!parsed.success) return;
  const { candidateId, electionId } = parsed.data;

  await prisma.candidate.delete({ where: { id: candidateId } });
  revalidateElectionCandidates(electionId);
}

export async function finalizeCandidates(
  _prevState: FinalizeResult | null,
  formData: FormData,
): Promise<FinalizeResult> {
  await requireAdminSession();
  const parsed = safeParseFormData(ElectionIdSchema, formData);
  if (!parsed.success) {
    return { success: false, error: "Missing election." };
  }
  const { electionId } = parsed.data;

  const positions = await prisma.position.findMany({
    where: { electionId, isActive: true },
    include: { _count: { select: { candidates: true } } },
  });

  if (positions.length === 0) {
    return { success: false, error: "Add at least one position before finalizing." };
  }

  const empty = positions.filter((p) => p._count.candidates === 0);
  if (empty.length > 0) {
    const names = empty.map((p) => p.title).join(", ");
    return {
      success: false,
      error: `These positions have no candidates yet: ${names}. Add at least one candidate to each before finalizing.`,
    };
  }

  await prisma.election.update({
    where: { id: electionId },
    data: { candidatesFinalized: true },
  });

  revalidateElectionCandidates(electionId);
  return { success: true };
}

export async function unfinalizeCandidates(
  _prevState: FinalizeResult | null,
  formData: FormData,
): Promise<FinalizeResult> {
  await requireAdminSession();
  const parsed = safeParseFormData(ElectionIdSchema, formData);
  if (!parsed.success) {
    return { success: false, error: "Missing election." };
  }
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
      error: guard.reason.replace("Cannot unlock", "Cannot unlock candidates"),
    };
  }

  await prisma.election.update({
    where: { id: electionId },
    data: { candidatesFinalized: false },
  });

  revalidateElectionCandidates(electionId);
  return { success: true };
}
