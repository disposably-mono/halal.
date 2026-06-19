import bcrypt from "bcryptjs";

export type OfficerKeyCheck = "valid" | "ownOfficerKey" | "officerKey";

export type OfficerKeyMatch =
  | { result: "valid"; matchIndex: number }
  | { result: "ownOfficerKey" | "officerKey" };

export async function findDifferentOfficerKeyMatch(
  submittedKey: string,
  ownKeyHash: string,
  otherKeyHashes: string[],
): Promise<OfficerKeyMatch> {
  if (await bcrypt.compare(submittedKey, ownKeyHash)) {
    return { result: "ownOfficerKey" };
  }

  for (let index = 0; index < otherKeyHashes.length; index += 1) {
    if (await bcrypt.compare(submittedKey, otherKeyHashes[index])) {
      return { result: "valid", matchIndex: index };
    }
  }

  return { result: "officerKey" };
}

export async function verifyDifferentOfficerKey(
  submittedKey: string,
  ownKeyHash: string,
  otherKeyHashes: string[],
): Promise<OfficerKeyCheck> {
  const match = await findDifferentOfficerKeyMatch(
    submittedKey,
    ownKeyHash,
    otherKeyHashes,
  );
  return match.result;
}
