import type { Prisma } from "@prisma/client";
import { buildAuditSnapshot, type AuditSnapshot } from "@/lib/domain/audit-tally";
import {
  decryptAuditKey,
  hashSnapshot,
  verifySnapshotSignature,
} from "@/lib/domain/ballot-audit";

export async function loadAuditSnapshot(
  tx: Prisma.TransactionClient,
  election: { id: string; auditKeyEncrypted: string },
  generatedAt: Date,
): Promise<{ snapshot: AuditSnapshot; auditKey: Buffer }> {
  const [positions, ballots, totalVoters, votedCount] = await Promise.all([
    tx.position.findMany({
      where: { electionId: election.id, isActive: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        order: true,
        candidates: { select: { id: true, fullName: true, gradeLevel: true } },
      },
    }),
    tx.ballot.findMany({
      where: { electionId: election.id },
      select: {
        id: true,
        nonce: true,
        commitment: true,
        receiptHash: true,
        version: true,
        votes: { select: { electionId: true, positionId: true, candidateId: true, isAbstain: true } },
      },
    }),
    tx.voter.count({ where: { electionId: election.id } }),
    tx.voter.count({ where: { electionId: election.id, hasVoted: true } }),
  ]);
  const auditKey = decryptAuditKey(election.auditKeyEncrypted);
  return {
    auditKey,
    snapshot: buildAuditSnapshot({
      electionId: election.id,
      generatedAt,
      auditKey,
      positions,
      ballots,
      votedCount,
      totalVoters,
    }),
  };
}

export function verifyStoredCertification({
  encryptedKey,
  snapshot,
  snapshotHash,
  signature,
}: {
  encryptedKey: string;
  snapshot: unknown;
  snapshotHash: string;
  signature: string;
}): boolean {
  try {
    const auditKey = decryptAuditKey(encryptedKey);
    return hashSnapshot(snapshot) === snapshotHash && verifySnapshotSignature(auditKey, snapshot, signature);
  } catch {
    return false;
  }
}
