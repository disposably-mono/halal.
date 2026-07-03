"use server";

import {
  checkAdminCredentials,
  type AdminCredentialFailure,
} from "@/lib/auth/admin-login";
import { clientIp, rateLimit, RATE_LIMITS } from "@/lib/server/rate-limit";

export type CredentialCheckResult =
  | { ok: true }
  | { ok: false; reason: AdminCredentialFailure | "rateLimited" };

export async function verifyAdminCredentials(
  email: string,
  password: string,
  officerKey?: string,
): Promise<CredentialCheckResult> {
  // Throttle per-IP to blunt password/officer-key brute force before any
  // expensive bcrypt work runs. The real signIn path (auth.ts authorize) is
  // throttled too, so this can't be bypassed by calling NextAuth directly.
  const ip = await clientIp();
  if (!rateLimit(`admin-login:${ip}`, RATE_LIMITS.adminLogin).ok) {
    return { ok: false, reason: "rateLimited" };
  }

  try {
    const result = await checkAdminCredentials(email, password, officerKey);
    return result.ok ? { ok: true } : result;
  } catch (error) {
    console.error("Admin login credential check failed.", error);
    throw new Error("Unable to verify credentials right now. Please try again.");
  }
}
