import { beforeAll, describe, expect, test } from "vitest";
import bcrypt from "bcryptjs";
import {
  findDifferentOfficerKeyMatch,
  verifyDifferentOfficerKey,
} from "@/lib/auth/officer-key";

describe("different-officer key verification", () => {
  let ownKeyHash: string;
  let otherKeyHash: string;

  beforeAll(async () => {
    [ownKeyHash, otherKeyHash] = await Promise.all([
      bcrypt.hash("officer-one-key", 4),
      bcrypt.hash("officer-two-key", 4),
    ]);
  });

  test("accepts a key belonging to another account", async () => {
    await expect(
      verifyDifferentOfficerKey("officer-two-key", ownKeyHash, [otherKeyHash]),
    ).resolves.toBe("valid");
  });

  test("identifies which other account supplied the matching key", async () => {
    const firstOtherKeyHash = await bcrypt.hash("officer-three-key", 4);

    await expect(
      findDifferentOfficerKeyMatch("officer-two-key", ownKeyHash, [
        firstOtherKeyHash,
        otherKeyHash,
      ]),
    ).resolves.toEqual({ result: "valid", matchIndex: 1 });
  });

  test("rejects the signing-in account's own key", async () => {
    await expect(
      verifyDifferentOfficerKey("officer-one-key", ownKeyHash, [otherKeyHash]),
    ).resolves.toBe("ownOfficerKey");
  });

  test("checks the own key first even if another account reused it", async () => {
    await expect(
      verifyDifferentOfficerKey("officer-one-key", ownKeyHash, [ownKeyHash]),
    ).resolves.toBe("ownOfficerKey");
  });

  test("rejects a key that belongs to no account", async () => {
    await expect(
      verifyDifferentOfficerKey("unknown-key", ownKeyHash, [otherKeyHash]),
    ).resolves.toBe("officerKey");
  });
});
