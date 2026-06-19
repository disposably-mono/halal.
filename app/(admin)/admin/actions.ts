"use server";

import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/server/auth";
import { revalidateAdminDashboard } from "@/lib/server/revalidate";
import { ElectionStatusSchema } from "@/lib/validation/schemas";

export async function updateElectionStatus(
  electionId: string,
  status: string,
): Promise<void> {
  const parsed = ElectionStatusSchema.safeParse(status);
  if (!parsed.success) {
    throw new Error(`Invalid election status: ${status}`);
  }
  const nextStatus = parsed.data;

  // Closing an election is the Canvassing Head's domain; all other transitions
  // belong to the Commissioner (election lifecycle).
  await requireCapability(
    nextStatus === "CLOSED" ? "election:close" : "election:lifecycle",
  );

  if (nextStatus === "SCHEDULED" || nextStatus === "OPEN") {
    const election = await prisma.election.findUnique({
      where: { id: electionId },
      select: { candidatesFinalized: true, votersFinalized: true },
    });
    if (!election?.candidatesFinalized || !election?.votersFinalized) {
      throw new Error(
        "Both candidates and voters must be finalized before changing to this status.",
      );
    }
  }

  await prisma.election.update({
    where: { id: electionId },
    data: { status: nextStatus },
  });

  revalidateAdminDashboard();
}
