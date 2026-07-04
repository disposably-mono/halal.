export function activeFilterCount(flags: readonly boolean[]): number {
  return flags.filter(Boolean).length;
}

export function hasActiveFilters(flags: readonly boolean[]): boolean {
  return flags.some(Boolean);
}
