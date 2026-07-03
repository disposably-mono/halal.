import type { AdminRole } from "@prisma/client";
import type { JWT } from "next-auth/jwt";

/**
 * How often (ms) the NextAuth `jwt` callback re-checks the DB for the signed-in
 * admin's role/existence. Bounds how long a deleted or demoted admin can keep
 * using a stale session — see the `roleCheckedAt` claim below.
 */
export const ROLE_CHECK_INTERVAL_MS = 60_000;

export interface AdminRoleRecord {
  id: string;
  role: AdminRole;
}

/**
 * Revalidates a signed-in admin's role against the DB at most once every
 * ROLE_CHECK_INTERVAL_MS (tracked via the numeric `roleCheckedAt` claim on the
 * token), so a deleted/demoted admin loses stale capabilities within one
 * interval instead of riding out the full session lifetime.
 *
 * Pure w.r.t. I/O: the DB lookup is injected as `fetchAdmin` so this is
 * testable without a real Prisma client or NextAuth runtime.
 *
 * Failure semantics:
 *  - Account no longer exists in the DB -> returns `null`. NextAuth v5 treats
 *    a `null` return from the `jwt` callback as an invalidated session.
 *  - Role differs from `token.role` -> returns a copy of the token with the
 *    fresh role and a bumped `roleCheckedAt`.
 *  - `fetchAdmin` throws (e.g. the DB is briefly unreachable) -> logs the
 *    error and returns the token unchanged. An outage must not mass-logout
 *    every admin.
 *  - Still within the interval -> returns the token unchanged without
 *    touching the DB at all.
 */
export async function refreshTokenRole(
  token: JWT,
  fetchAdmin: (id: string) => Promise<AdminRoleRecord | null>,
  now: number = Date.now(),
): Promise<JWT | null> {
  if (!token.id) return token;

  const checkedAt = typeof token.roleCheckedAt === "number" ? token.roleCheckedAt : 0;
  if (now - checkedAt < ROLE_CHECK_INTERVAL_MS) return token;

  let admin: AdminRoleRecord | null;
  try {
    admin = await fetchAdmin(token.id);
  } catch (error) {
    console.error("auth: role revalidation query failed; keeping existing session", error);
    return token;
  }

  if (!admin) return null;

  return {
    ...token,
    role: admin.role,
    roleCheckedAt: now,
  };
}
