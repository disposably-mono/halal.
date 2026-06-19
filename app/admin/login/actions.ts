"use server";

import {
  checkAdminCredentials,
  type AdminCredentialFailure,
} from "@/lib/auth/admin-login";

export type CredentialCheckResult =
  | { ok: true }
  | { ok: false; reason: AdminCredentialFailure };

export async function verifyAdminCredentials(
  email: string,
  password: string,
  officerKey?: string,
): Promise<CredentialCheckResult> {
  const result = await checkAdminCredentials(email, password, officerKey);
  return result.ok ? { ok: true } : result;
}
