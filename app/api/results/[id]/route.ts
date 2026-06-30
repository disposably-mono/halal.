import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapabilityOrError } from "@/lib/server/auth";
import { permissionErrorMessage } from "@/lib/auth/permissions";
import type { AuditSnapshot } from "@/lib/domain/audit-tally";
import { verifyStoredCertification } from "@/lib/server/election-audit";
import { cached } from "@/lib/server/ttl-cache";

export const dynamic = "force-dynamic";

// Short micro-cache for the live tally. Both the public results page and the
// admin monitor poll every 30s, so a 3s window is invisible to users yet
// collapses a burst of concurrent pollers into one vote scan (single-flight).
const RESULTS_CACHE_TTL_MS = 3000;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const isAdminRequest = req.nextUrl.searchParams.get("admin") === "1";

  // Verify admin access if requesting admin (live/embargoed) data
  if (isAdminRequest) {
    const guard = await requireCapabilityOrError("admin:view");
    if (!guard.ok) {
      return NextResponse.json(
        { error: permissionErrorMessage(guard.error) },
        { status: guard.error === "Forbidden" ? 403 : 401 },
      );
    }
  }

  const election = await prisma.election.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      division: true,
      status: true,
      scheduledOpen: true,
      scheduledClose: true,
      archivedAt: true,
      auditFingerprint: true,
      auditVersion: true,
      auditKeyEncrypted: true,
      certification: { select: { snapshot: true, snapshotHash: true, signature: true } },
    },
  });

  if (!election) {
    return NextResponse.json({ error: "Election not found" }, { status: 404 });
  }

  // Archived elections are retired from public results (admins retain access)
  if (!isAdminRequest && election.archivedAt !== null) {
    return NextResponse.json({ error: "Election not found" }, { status: 404 });
  }

  // Public embargo — only return results if CLOSED or admin
  if (!isAdminRequest && election.status !== "CLOSED") {
    return NextResponse.json({
      electionId: id,
      status: election.status,
      name: election.name,
      division: election.division,
      embargoed: true,
      positions: [],
      turnout: null,
      audit: {
        receiptVerificationSupported: election.auditVersion !== null,
        fingerprint: election.auditFingerprint,
        certifiedSnapshotHash: null,
      },
    });
  }

  const certificationValid = !!(
    election.certification &&
    election.auditKeyEncrypted &&
    verifyStoredCertification({
      encryptedKey: election.auditKeyEncrypted,
      snapshot: election.certification.snapshot,
      snapshotHash: election.certification.snapshotHash,
      signature: election.certification.signature,
    })
  );
  if (election.status === "CLOSED" && election.auditVersion !== null && !certificationValid) {
    return NextResponse.json({
      electionId: id,
      status: election.status,
      name: election.name,
      division: election.division,
      embargoed: false,
      integrityFailure: true,
      positions: [],
      turnout: null,
      audit: {
        receiptVerificationSupported: true,
        fingerprint: election.auditFingerprint,
        certifiedSnapshotHash: election.certification?.snapshotHash ?? null,
      },
    });
  }

  const certified =
    election.status === "CLOSED" && election.certification && certificationValid
      ? (election.certification.snapshot as unknown as AuditSnapshot)
      : null;

  // The live tally is the expensive, frequently-polled path. Only compute it
  // when we are NOT serving a certified snapshot, and route it through a
  // single-flight micro-cache so concurrent pollers share one vote scan.
  const aggregate = certified
    ? null
    : await cached(`results-agg:${id}`, RESULTS_CACHE_TTL_MS, () =>
        computeResultsAggregate(id),
      );

  const livePositionResults = (aggregate?.positions ?? []).map((pos) => {
    const abstentions = aggregate!.positionAbstentions.get(pos.id) ?? 0;
    const candidatesWithVotes = pos.candidates.map((c) => ({
      id: c.id,
      fullName: c.fullName,
      gradeLevel: c.gradeLevel,
      votes: aggregate!.candidateVoteCounts.get(c.id) ?? 0,
    }));
    const maxVotes = candidatesWithVotes.reduce((m, c) => Math.max(m, c.votes), 0);
    const tiedTopCount = candidatesWithVotes.filter(
      (c) => c.votes > 0 && c.votes === maxVotes,
    ).length;
    const candidates = candidatesWithVotes.map((c) => ({
      ...c,
      isWinner: c.votes > 0 && c.votes === maxVotes,
      isTie: tiedTopCount > 1 && c.votes === maxVotes,
    }));
    const totalCandidateVotes = candidates.reduce((s, c) => s + c.votes, 0);

    return {
      id: pos.id,
      title: pos.title,
      order: pos.order,
      candidates: candidates.sort((a, b) => b.votes - a.votes),
      abstentions: isAdminRequest ? abstentions : undefined,
      totalVotes: totalCandidateVotes,
    };
  });

  const positionResults = certified
    ? certified.positions.map((position) => {
        const maxVotes = position.candidates.reduce((max, candidate) => Math.max(max, candidate.votes), 0);
        const tiedTopCount = position.candidates.filter((candidate) => candidate.votes > 0 && candidate.votes === maxVotes).length;
        return {
          id: position.id,
          title: position.title,
          order: position.order,
          candidates: position.candidates
            .map((candidate) => ({
              ...candidate,
              isWinner: candidate.votes > 0 && candidate.votes === maxVotes,
              isTie: tiedTopCount > 1 && candidate.votes === maxVotes,
            }))
            .sort((a, b) => b.votes - a.votes),
          abstentions: isAdminRequest ? position.abstentions : undefined,
          totalVotes: position.candidates.reduce((sum, candidate) => sum + candidate.votes, 0),
        };
      })
    : livePositionResults;

  return NextResponse.json({
    electionId: id,
    status: election.status,
    name: election.name,
    division: election.division,
    embargoed: false,
    positions: positionResults,
    turnout: (() => {
      const voted = certified?.turnout.voted ?? aggregate?.votedCount ?? 0;
      const total = certified?.turnout.total ?? aggregate?.totalVoters ?? 0;
      return { voted, total, pct: total > 0 ? Math.round((voted / total) * 100) : 0 };
    })(),
    audit: {
      receiptVerificationSupported: election.auditVersion !== null,
      fingerprint: election.auditFingerprint,
      certifiedSnapshotHash: election.certification?.snapshotHash ?? null,
    },
    integrityFailure: false,
  });
}

