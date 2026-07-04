import { DIVISION_CODES } from "@/lib/ui/division-labels";

export type DivisionFilterOption = { value: string; label: string };

export function buildDivisionFilterOptions<T extends { division: string; label: string }>(
  index: readonly T[],
): DivisionFilterOption[] {
  return index.map((group) => ({
    value: group.division,
    label: DIVISION_CODES[group.division] ?? group.label,
  }));
}

export function resolveDivisionFilterLabel(
  division: string,
  options: readonly DivisionFilterOption[],
): string {
  if (division === "ALL") return "All divisions";
  return options.find((option) => option.value === division)?.label ?? division;
}
