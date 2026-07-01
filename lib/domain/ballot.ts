import type { Division } from "@prisma/client";
import { DIVISION_POSITIONS, type PositionDefinition } from "@/lib/elections/constants";
import { parseGrades } from "@/lib/domain/grade-format";

export type BallotSelections = Record<string, string | null>;

export type EligibleBallotPosition = {
  id: string;
  candidates: { id: string }[];
};

export type VerifiedVoteData = {
  electionId: string;
  positionId: string;
  candidateId: string | null;
  isAbstain: boolean;
  castAt: Date;
};

export function eligiblePositionsForGrade(division: Division, grade: number): PositionDefinition[] {
  return (DIVISION_POSITIONS[division] ?? []).filter((p) => p.eligibleGrades.includes(grade));
}

export function parseCandidateGrades(raw: string): number[] {
  return parseGrades(raw);
}

export function pickCandidateDefaultGrade(raw: string): number {
  const grades = parseGrades(raw);
  return grades.length === 1 ? grades[0] : 0;
}

export function truncateToHour(date: Date): Date {
  const bucket = new Date(date);
  bucket.setMinutes(0, 0, 0);
  return bucket;
}

export function buildVerifiedVoteData({
  electionId,
  positions,
  selections,
  castAt,
}: {
  electionId: string;
  positions: EligibleBallotPosition[];
  selections: BallotSelections;
  castAt: Date;
}): VerifiedVoteData[] {
  return positions.map((position) => {
    const selectedCandidateId = selections[position.id] ?? null;
    const validCandidateIds = new Set(position.candidates.map((candidate) => candidate.id));
    const candidateId =
      selectedCandidateId && validCandidateIds.has(selectedCandidateId)
        ? selectedCandidateId
        : null;

    return {
      electionId,
      positionId: position.id,
      candidateId,
      isAbstain: candidateId === null,
      castAt,
    };
  });
}
