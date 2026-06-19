import { describe, expect, it } from "vitest";
import { buildAuditSnapshot, compareAuditSnapshots } from "@/lib/domain/audit-tally";
import { createBallotCommitment } from "@/lib/domain/ballot-audit";

const positions = [{
  id: "president",
  title: "President",
  order: 1,
  candidates: [
    { id: "alice", fullName: "Alice", gradeLevel: 11 },
    { id: "bob", fullName: "Bob", gradeLevel: 11 },
  ],
}];

function ballot(key: Buffer, candidateId: string | null, commitmentCandidate = candidateId) {
  const nonce = `nonce-${candidateId ?? "abstain"}`;
  return {
    id: nonce,
    nonce,
    version: 1,
    receiptHash: `receipt-${nonce}`,
    commitment: createBallotCommitment(key, "e1", nonce, `receipt-${nonce}`, [{ positionId: "president", candidateId: commitmentCandidate }]),
    votes: [{ electionId: "e1", positionId: "president", candidateId, isAbstain: candidateId === null }],
  };
}

describe("audit tally", () => {
  it("counts only ballots with valid commitments", () => {
    const key = Buffer.alloc(32, 9);
    const snapshot = buildAuditSnapshot({
      electionId: "e1",
      generatedAt: new Date("2026-06-19T00:00:00Z"),
      auditKey: key,
      positions,
      ballots: [ballot(key, "alice"), ballot(key, null), ballot(key, "bob", "alice")],
      votedCount: 3,
      totalVoters: 10,
    });
    expect(snapshot.ballots).toEqual({ total: 3, valid: 2, invalid: 1 });
    expect(snapshot.positions[0].candidates.find((candidate) => candidate.id === "alice")?.votes).toBe(1);
    expect(snapshot.positions[0].abstentions).toBe(1);
  });

  it("reports tally discrepancies against the official snapshot", () => {
    const key = Buffer.alloc(32, 9);
    const common = { electionId: "e1", auditKey: key, positions, votedCount: 1, totalVoters: 10 };
    const official = buildAuditSnapshot({ ...common, generatedAt: new Date(0), ballots: [ballot(key, "alice")] });
    const recount = buildAuditSnapshot({ ...common, generatedAt: new Date(1), ballots: [ballot(key, "bob")] });
    expect(compareAuditSnapshots(official, recount)).toContain("One or more position tallies changed");
  });

  it("matches snapshots after JSONB-style object key reordering", () => {
    const key = Buffer.alloc(32, 9);
    const official = buildAuditSnapshot({
      electionId: "e1",
      generatedAt: new Date(0),
      auditKey: key,
      positions,
      ballots: [ballot(key, "alice")],
      votedCount: 1,
      totalVoters: 10,
    });
    const roundTripped = {
      ...official,
      positions: official.positions.map((position) => ({
        totalVotes: position.totalVotes,
        order: position.order,
        title: position.title,
        id: position.id,
        abstentions: position.abstentions,
        candidates: position.candidates.map((candidate) => ({
          votes: candidate.votes,
          gradeLevel: candidate.gradeLevel,
          fullName: candidate.fullName,
          id: candidate.id,
        })),
      })),
    };
    expect(compareAuditSnapshots(roundTripped, official)).toEqual([]);
  });
});
