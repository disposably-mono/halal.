"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { DIVISION_POSITIONS } from "../../lib/constants";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireSession() {
  const session = await auth();
  if (!session) redirect("/admin/login");
}

function revalidate(electionId: string) {
  revalidatePath(`/admin/elections/${electionId}/candidates`);
}

// ─── Seed all positions ───────────────────────────────────────────────────────

export async function seedAllPositions(formData: FormData) {
  await requireSession();
  const electionId = formData.get("electionId") as string;
  const division = formData.get("division") as string;
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
      })
    )
  );
  revalidate(electionId);
}

// ─── Add single position ──────────────────────────────────────────────────────

export async function addSinglePosition(formData: FormData) {
  await requireSession();
  const electionId = formData.get("electionId") as string; // ✓ was incorrectly `params.id`
  const division = formData.get("division") as string;
  const title = formData.get("title") as string;

  const positionDef = (DIVISION_POSITIONS[division] ?? []).find(
    (p) => p.title === title
  );
  if (!positionDef) return;

  const last = await prisma.position.findFirst({
    where: { electionId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.position.create({
    data: {
      electionId, // ✓ fixed
      title: positionDef.title,
      candidateGrade: positionDef.candidateGrade,
      eligibleGrades: positionDef.eligibleGrades,
      order: (last?.order ?? -1) + 1,
      isActive: true,
    },
  });
  revalidate(electionId);
}

// ─── Remove position ──────────────────────────────────────────────────────────

export async function removePosition(formData: FormData) {
  await requireSession();
  const positionId = formData.get("positionId") as string;
  const electionId = formData.get("electionId") as string;

  await prisma.position.update({
    where: { id: positionId },
    data: { isActive: false },
  });
  revalidate(electionId);
}

// ─── Add candidate ────────────────────────────────────────────────────────────

export async function addCandidate(formData: FormData) {
  await requireSession();
  const positionId = formData.get("positionId") as string;
  const electionId = formData.get("electionId") as string;
  const fullName = (formData.get("fullName") as string).trim();
  if (!fullName) return;

  const position = await prisma.position.findUnique({
    where: { id: positionId },
    select: { candidateGrade: true },
  });
  if (!position) return;

  const grades = position.candidateGrade
    .split(",")
    .map((g) => parseInt(g.trim(), 10))
    .filter((n) => !isNaN(n));
  const gradeLevel = grades.length === 1 ? grades[0] : 0;

  await prisma.candidate.create({
    data: { positionId, electionId, fullName, gradeLevel },
  });
  revalidate(electionId);
}

// ─── Remove candidate ─────────────────────────────────────────────────────────

export async function removeCandidate(formData: FormData) {
  await requireSession();
  const candidateId = formData.get("candidateId") as string;
  const electionId = formData.get("electionId") as string;

  await prisma.candidate.delete({ where: { id: candidateId } });
  revalidate(electionId);
}

// ─── Finalize candidates ──────────────────────────────────────────────────────

export async function finalizeCandidates(formData: FormData) {
  await requireSession();
  const electionId = formData.get("electionId") as string;

  const positions = await prisma.position.findMany({
    where: { electionId, isActive: true },
    include: { _count: { select: { candidates: true } } },
  });

  if (positions.length === 0) {
    throw new Error("Add at least one position before finalizing.");
  }

  const empty = positions.filter((p) => p._count.candidates === 0);
  if (empty.length > 0) {
    const names = empty.map((p) => p.title).join(", ");
    throw new Error(
      `The following positions have no candidates: ${names}. Add at least one candidate to each before finalizing.`
    );
  }

  await prisma.election.update({
    where: { id: electionId },
    data: { candidatesFinalized: true },
  });
  revalidate(electionId);
}

// ─── Unfinalize candidates ────────────────────────────────────────────────────

export async function unfinalizeCandidates(formData: FormData) {
  await requireSession();
  const electionId = formData.get("electionId") as string;

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    select: { status: true },
  });
  if (election?.status === "OPEN" || election?.status === "CLOSED") return;

  await prisma.election.update({
    where: { id: electionId },
    data: { candidatesFinalized: false },
  });
  revalidate(electionId);
}

