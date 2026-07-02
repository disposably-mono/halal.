import type { PositionDefinition } from "@/lib/elections/constants";

export function getSeedablePositionDefinitions({
  definitions,
  activeTitles,
}: {
  definitions: readonly PositionDefinition[];
  activeTitles: ReadonlySet<string>;
}): PositionDefinition[] {
  return definitions.filter((definition) => !activeTitles.has(definition.title));
}
