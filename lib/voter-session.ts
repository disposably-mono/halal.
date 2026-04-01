import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const VOTER_COOKIE = "voter_session";

export interface VoterSession {
  voterId: string;
  electionId: string;
  gradeLevel: number;
  division: string;
}

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signVoterSession(payload: VoterSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(getSecret());
}

export async function verifyVoterSession(
  token: string
): Promise<VoterSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as VoterSession;
  } catch {
    return null;
  }
}

export async function getVoterSession(): Promise<VoterSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(VOTER_COOKIE)?.value;
  if (!token) return null;
  return verifyVoterSession(token);
}

export async function clearVoterSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(VOTER_COOKIE);
}
