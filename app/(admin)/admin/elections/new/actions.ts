"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { requireCapability } from "@/lib/server/auth";
import { createAuditKeyMaterial } from "@/lib/domain/ballot-audit";
import {
  INITIAL_CREATE_ELECTION_STATE,
  validateCreateElectionForm,
  type CreateElectionFormState,
} from "./form-state";

export async function createElection(
  _prevState: CreateElectionFormState = INITIAL_CREATE_ELECTION_STATE,
  formData: FormData,
): Promise<CreateElectionFormState> {
  void _prevState;
  await requireCapability("election:lifecycle");

  const parsed = validateCreateElectionForm(formData);
  if (!parsed.success || !parsed.data) return parsed;

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
