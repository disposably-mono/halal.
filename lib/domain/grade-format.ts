// Single source of truth for parsing and displaying a position's grade
// restriction. `candidateGrade` is a free-form string in the data (e.g. "11",
// "10 or 11", "6 to 9"); voter `eligibleGrades` is a number[]. Both flow through
// here so admin and public render identically.

/**
 * Parse a grade string into a sorted, de-duplicated list of grade numbers.
 * Tolerant of every separator present in the data: commas, "or", "and", "&",
 * and ranges ("6 to 9", "6-9", "6–9"). Empty / "0" / "all" mean "no restriction"
 * and return [].
 */
export function parseGrades(raw: string): number[] {
  if (!raw) return [];
  const s = raw.trim().toLowerCase();
  if (s === "" || s === "0" || s === "all") return [];

  const tokens = s.split(/\s*(?:,|\bor\b|\band\b|&)\s*/).filter(Boolean);
  const grades = new Set<number>();

  for (const token of tokens) {
    const range = token.match(/^(\d+)\s*(?:to|-|–)\s*(\d+)$/);
    if (range) {
      const a = parseInt(range[1], 10);
      const b = parseInt(range[2], 10);
      if (!Number.isNaN(a) && !Number.isNaN(b)) {
        const [lo, hi] = a <= b ? [a, b] : [b, a];
        for (let g = lo; g <= hi; g++) grades.add(g);
      }
      continue;
    }
    const n = parseInt(token, 10);
    if (!Number.isNaN(n)) grades.add(n);
  }

  return Array.from(grades).sort((x, y) => x - y);
}

function sameSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const bs = new Set(b);
  return a.every((n) => bs.has(n));
}

/**
 * Human label for a grade list. Empty, or set-equal to `fullRange`, renders as
 * "All grades" (the "not locked to a level" case). A single grade is "Grade N",
 * a contiguous span is "Grades N–M", and gaps become "Grades a, b".
 */
export function formatGradeList(grades: number[], fullRange?: number[]): string {
  const sorted = Array.from(new Set(grades)).sort((x, y) => x - y);
  if (sorted.length === 0) return "All grades";
  if (fullRange && sameSet(sorted, fullRange)) return "All grades";
  if (sorted.length === 1) return `Grade ${sorted[0]}`;

  const contiguous = sorted.every((g, i) => i === 0 || g === sorted[i - 1] + 1);
  if (contiguous) return `Grades ${sorted[0]}–${sorted[sorted.length - 1]}`;
  return `Grades ${sorted.join(", ")}`;
}
