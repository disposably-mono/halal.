import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapabilityOrJsonError } from "@/lib/server/auth";
import type { AuditSnapshot } from "@/lib/domain/audit-tally";
import { computePositionTally } from "@/lib/domain/tally";
import { verifyStoredCertification } from "@/lib/server/election-audit";
import { cached, peek } from "@/lib/server/ttl-cache";
import { withSpan } from "@/lib/server/otel";
import {
  computeResultsAggregate,
  buildLivePositions,
} from "@/lib/server/results-aggregate";

export const dynamic = "force-dynamic";

// Short micro-cache for the live tally. The public results page still polls
// every 30s, and the admin monitor issues a read on manual refresh, so a 3s
// window is invisible to users yet collapses a burst of concurrent readers into
// one vote scan (single-flight). This endpoint is READ-ONLY — it never writes a
// snapshot; snapshot history is owned by the server-side write path
// (lib/server/monitor-broadcast.ts), so observing results never mutates the DB.
const RESULTS_CACHE_TTL_MS = 3000;

function unexpectedResultsErrorResponse() {
  return NextResponse.json(
    { error: "Failed to load results." },
    { status: 500 },
  );
}

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { id } = params;
    const isAdminRequest = req.nextUrl.searchParams.get("admin") === "1";

    // Verify admin access if requesting admin (live/embargoed) data
    if (isAdminRequest) {
      const guard = await requireCapabilityOrJsonError("admin:view");
      if (!guard.ok) return guard.response;
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
    const resultsAggCacheKey = `results-agg:${id}`;
    const aggregate = certified
      ? null
      : await withSpan(
          "results.get_aggregate",
          { "election.id": id, "cache.hit": peek(resultsAggCacheKey) },
          () =>
            cached(resultsAggCacheKey, RESULTS_CACHE_TTL_MS, () =>
              computeResultsAggregate(id),
            ),
        );

    // buildLivePositions gates the admin-only abstentions figure: for a public
    // request it leaves the field undefined, so JSON serialisation omits it.
    const livePositionResults = aggregate
      ? buildLivePositions(aggregate, { includeAbstentions: isAdminRequest })
      : [];

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

    // Read-only: no snapshot is written here. Snapshot history is produced by the
    // server on election-state changes (lib/server/monitor-broadcast.ts), so
    // observing results — public or admin — never mutates the database.
    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("[results-route] unexpected error", error);
    return unexpectedResultsErrorResponse();
  }
}
