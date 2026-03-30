"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createElection(formData: FormData) {
  const name = formData.get("name") as string;
  const division = formData.get("division") as string;
  const scheduledOpen = formData.get("scheduledOpen") as string;
  const scheduledClose = formData.get("scheduledClose") as string;

  if (!name || !division) return;

  const election = await prisma.election.create({
    data: {
      name,
      division: division as "GS" | "JHS" | "SHS",
      status: "DRAFT",
      scheduledOpen: scheduledOpen ? new Date(scheduledOpen) : null,
      scheduledClose: scheduledClose ? new Date(scheduledClose) : null,
    },
  });

  redirect(`/admin/elections/${election.id}/candidates`);
}
