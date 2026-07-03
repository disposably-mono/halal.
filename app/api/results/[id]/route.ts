import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapabilityOrError } from "@/lib/server/auth";
import { permissionErrorMessage } from "@/lib/auth/permissions";
import type { AuditSnapshot } from "@/lib/domain/audit-tally";
import { computePositionTally } from "@/lib/domain/tally";
import { verifyStoredCertification } from "@/lib/server/election-audit";
import { cached } from "@/lib/server/ttl-cache";
import { recordSnapshot } from "@/lib/server/monitor-snapshots";
import type { ResultsPayload } from "@/app/(admin)/admin/elections/[id]/monitor/_components/monitor-shared";

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
    const totalVotesCast = pos.candidates.reduce(
      (sum, c) => sum + (aggregate!.candidateVoteCounts.get(c.id) ?? 0),
      0,
    );
    // Feed the already-known abstentions + votes-cast back in as "voters who
    // voted" so computePositionTally's abstentions math reproduces the exact
    // same abstentions figure — we still get isWinner/isTie from one place.
    const tally = computePositionTally(
      pos.candidates,
      aggregate!.candidateVoteCounts,
      abstentions + totalVotesCast,
    );

    const candidates = tally.candidates
      .map((c) => ({
        id: c.id,
        fullName: c.fullName,
        // Position candidates are always selected with gradeLevel, so this is
        // never actually undefined — CandidateInput just allows it to be
        // optional for callers (like the PDF route) that don't have it.
        gradeLevel: c.gradeLevel!,
        votes: c.votes,
        isWinner: c.isWinner,
        isTie: c.isTie,
      }))
      .sort((a, b) => b.votes - a.votes);

    return {
      id: pos.id,
      title: pos.title,
      order: pos.order,
      candidates,
      abstentions: isAdminRequest ? tally.abstentions : undefined,
      totalVotes: tally.totalVotesCast,
    };
  });

  const positionResults = certified
    ? certified.positions.map((position) => {
        const voteMap = new Map(position.candidates.map((c) => [c.id, c.votes] as [string, number]));
        const totalVotesCast = position.candidates.reduce((sum, c) => sum + c.votes, 0);
        // Same reconstruction trick as the live branch above: the certified
        // snapshot's abstentions figure is authoritative, so we feed it back
        // in to keep computePositionTally's output consistent with it while
        // still sourcing isWinner/isTie from the shared module.
        const tally = computePositionTally(
          position.candidates,
          voteMap,
          position.abstentions + totalVotesCast,
        );
        return {
          id: position.id,
          title: position.title,
          order: position.order,
          candidates: tally.candidates
            .map((c) => ({
              id: c.id,
              fullName: c.fullName,
              gradeLevel: c.gradeLevel!,
              votes: c.votes,
              isWinner: c.isWinner,
              isTie: c.isTie,
            }))
            .sort((a, b) => b.votes - a.votes),
          abstentions: isAdminRequest ? position.abstentions : undefined,
          totalVotes: totalVotesCast,
        };
      })
    : livePositionResults;

  const responsePayload = {
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
  };

  // Persist the live monitor tally so the admin replay timeline survives a
  // refresh and is identical across devices. Only for admin requests against
  // a live, OPEN election — never for public responses, embargoed responses,
  // or CLOSED/certified snapshots (those aren't the "live tally" this powers).
  // `recordSnapshot` never throws; a failed write must not break this response.
  // `abstentions` is only `number | undefined` in the response's inferred
  // type because the public branch omits it — under `isAdminRequest` it is
  // always populated (see `livePositionResults`/`certified` mapping above),
  // so the cast to `ResultsPayload` (which requires `abstentions: number`) is
  // safe here.
  if (isAdminRequest && election.status === "OPEN") {
    await recordSnapshot(id, responsePayload as unknown as ResultsPayload);
  }

  return NextResponse.json(responsePayload);
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
