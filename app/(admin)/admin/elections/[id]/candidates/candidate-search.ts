export type CandidateSearchRow = {
  id: string;
  fullName: string;
  gradeLevel: number;
};

export type CandidatePositionSearchRow = {
  id: string;
  title: string;
  candidateGrade: string;
  eligibleGrades: number[];
  candidates: CandidateSearchRow[];
};

export function filterCandidatePositions<T extends CandidatePositionSearchRow>(
  positions: readonly T[],
  query: string,
): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [...positions];

  return positions.flatMap((position) => {
    if (position.title.toLowerCase().includes(normalizedQuery)) {
      return [position];
    }

    const candidates = position.candidates.filter((candidate) =>
      candidate.fullName.toLowerCase().includes(normalizedQuery) ||
      String(candidate.gradeLevel).includes(normalizedQuery),
    );
    if (candidates.length === 0) return [];
    return [{ ...position, candidates }];
  });
}
