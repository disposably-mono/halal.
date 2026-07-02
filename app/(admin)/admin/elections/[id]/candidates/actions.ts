"use server";

import { prisma } from "@/lib/prisma";
import { DIVISION_POSITIONS } from "@/lib/elections/constants";
import { pickCandidateDefaultGrade } from "@/lib/domain/ballot";
import {
  canEditCandidateRoster,
  canFinalizeUnlock,
} from "@/lib/domain/election-state";
import { requireCapability } from "@/lib/server/auth";
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
import { getSeedablePositionDefinitions } from "./position-seeding";

export type FinalizeResult = {
  success: boolean;
  error?: string;
};

export async function seedAllPositions(formData: FormData) {
  await requireCapability("candidates:manage");
  const parsed = safeParseFormData(SeedPositionsSchema, formData);
  if (!parsed.success) return;
  const { electionId } = parsed.data;
  const election = await prisma.election.findUnique({
    where: { id: electionId },
    select: { division: true, status: true, candidatesFinalized: true },
  });
  if (!election) return;
  if (!canEditCandidateRoster(election.status, election.candidatesFinalized).ok) return;

  const definitions = DIVISION_POSITIONS[election.division] ?? [];
  const activePositions = await prisma.position.findMany({
    where: { electionId, isActive: true },
    select: { title: true },
  });
  const positions = getSeedablePositionDefinitions({
    definitions,
    activeTitles: new Set(activePositions.map((position) => position.title)),
  });
  if (positions.length === 0) return;

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
  await requireCapability("candidates:manage");
  const parsed = safeParseFormData(AddSinglePositionSchema, formData);
  if (!parsed.success) return;
  const { electionId, title } = parsed.data;

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    select: { division: true, status: true, candidatesFinalized: true },
  });
  if (!election) return;
  if (!canEditCandidateRoster(election.status, election.candidatesFinalized).ok) return;

  const positionDef = (DIVISION_POSITIONS[election.division] ?? []).find((p) => p.title === title);
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
  await requireCapability("candidates:manage");
  const parsed = safeParseFormData(RemovePositionSchema, formData);
  if (!parsed.success) return;
  const { positionId, electionId } = parsed.data;

  const position = await prisma.position.findUnique({
    where: { id: positionId },
    select: {
      electionId: true,
      election: { select: { status: true, candidatesFinalized: true } },
    },
  });
  if (!position || position.electionId !== electionId) return;
  if (!canEditCandidateRoster(position.election.status, position.election.candidatesFinalized).ok) return;

  await prisma.position.update({
    where: { id: positionId },
    data: { isActive: false },
  });
  revalidateElectionCandidates(electionId);
}

export async function addCandidate(formData: FormData) {
  await requireCapability("candidates:manage");
  const parsed = safeParseFormData(AddCandidateSchema, formData);
  if (!parsed.success) return;
  const { positionId, electionId, fullName } = parsed.data;

  const position = await prisma.position.findUnique({
    where: { id: positionId },
    select: {
      candidateGrade: true,
      electionId: true,
      election: { select: { status: true, candidatesFinalized: true } },
    },
  });
  if (!position) return;

  // Trust the position's own election, never the caller-supplied electionId. A
  // mismatch means a crafted/stale request trying to plant a Candidate row whose
  // positionId and electionId span two elections — which would contaminate the
  // ballots and tallies of both. Reject it outright.
  if (position.electionId !== electionId) return;
  if (!canEditCandidateRoster(position.election.status, position.election.candidatesFinalized).ok) return;

  await prisma.candidate.create({
    data: {
      positionId,
      electionId: position.electionId,
      fullName,
      gradeLevel: pickCandidateDefaultGrade(position.candidateGrade),
    },
  });
  revalidateElectionCandidates(position.electionId);
}

export async function removeCandidate(formData: FormData) {
  await requireCapability("candidates:manage");
  const parsed = safeParseFormData(RemoveCandidateSchema, formData);
  if (!parsed.success) return;
  const { candidateId, electionId } = parsed.data;

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: {
      electionId: true,
      election: { select: { status: true, candidatesFinalized: true } },
    },
  });
  if (!candidate || candidate.electionId !== electionId) return;
  if (!canEditCandidateRoster(candidate.election.status, candidate.election.candidatesFinalized).ok) return;

  // Schema-level Restrict would reject this delete with an opaque FK error once
  // any vote references the candidate. Pre-checking lets the form action no-op
  // gracefully — the candidate stays visible, signalling that the delete didn't take.
  const voteCount = await prisma.vote.count({ where: { candidateId } });
  if (voteCount > 0) {
    revalidateElectionCandidates(candidate.electionId);
    return;
  }

  await prisma.candidate.delete({ where: { id: candidateId } });
  revalidateElectionCandidates(candidate.electionId);
}

export async function finalizeCandidates(
  _prevState: FinalizeResult | null,
  formData: FormData,
): Promise<FinalizeResult> {
  await requireCapability("candidates:manage");
  const parsed = safeParseFormData(ElectionIdSchema, formData);
  if (!parsed.success) {
    return { success: false, error: "Missing election." };
  }
  const { electionId } = parsed.data;

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    select: { status: true, candidatesFinalized: true },
  });
  if (!election) return { success: false, error: "Election not found." };
  const editGuard = canEditCandidateRoster(election.status, election.candidatesFinalized);
  if (!editGuard.ok) return { success: false, error: editGuard.reason };

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
  await requireCapability("candidates:manage");
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
