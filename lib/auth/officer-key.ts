import bcrypt from "bcryptjs";

export type OfficerKeyCheck = "valid" | "ownOfficerKey" | "officerKey";

export async function verifyDifferentOfficerKey(
  submittedKey: string,
  ownKeyHash: string,
  otherKeyHashes: string[],
): Promise<OfficerKeyCheck> {
  if (await bcrypt.compare(submittedKey, ownKeyHash)) return "ownOfficerKey";

  for (const keyHash of otherKeyHashes) {
    if (await bcrypt.compare(submittedKey, keyHash)) return "valid";
  }

  return "officerKey";
}
