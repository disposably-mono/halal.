import {
  AUDIT_VERSION,
  stableJson,
  type AuditSelection,
  verifyBallotCommitment,
} from "./ballot-audit";

export type AuditCandidate = { id: string; fullName: string; gradeLevel: number };
export type AuditPosition = {
  id: string;
  title: string;
  order: number;
  candidates: AuditCandidate[];
};
export type AuditedVote = {
  electionId: string;
  positionId: string;
  candidateId: string | null;
  isAbstain: boolean;
};
export type AuditedBallot = {
  id: string;
  nonce: string;
  commitment: string;
  receiptHash: string;
  version: number;
  votes: AuditedVote[];
};

export type AuditSnapshot = {
  version: number;
  electionId: string;
  generatedAt: string;
  turnout: { voted: number; total: number };
  ballots: { total: number; valid: number; invalid: number };
  positions: Array<{
    id: string;
    title: string;
    order: number;
    candidates: Array<AuditCandidate & { votes: number }>;
    abstentions: number;
    totalVotes: number;
  }>;
};

function ballotSelections(ballot: AuditedBallot): AuditSelection[] {
  return ballot.votes.map((vote) => ({
    positionId: vote.positionId,
    candidateId: vote.isAbstain ? null : vote.candidateId,
  }));
}

function validBallot(
  ballot: AuditedBallot,
  electionId: string,
  auditKey: Buffer,
  positions: Map<string, Set<string>>,
): boolean {
  if (ballot.version !== AUDIT_VERSION || ballot.votes.length === 0) return false;
  const seen = new Set<string>();
  for (const vote of ballot.votes) {
    if (seen.has(vote.positionId)) return false;
    if (vote.electionId !== electionId) return false;
    seen.add(vote.positionId);
    const candidateIds = positions.get(vote.positionId);
    if (!candidateIds) return false;
    if (vote.isAbstain !== (vote.candidateId === null)) return false;
    if (vote.candidateId !== null && !candidateIds.has(vote.candidateId)) return false;
  }
  return verifyBallotCommitment(
    ballot.commitment,
    auditKey,
    electionId,
    ballot.nonce,
    ballot.receiptHash,
    ballotSelections(ballot),
  );
}

export function buildAuditSnapshot({
  electionId,
  generatedAt,
  auditKey,
  positions,
  ballots,
  votedCount,
  totalVoters,
}: {
  electionId: string;
  generatedAt: Date;
  auditKey: Buffer;
  positions: AuditPosition[];
  ballots: AuditedBallot[];
  votedCount: number;
  totalVoters: number;
}): AuditSnapshot {
  const candidateIdsByPosition = new Map(
    positions.map((position) => [
      position.id,
      new Set(position.candidates.map((candidate) => candidate.id)),
    ]),
  );
  const valid = ballots.filter((ballot) =>
    validBallot(ballot, electionId, auditKey, candidateIdsByPosition),
  );
  const candidateCounts = new Map<string, number>();
  const abstentionCounts = new Map<string, number>();

  for (const ballot of valid) {
    for (const vote of ballot.votes) {
      if (vote.isAbstain) {
        abstentionCounts.set(vote.positionId, (abstentionCounts.get(vote.positionId) ?? 0) + 1);
      } else if (vote.candidateId) {
        candidateCounts.set(vote.candidateId, (candidateCounts.get(vote.candidateId) ?? 0) + 1);
      }
    }
  }

  return {
    version: AUDIT_VERSION,
    electionId,
    generatedAt: generatedAt.toISOString(),
    turnout: { voted: votedCount, total: totalVoters },
    ballots: {
      total: ballots.length,
      valid: valid.length,
      invalid: ballots.length - valid.length,
    },
    positions: [...positions]
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
      .map((position) => {
        const candidates = [...position.candidates]
          .sort((a, b) => a.id.localeCompare(b.id))
          .map((candidate) => ({
            ...candidate,
            votes: candidateCounts.get(candidate.id) ?? 0,
          }));
        const abstentions = abstentionCounts.get(position.id) ?? 0;
        return {
          id: position.id,
          title: position.title,
          order: position.order,
          candidates,
          abstentions,
          totalVotes: abstentions + candidates.reduce((sum, candidate) => sum + candidate.votes, 0),
        };
      }),
  };
}

function comparable(snapshot: AuditSnapshot) {
  return {
    version: snapshot.version,
    electionId: snapshot.electionId,
    turnout: snapshot.turnout,
    ballots: snapshot.ballots,
    positions: snapshot.positions,
  };
}

export function compareAuditSnapshots(
  official: AuditSnapshot,
  recount: AuditSnapshot,
): string[] {
  const discrepancies: string[] = [];
  if (official.turnout.voted !== recount.turnout.voted) discrepancies.push("Voter turnout changed");
  if (official.turnout.total !== recount.turnout.total) discrepancies.push("Voter roster size changed");
  if (official.ballots.total !== recount.ballots.total) discrepancies.push("Ballot count changed");
  if (recount.ballots.invalid > 0) discrepancies.push(`${recount.ballots.invalid} ballot commitment(s) failed verification`);
  if (stableJson(comparable(official).positions) !== stableJson(comparable(recount).positions)) {
    discrepancies.push("One or more position tallies changed");
  }
  return discrepancies;
}
