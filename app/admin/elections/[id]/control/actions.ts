"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { ElectionStatus } from "@prisma/client";

type ActionResult = { success: boolean; error?: string };

export async function openElectionNow(electionId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  const election = await prisma.election.findUnique({ where: { id: electionId } });
  if (!election) return { success: false, error: "Election not found" };
  if (election.status === "OPEN") return { success: false, error: "Already open" };
  if (election.status === "CLOSED") return { success: false, error: "Cannot reopen a closed election" };
  if (election.status === "DRAFT") return { success: false, error: "Cannot open a draft election directly — advance to Scheduled first" };

  await prisma.$transaction([
    prisma.election.update({
      where: { id: electionId },
      data: { status: ElectionStatus.OPEN },
    }),
    prisma.auditLog.create({
      data: {
        electionId,
        action: "Manually opened election (override)",
        toStatus: ElectionStatus.OPEN,
        adminEmail: session.user?.email ?? "unknown",
      },
    }),
  ]);

  revalidatePath(`/admin`);
  revalidatePath(`/admin/elections/${electionId}/control`);
  return { success: true };
}

export async function closeElectionNow(electionId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  const election = await prisma.election.findUnique({ where: { id: electionId } });
  if (!election) return { success: false, error: "Election not found" };
  if (election.status !== "OPEN") return { success: false, error: "Election must be Open to close it" };

  await prisma.$transaction([
    prisma.election.update({
      where: { id: electionId },
      data: { status: ElectionStatus.CLOSED },
    }),
    prisma.auditLog.create({
      data: {
        electionId,
        action: "Manually closed election (override)",
        toStatus: ElectionStatus.CLOSED,
        adminEmail: session.user?.email ?? "unknown",
      },
    }),
  ]);

  revalidatePath(`/admin`);
  revalidatePath(`/admin/elections/${electionId}/control`);
  return { success: true };
}

export async function rescheduleElection(
  electionId: string,
  scheduledOpen: string | null,
  scheduledClose: string | null
): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  const election = await prisma.election.findUnique({ where: { id: electionId } });
  if (!election) return { success: false, error: "Election not found" };
  if (election.status === "CLOSED") return { success: false, error: "Cannot reschedule a closed election" };

  const openDate = scheduledOpen ? new Date(scheduledOpen) : null;
  const closeDate = scheduledClose ? new Date(scheduledClose) : null;

  if (openDate && closeDate && openDate >= closeDate) {
    return { success: false, error: "Open time must be before close time" };
  }

  const fmtOpen = openDate?.toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) ?? "—";
  const fmtClose = closeDate?.toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) ?? "—";

  await prisma.$transaction([
    prisma.election.update({
      where: { id: electionId },
      data: {
        scheduledOpen: openDate,
        scheduledClose: closeDate,
        status: openDate ? ElectionStatus.SCHEDULED : ElectionStatus.DRAFT,
      },
    }),
    prisma.auditLog.create({
      data: {
        electionId,
        action: `Schedule overridden: ${fmtOpen} – ${fmtClose}`,
        toStatus: null,
        adminEmail: session.user?.email ?? "unknown",
      },
    }),
  ]);

  revalidatePath(`/admin`);
  revalidatePath(`/admin/elections/${electionId}/control`);
  return { success: true };
}

export async function advanceToScheduled(electionId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  const election = await prisma.election.findUnique({ where: { id: electionId } });
  if (!election) return { success: false, error: "Election not found" };
  if (election.status !== "DRAFT") return { success: false, error: "Only DRAFT elections can be advanced to Scheduled" };
  if (!election.scheduledOpen) return { success: false, error: "Set a scheduled open time first" };

  await prisma.$transaction([
    prisma.election.update({
      where: { id: electionId },
      data: { status: ElectionStatus.SCHEDULED },
    }),
    prisma.auditLog.create({
      data: {
        electionId,
        action: "Advanced to Scheduled",
        toStatus: ElectionStatus.SCHEDULED,
        adminEmail: session.user?.email ?? "unknown",
      },
    }),
  ]);

  revalidatePath(`/admin`);
  revalidatePath(`/admin/elections/${electionId}/control`);
  return { success: true };
}
