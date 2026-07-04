export interface CandidateInput {
  id: string;
  fullName: string;
  gradeLevel?: number;
}

export interface CandidateWithVotes extends CandidateInput {
  votes: number;
}

export interface CandidateResult extends CandidateWithVotes {
  isWinner: boolean;
  isTie: boolean;
}

export interface PositionTally {
  candidates: CandidateResult[];
  abstentions: number;
  totalVotesCast: number;
  maxVotes: number;
}

/**
 * Shared turnout-percentage formula: rounded percent of `voted` out of
 * `total`, or 0 when there's no electorate to divide by. Single source of
 * truth for every admin/public surface that renders a turnout percentage.
 */
export function calcTurnoutPercent(voted: number, total: number): number {
  return total > 0 ? Math.round((voted / total) * 100) : 0;
}

export function buildVoteMap(
  voteCounts: ReadonlyArray<{ candidateId: string | null; _count: { candidateId: number } }>,
): Map<string, number> {
  return new Map(
    voteCounts
      .filter((v): v is typeof v & { candidateId: string } => v.candidateId !== null)
      .map((v) => [v.candidateId, v._count.candidateId] as [string, number]),
  );
}

export function computePositionTally(
  candidates: ReadonlyArray<CandidateInput>,
  voteMap: ReadonlyMap<string, number>,
  totalVotersWhoVoted: number,
): PositionTally {
  const withVotes: CandidateWithVotes[] = candidates.map((c) => ({
    ...c,
    votes: voteMap.get(c.id) ?? 0,
  }));

  const maxVotes = withVotes.reduce((m, c) => Math.max(m, c.votes), 0);
  const totalVotesCast = withVotes.reduce((s, c) => s + c.votes, 0);
  const abstentions = Math.max(0, totalVotersWhoVoted - totalVotesCast);
  const tiedTopCount = withVotes.filter((c) => c.votes > 0 && c.votes === maxVotes).length;

  const result: CandidateResult[] = withVotes.map((c) => ({
    ...c,
    isWinner: c.votes > 0 && c.votes === maxVotes,
    isTie: tiedTopCount > 1 && c.votes === maxVotes,
  }));

  return { candidates: result, abstentions, totalVotesCast, maxVotes };
}
