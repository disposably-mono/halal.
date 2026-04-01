"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DIVISION_POSITIONS } from "../../lib/constants";

// 1. BULK LOAD: Seeds all positions for the division at once.
//    - If a position title already exists with isActive: true → skip (already active).
//    - If a position title exists with isActive: false → re-activate it (update).
//    - If a position title doesn't exist at all → create it.
export async function seedAllPositions(formData: FormData) {
  const electionId = formData.get("electionId") as string;
  const division = formData.get("division") as string;

  if (!electionId || !division) return;

  const allPositions = DIVISION_POSITIONS[division] ?? [];

  const existing = await prisma.position.findMany({
    where: { electionId },
    select: { id: true, title: true, isActive: true },
  });

  const activeByTitle = new Map(
    existing.filter((p) => p.isActive).map((p) => [p.title, p])
  );
  const inactiveByTitle = new Map(
    existing.filter((p) => !p.isActive).map((p) => [p.title, p])
  );

  const activeCount = activeByTitle.size;
  let orderCounter = existing.length;

  for (const p of allPositions) {
    if (activeByTitle.has(p.title)) {
      // Already active — skip entirely
      continue;
    }

    if (inactiveByTitle.has(p.title)) {
      // Was soft-deleted — re-activate
      const record = inactiveByTitle.get(p.title)!;
      await prisma.position.update({
        where: { id: record.id },
        data: { isActive: true },
      });
    } else {
      // Doesn't exist at all — create
      await prisma.position.create({
        data: {
          electionId,
          title: p.title,
          order: orderCounter,
          eligibleGrades: p.eligibleGrades,
          candidateGrade: p.candidateGrade,
          isActive: true,
        },
      });
      orderCounter++;
    }
  }

  revalidatePath(`/admin/elections/${electionId}/candidates`);
}

// 2. ADD SINGLE: Adds one specific position from the dropdown.
//    - If already active → no-op (dropdown should have prevented this, but guard here too).
//    - If inactive (was deleted) → re-activate.
//    - If doesn't exist → create.
export async function addSinglePosition(formData: FormData) {
  const electionId = formData.get("electionId") as string;
  const division = formData.get("division") as string;
  const title = formData.get("title") as string;

  if (!electionId || !division || !title) return;

  const positionTemplate = DIVISION_POSITIONS[division]?.find(
    (p) => p.title === title
  );
  if (!positionTemplate) return;

  const existing = await prisma.position.findFirst({
    where: { electionId, title },
  });

  if (existing) {
    if (existing.isActive) {
      // Already active — do nothing
      return;
    }
    // Was soft-deleted — re-activate
    await prisma.position.update({
      where: { id: existing.id },
      data: { isActive: true },
    });
  } else {
    // Doesn't exist — create
    const activeCount = await prisma.position.count({
      where: { electionId, isActive: true },
    });
    await prisma.position.create({
      data: {
        electionId,
        title: positionTemplate.title,
        order: activeCount,
        eligibleGrades: positionTemplate.eligibleGrades,
        candidateGrade: positionTemplate.candidateGrade,
        isActive: true,
      },
    });
  }

  revalidatePath(`/admin/elections/${electionId}/candidates`);
}

// 3. REMOVE POSITION: Soft-deletes a position (sets isActive: false).
//    The position record and its data are preserved — it can be re-added later.
export async function removePosition(formData: FormData) {
  const positionId = formData.get("positionId") as string;
  const electionId = formData.get("electionId") as string;

  if (!positionId || !electionId) return;

  await prisma.position.update({
    where: { id: positionId },
    data: { isActive: false },
  });

  revalidatePath(`/admin/elections/${electionId}/candidates`);
}

export async function addCandidate(formData: FormData) {
  const positionId = formData.get("positionId") as string;
  const electionId = formData.get("electionId") as string;
  const fullName = formData.get("fullName") as string;
  const gradeLevel = formData.get("gradeLevel") as string;

  if (!positionId || !electionId || !fullName || !gradeLevel) return;

  await prisma.candidate.create({
    data: { positionId, fullName, gradeLevel },
  });

  revalidatePath(`/admin/elections/${electionId}/candidates`);
  redirect(`/admin/elections/${electionId}/candidates`);
}

export async function removeCandidate(formData: FormData) {
  const candidateId = formData.get("candidateId") as string;
  const electionId = formData.get("electionId") as string;
  if (!candidateId) return;
  await prisma.candidate.delete({ where: { id: candidateId } });
  revalidatePath(`/admin/elections/${electionId}/candidates`);
}
