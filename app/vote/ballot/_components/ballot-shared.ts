export interface Candidate {
  id: string;
  fullName: string;
  gradeLevel: number;
}

export interface Position {
  id: string;
  title: string;
  candidateGrade: number | number[];
  candidates: Candidate[];
}

export const TWO_COL_THRESHOLD = 4;
