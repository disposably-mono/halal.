"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

// ─── Update election status (kanban drag-drop) ────────────────────────────────

export async function updateElectionStatus(
  electionId: string,
  status: string
): Promise<void> {
  const session = await auth();
  if (!session) redirect("/admin/login");

  // Guard: only allow moving to SCHEDULED/OPEN if both lists are finalized
  if (status === "SCHEDULED" || status === "OPEN") {
    const election = await prisma.election.findUnique({
      where: { id: electionId },
      select: { candidatesFinalized: true, votersFinalized: true },
    });
    if (!election?.candidatesFinalized || !election?.votersFinalized) {
      throw new Error(
        "Both candidates and voters must be finalized before changing to this status."
      );
    }
  }

  await prisma.election.update({
    where: { id: electionId },
    data: { status: status as any },
  });

  revalidatePath("/admin");
}
