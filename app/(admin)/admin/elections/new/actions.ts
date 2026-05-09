"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/server/auth";
import { CreateElectionSchema, safeParseFormData } from "@/lib/validation/schemas";

export async function createElection(formData: FormData) {
  await requireAdminSession();

  const parsed = safeParseFormData(CreateElectionSchema, formData);
  if (!parsed.success) return;

  const { name, division, scheduledOpen, scheduledClose } = parsed.data;

  const election = await prisma.election.create({
    data: {
      name,
      division,
      status: "DRAFT",
      scheduledOpen: scheduledOpen ? new Date(scheduledOpen) : null,
      scheduledClose: scheduledClose ? new Date(scheduledClose) : null,
    },
  });

  redirect(`/admin/elections/${election.id}/candidates`);
}
