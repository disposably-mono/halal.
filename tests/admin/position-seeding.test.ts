import { describe, expect, test } from "vitest";
import { getSeedablePositionDefinitions } from "@/app/(admin)/admin/elections/[id]/candidates/position-seeding";
import type { PositionDefinition } from "@/lib/elections/constants";

const definitions: PositionDefinition[] = [
  { title: "President", eligibleGrades: [11], candidateGrade: "11" },
  { title: "Vice-President", eligibleGrades: [11], candidateGrade: "11" },
];

describe("position seeding", () => {
  test("seeds definitions when there are no active position titles", () => {
    expect(getSeedablePositionDefinitions({
      definitions,
      activeTitles: new Set(),
    })).toEqual(definitions);
  });

  test("only skips definitions that are already active", () => {
    expect(getSeedablePositionDefinitions({
      definitions,
      activeTitles: new Set(["President"]),
    })).toEqual([definitions[1]]);
  });
});
