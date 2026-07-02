"use server";

import { prisma } from "@/lib/prisma";
import { signVoterSession, VOTER_COOKIE } from "@/lib/voter-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { safeParseFormData, VoterLoginSchema } from "@/lib/validation/schemas";
import { rateLimit, RATE_LIMITS } from "@/lib/server/rate-limit";
import { notOpenMessage } from "@/lib/domain/voter-login";

export type VoterLoginError =
  | "INVALID_CREDENTIALS"
  | "ALREADY_VOTED"
  | "ELECTION_NOT_OPEN"
  | "RATE_LIMITED"
  | "UNKNOWN";

export interface VoterLoginResult {
  error: VoterLoginError;
  message: string;
}

const INVALID_CREDS: VoterLoginResult = {
  error: "INVALID_CREDENTIALS",
  message: "Invalid credentials. Check your Student ID and Control Number.",
};

export async function validateVoterCode(
  _prev: VoterLoginResult | null,
  formData: FormData,
): Promise<VoterLoginResult> {
  const parsed = safeParseFormData(VoterLoginSchema, formData);
  if (!parsed.success) {
    return INVALID_CREDS;
  }
  const { voterCode, studentId } = parsed.data;

  // Throttle per Student ID — the account under attack — not per IP. A whole
  // computer lab shares one campus NAT, so an IP key would lock out legitimate
  // voters; keying by Student ID caps guessing of one student's narrow
  // control-number space while leaving everyone else unaffected.
  if (!rateLimit(`voter-validate:${studentId}`, RATE_LIMITS.voterValidate).ok) {
    return {
      error: "RATE_LIMITED",
      message:
        "Too many attempts for this Student ID. Please wait a few minutes and try again.",
    };
  }

  let voter;
  try {
    voter = await prisma.voter.findUnique({
      where: { voterCode },
      include: {
        election: { select: { id: true, status: true, division: true } },
      },
    });
  } catch {
    return { error: "UNKNOWN", message: "Something went wrong. Please try again." };
  }

  if (!voter || voter.studentId !== studentId) {
    return INVALID_CREDS;
  }

  if (voter.hasVoted) {
    return {
      error: "ALREADY_VOTED",
      message: "This control number has already been used to vote.",
    };
  }

  if (voter.election.status !== "OPEN") {
    // Nudge (not routing): if this student ALSO has a currently-open, unvoted
    // election, they may be holding the wrong slip. Read-only; reveals nothing
    // about which election is open. Degrade to the plain message on any error.
    let hasOtherOpen = false;
    try {
      hasOtherOpen =
        (await prisma.voter.count({
          where: {
            studentId,
            hasVoted: false,
            id: { not: voter.id },
            election: { status: "OPEN", archivedAt: null },
          },
        })) > 0;
    } catch {
      hasOtherOpen = false;
    }
    return {
      error: "ELECTION_NOT_OPEN",
      message: notOpenMessage(voter.election.status, hasOtherOpen),
    };
  }

  const token = await signVoterSession({
    voterId: voter.id,
    electionId: voter.electionId,
    gradeLevel: voter.gradeLevel,
    division: voter.election.division,
  });

  const cookieStore = await cookies();
  cookieStore.set(VOTER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 30,
    path: "/",
  });

  redirect("/vote/ballot");
}
