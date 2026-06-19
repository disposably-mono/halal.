import { createHmac, timingSafeEqual } from "node:crypto";

const ACCESS_DURATION_MS = 30 * 60 * 1000;

function signature(expiresAt: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`admin-help:${expiresAt}`)
    .digest("base64url");
}

export function signHelpAccessToken(secret: string, now = Date.now()): string {
  const expiresAt = String(now + ACCESS_DURATION_MS);
  return `${expiresAt}.${signature(expiresAt, secret)}`;
}

export function verifyHelpAccessToken(
  token: string,
  secret: string,
  now = Date.now(),
): boolean {
  const [expiresAt, submittedSignature, extra] = token.split(".");
  if (!expiresAt || !submittedSignature || extra) return false;

  const expiresAtMs = Number(expiresAt);
  if (!Number.isSafeInteger(expiresAtMs) || expiresAtMs <= now) return false;

  const expectedSignature = signature(expiresAt, secret);
  const submitted = Buffer.from(submittedSignature);
  const expected = Buffer.from(expectedSignature);
  return submitted.length === expected.length && timingSafeEqual(submitted, expected);
}
