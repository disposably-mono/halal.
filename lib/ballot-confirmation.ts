import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const BALLOT_CONFIRMATION_COOKIE = "ballot_confirmation";

export type BallotConfirmation = {
  ballotId: string;
  receiptCode: string;
};

function secret() {
  const value = process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(value);
}

export async function signBallotConfirmation(payload: BallotConfirmation): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret());
}

export async function getBallotConfirmation(): Promise<BallotConfirmation | null> {
  const token = (await cookies()).get(BALLOT_CONFIRMATION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.ballotId !== "string" || typeof payload.receiptCode !== "string") return null;
    return { ballotId: payload.ballotId, receiptCode: payload.receiptCode };
  } catch {
    return null;
  }
}

export async function setBallotConfirmation(payload: BallotConfirmation): Promise<void> {
  const token = await signBallotConfirmation(payload);
  (await cookies()).set(BALLOT_CONFIRMATION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 10,
    path: "/",
  });
}
