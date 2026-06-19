"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { requireCapability } from "@/lib/server/auth";
import { CreateElectionSchema, safeParseFormData } from "@/lib/validation/schemas";
import { createAuditKeyMaterial } from "@/lib/domain/ballot-audit";

export async function createElection(formData: FormData) {
  await requireCapability("election:lifecycle");

  const parsed = safeParseFormData(CreateElectionSchema, formData);
  if (!parsed.success) return;

  const { name, division, scheduledOpen, scheduledClose } = parsed.data;
  const audit = createAuditKeyMaterial();

  const election = await prisma.election.create({
    data: {
      name,
      division,
      status: "DRAFT",
      scheduledOpen: scheduledOpen ? new Date(scheduledOpen) : null,
      scheduledClose: scheduledClose ? new Date(scheduledClose) : null,
      auditKeyEncrypted: audit.encryptedKey,
      auditFingerprint: audit.fingerprint,
      auditVersion: audit.version,
    },
  });

  redirect(`/admin/elections/${election.id}/candidates`);
}
