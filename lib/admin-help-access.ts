import { cookies } from "next/headers";
import {
  signHelpAccessToken,
  verifyHelpAccessToken,
} from "@/lib/auth/help-access-token";

export const ADMIN_HELP_COOKIE = "admin_help_access";

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return secret;
}

export function signAdminHelpAccess(): string {
  return signHelpAccessToken(getSecret());
}

export async function hasAdminHelpAccess(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_HELP_COOKIE)?.value;
  if (!token) return false;

  return verifyHelpAccessToken(token, getSecret());
}
