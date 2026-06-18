import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Session } from "next-auth";
import type { AdminRole } from "@prisma/client";
import { can, type Capability } from "@/lib/auth/permissions";

export async function requireAdminSession(): Promise<Session> {
  const session = await auth();
  if (!session) redirect("/admin/login");
  return session;
}

export type AuthGuardResult =
  | { ok: true; session: Session }
  | { ok: false; error: "Unauthorized" };

export async function requireAdminSessionOrError(): Promise<AuthGuardResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Unauthorized" };
  return { ok: true, session };
}

export function adminEmailFromSession(session: Session): string {
  return session.user?.email ?? "unknown";
}

export function adminRoleFromSession(session: Session): AdminRole | undefined {
  return session.user?.role;
}

/**
 * Page/action guard requiring a capability. Redirects unauthenticated users to
 * the login page, and authenticated-but-forbidden users to the dashboard (which
 * every admin can view) with `?denied=1` so the UI can explain the refusal.
 */
export async function requireCapability(cap: Capability): Promise<Session> {
  const session = await auth();
  if (!session) redirect("/admin/login");
  if (!can(session.user?.role, cap)) redirect("/admin?denied=1");
  return session;
}

export type CapabilityGuardResult =
  | { ok: true; session: Session }
  | { ok: false; error: "Unauthorized" | "Forbidden" };

/**
 * Non-redirecting capability guard for server actions and API routes that need
 * to surface an error. `Unauthorized` = not signed in; `Forbidden` = wrong role.
 */
export async function requireCapabilityOrError(
  cap: Capability,
): Promise<CapabilityGuardResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (!can(session.user?.role, cap)) return { ok: false, error: "Forbidden" };
  return { ok: true, session };
}
