import { describe, expect, test } from "vitest";
import {
  signHelpAccessToken,
  verifyHelpAccessToken,
} from "@/lib/auth/help-access-token";

describe("admin help access token", () => {
  const secret = "test-secret";
  const now = 1_700_000_000_000;

  test("accepts a fresh signed token", () => {
    const token = signHelpAccessToken(secret, now);
    expect(verifyHelpAccessToken(token, secret, now + 1_000)).toBe(true);
  });

  test("rejects tampering and the wrong secret", () => {
    const token = signHelpAccessToken(secret, now);
    expect(verifyHelpAccessToken(`${token}x`, secret, now)).toBe(false);
    expect(verifyHelpAccessToken(token, "wrong-secret", now)).toBe(false);
  });

  test("rejects an expired token", () => {
    const token = signHelpAccessToken(secret, now);
    expect(verifyHelpAccessToken(token, secret, now + 30 * 60 * 1000)).toBe(false);
  });
});
