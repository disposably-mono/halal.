import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export const AUDIT_VERSION = 1;
const RECEIPT_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export type AuditSelection = {
  positionId: string;
  candidateId: string | null;
};

export type AuditKeyMaterial = {
  encryptedKey: string;
  fingerprint: string;
  version: number;
};

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function masterKey(): Buffer {
  const encoded = process.env.ELECTION_AUDIT_MASTER_KEY;
  if (!encoded) throw new Error("ELECTION_AUDIT_MASTER_KEY is not set");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) {
    throw new Error("ELECTION_AUDIT_MASTER_KEY must be a base64-encoded 32-byte key");
  }
  return key;
}

export function encryptAuditKey(key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", masterKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(key), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ciphertext.toString("base64url")].join(":");
}

export function decryptAuditKey(payload: string): Buffer {
  const [version, ivRaw, tagRaw, ciphertextRaw] = payload.split(":");
  if (version !== "v1" || !ivRaw || !tagRaw || !ciphertextRaw) {
    throw new Error("Unsupported encrypted election audit key");
  }
  const decipher = createDecipheriv("aes-256-gcm", masterKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextRaw, "base64url")),
    decipher.final(),
  ]);
}

export function createAuditKeyMaterial(): AuditKeyMaterial {
  const key = randomBytes(32);
  return {
    encryptedKey: encryptAuditKey(key),
    fingerprint: sha256(key),
    version: AUDIT_VERSION,
  };
}

export function formatFingerprint(value: string): string {
  return value.toUpperCase().match(/.{1,8}/g)?.join("-") ?? value.toUpperCase();
}

export function generateReceiptCode(): string {
  const bytes = randomBytes(20);
  let bits = "";
  for (const byte of Array.from(bytes)) bits += byte.toString(2).padStart(8, "0");
  let code = "";
  for (let index = 0; index < bits.length; index += 5) {
    code += RECEIPT_ALPHABET[parseInt(bits.slice(index, index + 5), 2)];
  }
  return code.match(/.{1,4}/g)?.join("-") ?? code;
}

export function normalizeReceiptCode(value: string): string {
  return value.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

export function hashReceiptCode(value: string): string {
  return sha256(normalizeReceiptCode(value));
}

export function generateBallotNonce(): string {
  return randomBytes(16).toString("base64url");
}

export function canonicalBallot(
  electionId: string,
  nonce: string,
  receiptHash: string,
  selections: ReadonlyArray<AuditSelection>,
): string {
  return JSON.stringify({
    version: AUDIT_VERSION,
    electionId,
    nonce,
    receiptHash,
    selections: [...selections]
      .sort((a, b) => a.positionId.localeCompare(b.positionId))
      .map(({ positionId, candidateId }) => ({ positionId, candidateId })),
  });
}

export function createBallotCommitment(
  key: Buffer,
  electionId: string,
  nonce: string,
  receiptHash: string,
  selections: ReadonlyArray<AuditSelection>,
): string {
  return createHmac("sha256", key)
    .update(canonicalBallot(electionId, nonce, receiptHash, selections))
    .digest("hex");
}

export function verifyBallotCommitment(
  expected: string,
  key: Buffer,
  electionId: string,
  nonce: string,
  receiptHash: string,
  selections: ReadonlyArray<AuditSelection>,
): boolean {
  const actual = createBallotCommitment(key, electionId, nonce, receiptHash, selections);
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(actual, "hex");
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, stableValue(nested)]),
    );
  }
  return value;
}

export function stableJson(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

export function hashSnapshot(snapshot: unknown): string {
  return sha256(stableJson(snapshot));
}

export function signSnapshot(key: Buffer, snapshot: unknown): string {
  return createHmac("sha256", key).update(stableJson(snapshot)).digest("hex");
}

export function verifySnapshotSignature(key: Buffer, snapshot: unknown, signature: string): boolean {
  const expected = signSnapshot(key, snapshot);
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");
  return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
}
