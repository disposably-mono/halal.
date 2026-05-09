import { describe, expect, it } from "vitest";
import { buildVoteMap, computePositionTally } from "@/lib/domain/tally";

describe("buildVoteMap", () => {
  it("maps candidateId → vote count", () => {
    const map = buildVoteMap([
      { candidateId: "c1", _count: { candidateId: 5 } },
      { candidateId: "c2", _count: { candidateId: 3 } },
    ]);
    expect(map.get("c1")).toBe(5);
    expect(map.get("c2")).toBe(3);
  });

  it("filters out null candidateId rows (abstentions)", () => {
    const map = buildVoteMap([
      { candidateId: "c1", _count: { candidateId: 5 } },
      { candidateId: null, _count: { candidateId: 12 } },
    ]);
    expect(map.size).toBe(1);
    expect(map.has("c1")).toBe(true);
  });

  it("returns empty map for empty input", () => {
    expect(buildVoteMap([]).size).toBe(0);
  });
});

describe("computePositionTally", () => {
  const candidates = [
    { id: "c1", fullName: "Alice" },
    { id: "c2", fullName: "Bob" },
    { id: "c3", fullName: "Carol" },
  ];

  it("derives a clear winner", () => {
    const map = new Map([
      ["c1", 10],
      ["c2", 3],
      ["c3", 1],
    ]);
    const result = computePositionTally(candidates, map, 14);
    expect(result.candidates.find((c) => c.id === "c1")?.isWinner).toBe(true);
    expect(result.candidates.find((c) => c.id === "c2")?.isWinner).toBe(false);
    expect(result.candidates.find((c) => c.id === "c3")?.isWinner).toBe(false);
    expect(result.maxVotes).toBe(10);
    expect(result.totalVotesCast).toBe(14);
    expect(result.abstentions).toBe(0);
  });

  it("marks all tied top candidates as winners", () => {
    const map = new Map([
      ["c1", 5],
      ["c2", 5],
      ["c3", 1],
    ]);
    const result = computePositionTally(candidates, map, 11);
    expect(result.candidates.filter((c) => c.isWinner).map((c) => c.id)).toEqual([
      "c1",
      "c2",
    ]);
    expect(result.maxVotes).toBe(5);
  });

  it("does not mark anyone as winner when all candidates have zero votes", () => {
    const map = new Map<string, number>();
    const result = computePositionTally(candidates, map, 7);
    expect(result.candidates.every((c) => c.isWinner === false)).toBe(true);
    expect(result.maxVotes).toBe(0);
    expect(result.abstentions).toBe(7);
  });

  it("treats missing candidateIds in the map as 0 votes", () => {
    const map = new Map([["c1", 4]]);
    const result = computePositionTally(candidates, map, 4);
    expect(result.candidates.find((c) => c.id === "c2")?.votes).toBe(0);
    expect(result.candidates.find((c) => c.id === "c3")?.votes).toBe(0);
  });

  it("computes abstentions as voters-who-voted minus position votes", () => {
    const map = new Map([["c1", 6]]);
    const result = computePositionTally(candidates, map, 10);
    expect(result.totalVotesCast).toBe(6);
    expect(result.abstentions).toBe(4);
  });

  it("clamps abstentions to non-negative when math would underflow", () => {
    // Defensive: if vote rows somehow exceed voter count, don't go negative.
    const map = new Map([["c1", 100]]);
    const result = computePositionTally(candidates, map, 10);
    expect(result.abstentions).toBe(0);
  });

  it("preserves input order and extra candidate fields", () => {
    const richCandidates = [
      { id: "c1", fullName: "Alice", gradeLevel: 11 },
      { id: "c2", fullName: "Bob", gradeLevel: 10 },
    ];
    const result = computePositionTally(richCandidates, new Map([["c1", 1]]), 1);
    expect(result.candidates.map((c) => c.id)).toEqual(["c1", "c2"]);
    expect(result.candidates[0].gradeLevel).toBe(11);
  });

  it("returns empty tally for empty candidate list", () => {
    const result = computePositionTally([], new Map(), 5);
    expect(result.candidates).toEqual([]);
    expect(result.maxVotes).toBe(0);
    expect(result.totalVotesCast).toBe(0);
    expect(result.abstentions).toBe(5);
  });
});
