/**
 * The single, server-owned "compute once" primitive for an election tally.
 *
 * Both the read path (`GET /api/results/[id]`) and the write-driven monitor
 * broadcaster (`lib/server/monitor-broadcast.ts`) route through the helpers
 * here so a tally is computed in exactly one place and shaped identically
 * everywhere. Previously the route inlined this and every connected browser's
 * poll triggered its own scan; now a vote commit computes the aggregate once
 * and fans it out.
 *
 * `computeResultsAggregate` deliberately never reads raw `Vote`/`Voter` rows
 * into memory — it pushes the counting down to the database with `groupBy` /
 * `count`, so its cost is independent of how many ballots have been cast.
 */

import { prisma } from "@/lib/prisma";
import { buildVoteMap, computePositionTally } from "@/lib/domain/tally";
import type {
  PositionResult,
  ResultsPayload,
} from "@/app/(admin)/admin/elections/[id]/monitor/_components/monitor-shared";

export interface ResultsAggregate {
  positions: {
    id: string;
    title: string;
    order: number;
    candidates: { id: string; fullName: string; gradeLevel: number }[];
  }[];
  candidateVoteCounts: Map<string, number>;
  positionAbstentions: Map<string, number>;
  totalVoters: number;
  votedCount: number;
}

/**
 * The expensive live-tally aggregate: positions + candidates, the full vote
 * scan reduced (in the database, via `groupBy`) into per-candidate and
 * per-position-abstention counts, and turnout. Four small aggregate queries
 * run in parallel; none of them materialises individual ballots.
 */
export async function computeResultsAggregate(
  id: string,
): Promise<ResultsAggregate> {
  const [positions, voteCounts, abstentionCounts, totalVoters, votedCount] =
    await Promise.all([
      prisma.position.findMany({
        where: { electionId: id, isActive: true },
        include: {
          candidates: {
            select: { id: true, fullName: true, gradeLevel: true },
            orderBy: { fullName: "asc" },
          },
        },
        orderBy: { order: "asc" },
      }),
      prisma.vote.groupBy({
        by: ["candidateId"],
        where: { electionId: id },
        _count: { candidateId: true },
      }),
      // isAbstain is always true iff candidateId is null (enforced at write
      // time — see lib/domain/ballot.ts), so grouping on candidateId: null
      // per position is exactly the abstention count.
      prisma.vote.groupBy({
        by: ["positionId"],
        where: { electionId: id, candidateId: null },
        _count: { _all: true },
      }),
      prisma.voter.count({ where: { electionId: id } }),
      prisma.voter.count({ where: { electionId: id, hasVoted: true } }),
    ]);

  const candidateVoteCounts = buildVoteMap(voteCounts);
  const positionAbstentions = new Map<string, number>(
    abstentionCounts.map((a) => [a.positionId, a._count._all] as [string, number]),
  );

  return {
    positions,
    candidateVoteCounts,
    positionAbstentions,
    totalVoters,
    votedCount,
  };
}

/**
 * Maps a raw aggregate into the wire-shape position results. `includeAbstentions`
 * gates the admin-only abstentions figure exactly as the results route does for
 * public vs. admin callers.
 */
export function buildLivePositions(
  aggregate: ResultsAggregate,
  { includeAbstentions }: { includeAbstentions: boolean },
): PositionResult[] {
  return aggregate.positions.map((pos) => {
    const abstentions = aggregate.positionAbstentions.get(pos.id) ?? 0;
    const totalVotesCast = pos.candidates.reduce(
      (sum, c) => sum + (aggregate.candidateVoteCounts.get(c.id) ?? 0),
      0,
    );
    // Feed the already-known abstentions + votes-cast back in as "voters who
    // voted" so computePositionTally's abstentions math reproduces the exact
    // same abstentions figure — we still get isWinner/isTie from one place.
    const tally = computePositionTally(
      pos.candidates,
      aggregate.candidateVoteCounts,
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
      abstentions: includeAbstentions ? tally.abstentions : (undefined as unknown as number),
      totalVotes: tally.totalVotesCast,
    };
  });
}

/** Turnout summary from an aggregate's voter counts. */
export function buildTurnout(voted: number, total: number) {
  return { voted, total, pct: total > 0 ? Math.round((voted / total) * 100) : 0 };
}

/**
 * The full admin monitor payload — the "server owns state" product. Computed
 * once per election-state change and broadcast to every connected monitor
 * (see `lib/server/monitor-broadcast.ts`). Shape is a superset of the client
 * `ResultsPayload` and matches what `GET /api/results/[id]?admin=1` returns for
 * a live election, so replay snapshots and live frames are interchangeable.
 *
 * Returns `null` if the election no longer exists.
 */
export async function computeAdminMonitorPayload(
  electionId: string,
): Promise<ResultsPayload | null> {
  const election = await prisma.election.findUnique({
    where: { id: electionId },
    select: {
      id: true,
      name: true,
      division: true,
      status: true,
      auditFingerprint: true,
      auditVersion: true,
    },
  });
  if (!election) return null;

  const aggregate = await computeResultsAggregate(electionId);
  const positions = buildLivePositions(aggregate, { includeAbstentions: true });

  const payload = {
    electionId: election.id,
    status: election.status,
    name: election.name,
    division: election.division,
    embargoed: false,
    positions,
    turnout: buildTurnout(aggregate.votedCount, aggregate.totalVoters),
    audit: {
      receiptVerificationSupported: election.auditVersion !== null,
      fingerprint: election.auditFingerprint,
      certifiedSnapshotHash: null,
    },
    integrityFailure: false,
  };

  return payload as unknown as ResultsPayload;
}