/**
 * The expensive live-tally aggregate: positions + candidates, the full vote
 * scan reduced into per-candidate and per-position-abstention counts, and
 * turnout. Kept as a standalone producer so it can be wrapped by the cache and
 * shared across admin and public callers (the per-request view layer decides
 * whether to expose abstentions).
 */
async function computeResultsAggregate(id: string) {
  const positions = await prisma.position.findMany({
    where: { electionId: id, isActive: true },
    include: {
      candidates: {
        select: { id: true, fullName: true, gradeLevel: true },
        orderBy: { fullName: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  const votes = await prisma.vote.findMany({
    where: { electionId: id },
    select: { positionId: true, candidateId: true, isAbstain: true },
  });

  const candidateVoteCounts = new Map<string, number>();
  const positionAbstentions = new Map<string, number>();
  for (const vote of votes) {
    if (vote.isAbstain || !vote.candidateId) {
      positionAbstentions.set(
        vote.positionId,
        (positionAbstentions.get(vote.positionId) ?? 0) + 1,
      );
    } else {
      candidateVoteCounts.set(
        vote.candidateId,
        (candidateVoteCounts.get(vote.candidateId) ?? 0) + 1,
      );
    }
  }

  const totalVoters = await prisma.voter.count({ where: { electionId: id } });
  const votedCount = await prisma.voter.count({
    where: { electionId: id, hasVoted: true },
  });

  return { positions, candidateVoteCounts, positionAbstentions, totalVoters, votedCount };
}
