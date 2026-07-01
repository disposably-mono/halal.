export interface Candidate {
  id: string;
  fullName: string;
  gradeLevel: number;
}

export interface Position {
  id: string;
  title: string;
  candidateGradeLabel: string;
  voterLockLabel: string | null;
  candidates: Candidate[];
}

export const TWO_COL_THRESHOLD = 4;
