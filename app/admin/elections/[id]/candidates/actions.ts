"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function seedPositions(electionId: string, division: string) {
  const DIVISION_POSITIONS: Record<string, { title: string; eligibleGrades: number[]; candidateGrade: string }[]> = {
    SHS: [
      { title: "President", eligibleGrades: [], candidateGrade: "11" },
      { title: "Internal Vice-President", eligibleGrades: [], candidateGrade: "11" },
      { title: "External Vice-President", eligibleGrades: [], candidateGrade: "11" },
      { title: "General Secretary", eligibleGrades: [], candidateGrade: "10" },
      { title: "Treasurer", eligibleGrades: [], candidateGrade: "10" },
      { title: "Overall Staff", eligibleGrades: [], candidateGrade: "11" },
      { title: "Public Relations Officer", eligibleGrades: [], candidateGrade: "11" },
      { title: "Art Director", eligibleGrades: [], candidateGrade: "10 or 11" },
      { title: "Social Media Associate", eligibleGrades: [], candidateGrade: "10 or 11" },
    ],
    JHS: [
      { title: "President", eligibleGrades: [], candidateGrade: "9" },
      { title: "Internal Vice-President", eligibleGrades: [], candidateGrade: "9" },
      { title: "External Vice-President", eligibleGrades: [], candidateGrade: "9" },
      { title: "General Secretary", eligibleGrades: [], candidateGrade: "9" },
      { title: "Treasurer", eligibleGrades: [], candidateGrade: "9" },
      { title: "Coordinating Staff", eligibleGrades: [], candidateGrade: "9" },
      { title: "Public Relations Head", eligibleGrades: [], candidateGrade: "9" },
      { title: "Assistant Internal Vice-President", eligibleGrades: [], candidateGrade: "8" },
      { title: "Assistant External Vice-President", eligibleGrades: [], candidateGrade: "8" },
      { title: "Assistant Secretary", eligibleGrades: [], candidateGrade: "8" },
      { title: "Auditor", eligibleGrades: [], candidateGrade: "8" },
      { title: "Coordinating Assistant", eligibleGrades: [], candidateGrade: "8" },
      { title: "CES Officer", eligibleGrades: [], candidateGrade: "7" },
      { title: "Freshman Governor", eligibleGrades: [6], candidateGrade: "6" },
      { title: "Sophomore Governor", eligibleGrades: [7], candidateGrade: "7" },
      { title: "Junior Governor", eligibleGrades: [8], candidateGrade: "8" },
      { title: "Senior Governor", eligibleGrades: [9], candidateGrade: "9" },
      { title: "Art Director", eligibleGrades: [], candidateGrade: "6 to 9" },
      { title: "Social Media Associate", eligibleGrades: [], candidateGrade: "6 to 9" },
    ],
    GS: [
      { title: "President", eligibleGrades: [], candidateGrade: "5" },
      { title: "Vice-President", eligibleGrades: [], candidateGrade: "5" },
      { title: "Secretary", eligibleGrades: [], candidateGrade: "5" },
      { title: "Treasurer", eligibleGrades: [], candidateGrade: "5" },
      { title: "Public Relations Officer 1", eligibleGrades: [], candidateGrade: "5" },
      { title: "Assistant Secretary", eligibleGrades: [], candidateGrade: "4" },
      { title: "Public Relations Officer 2", eligibleGrades: [], candidateGrade: "4" },
      { title: "Public Relations Officer 3", eligibleGrades: [], candidateGrade: "4" },
      { title: "Public Relations Officer 4", eligibleGrades: [], candidateGrade: "3" },
      { title: "Public Relations Officer 5", eligibleGrades: [], candidateGrade: "3" },
    ],
  };

  const positions = DIVISION_POSITIONS[division] ?? [];
  const existing = await prisma.position.findMany({
    where: { electionId },
    select: { title: true },
  });
  const existingTitles = new Set(existing.map((p) => p.title));
  const toCreate = positions.filter((p) => !existingTitles.has(p.title));
  if (toCreate.length === 0) return;

  await prisma.position.createMany({
    data: toCreate.map((p, i) => ({
      electionId,
      title: p.title,
      order: existing.length + i,
      eligibleGrades: p.eligibleGrades,
      candidateGrade: p.candidateGrade,
    })),
  });

  revalidatePath(`/admin/elections/${electionId}/candidates`);
}

export async function addCandidate(formData: FormData) {
  const positionId = formData.get("positionId") as string;
  const electionId = formData.get("electionId") as string;
  const fullName = formData.get("fullName") as string;
  const gradeLevel = formData.get("gradeLevel") as string;
  const section = formData.get("section") as string;

  if (!positionId || !fullName || !gradeLevel || !section) return;

  await prisma.candidate.create({
    data: { positionId, fullName, gradeLevel, section },
  });

  revalidatePath(`/admin/elections/${electionId}/candidates`);
}

export async function removeCandidate(formData: FormData) {
  const candidateId = formData.get("candidateId") as string;
  const electionId = formData.get("electionId") as string;
  if (!candidateId) return;
  await prisma.candidate.delete({ where: { id: candidateId } });
  revalidatePath(`/admin/elections/${electionId}/candidates`);
}
