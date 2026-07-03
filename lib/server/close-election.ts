import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashSnapshot, signSnapshot } from "@/lib/domain/ballot-audit";
import { loadAuditSnapshot } from "@/lib/server/election-audit";

export async function closeElectionWithCertification(
  electionId: string,
  actor: string,
  allowedStatuses: Array<"OPEN" | "SCHEDULED"> = ["OPEN"],
  auditActionOverride?: string,
): Promise<{ legacy: boolean }> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Election" WHERE "id" = ${electionId} FOR UPDATE`;
    const election = await tx.election.findUnique({
      where: { id: electionId },
      select: { id: true, status: true, auditKeyEncrypted: true, auditVersion: true },
    });
    if (!election) throw new Error("Election not found");
    if (!allowedStatuses.includes(election.status as "OPEN" | "SCHEDULED")) {
      throw new Error("Only an active election can be closed");
    }

    const legacy = !election.auditKeyEncrypted || !election.auditVersion;
    const now = new Date();
    if (!legacy) {
      const { snapshot, auditKey } = await loadAuditSnapshot(
        tx,
        { id: election.id, auditKeyEncrypted: election.auditKeyEncrypted! },
        now,
      );
      if (snapshot.ballots.invalid > 0 || snapshot.ballots.total !== snapshot.turnout.voted) {
        throw new Error(
          "Election integrity checks failed. Resolve the ballot or turnout discrepancy before closing.",
        );
      }
      await tx.electionCertification.create({
        data: {
          electionId,
          snapshot: snapshot as unknown as Prisma.InputJsonValue,
          snapshotHash: hashSnapshot(snapshot),
          signature: signSnapshot(auditKey, snapshot),
          createdAt: now,
          createdBy: actor,
        },
      });
    }

    await tx.election.update({ where: { id: electionId }, data: { status: "CLOSED" } });
    await tx.auditLog.create({
      data: {
        electionId,
        action:
          auditActionOverride ??
          (legacy
            ? "Closed legacy election without certification"
            : "Closed election and froze official certified tally"),
        toStatus: "CLOSED",
        adminEmail: actor,
      },
    });
    return { legacy };
  });
}
