export interface VoterAssignment {
  voterCode: string;
  studentId: string;
  gradeLevel: number;
  section: string;
}

/**
 * Build a tab-separated assignment table (with header row) for clipboard copy.
 * TSV pastes cleanly into Google Sheets / Excel as discrete columns.
 */
export function buildAssignmentsTsv(
  voters: readonly VoterAssignment[],
): string {
  const header = ["Control Number", "Student ID", "Grade", "Section"].join("\t");
  const rows = voters.map((v) =>
    [v.voterCode, v.studentId, String(v.gradeLevel), v.section].join("\t"),
  );
  return [header, ...rows].join("\n");
}
