import { DIVISION_ORDER } from "@/lib/ui/division-labels";

/**
 * Shared grouping/search toolkit for the voter, candidate, and results admin
 * index pages: each builds a division -> election tree and needs the same
 * "normalize the query", "does this field match", and "division display
 * order" primitives. Previously each `*-index.ts` file redefined these four
 * functions byte-for-byte.
 */

export function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function matches(value: string, query: string): boolean {
  return normalize(value).includes(query);
}

export function divisionRank(division: string): number {
  const index = DIVISION_ORDER.findIndex((value) => value === division);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export function orderDivisions<T>(entries: [string, T][]): [string, T][] {
  return [...entries].sort(
    ([a], [b]) => divisionRank(a) - divisionRank(b) || a.localeCompare(b),
  );
}
