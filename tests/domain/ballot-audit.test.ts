import { beforeEach, describe, expect, it } from "vitest";
import {
  canonicalBallot,
  createAuditKeyMaterial,
  createBallotCommitment,
  decryptAuditKey,
  generateReceiptCode,
  hashReceiptCode,
  normalizeReceiptCode,
  signSnapshot,
  verifyBallotCommitment,
  verifySnapshotSignature,
} from "@/lib/domain/ballot-audit";

describe("ballot audit cryptography", () => {
  beforeEach(() => {
    process.env.ELECTION_AUDIT_MASTER_KEY = Buffer.alloc(32, 7).toString("base64");
  });

  it("encrypts election keys and publishes only a fingerprint", () => {
    const material = createAuditKeyMaterial();
    const key = decryptAuditKey(material.encryptedKey);
    expect(key).toHaveLength(32);
    expect(material.encryptedKey).not.toContain(key.toString("hex"));
    expect(material.fingerprint).toMatch(/^[a-f0-9]{64}$/);
  });

  it("canonicalizes selections independently of input order", () => {
    const first = canonicalBallot("e1", "nonce", "receipt", [
      { positionId: "b", candidateId: null },
      { positionId: "a", candidateId: "c1" },
    ]);
    const second = canonicalBallot("e1", "nonce", "receipt", [
      { positionId: "a", candidateId: "c1" },
      { positionId: "b", candidateId: null },
    ]);
    expect(first).toBe(second);
  });

  it("detects changed ballot selections", () => {
    const key = Buffer.alloc(32, 3);
    const selections = [{ positionId: "president", candidateId: "alice" }];
    const commitment = createBallotCommitment(key, "e1", "nonce", "receipt", selections);
    expect(verifyBallotCommitment(commitment, key, "e1", "nonce", "receipt", selections)).toBe(true);
    expect(verifyBallotCommitment(commitment, key, "e1", "nonce", "receipt", [{ positionId: "president", candidateId: "bob" }])).toBe(false);
    expect(verifyBallotCommitment(commitment, key, "e1", "nonce", "other-receipt", selections)).toBe(false);
  });

  it("generates normalized 160-bit receipt codes and hashes equivalent formatting", () => {
    const receipt = generateReceiptCode();
    expect(normalizeReceiptCode(receipt)).toHaveLength(32);
    expect(hashReceiptCode(receipt)).toBe(hashReceiptCode(receipt.toLowerCase().replaceAll("-", " ")));
  });

  it("signs immutable snapshots", () => {
    const key = Buffer.alloc(32, 5);
    const snapshot = { ballots: 4, tally: { a: 3, b: 1 } };
    const signature = signSnapshot(key, snapshot);
    expect(verifySnapshotSignature(key, snapshot, signature)).toBe(true);
    expect(verifySnapshotSignature(key, { ...snapshot, ballots: 5 }, signature)).toBe(false);
  });
});
