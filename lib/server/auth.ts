import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Session } from "next-auth";

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
