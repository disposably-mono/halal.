"use server";

import { prisma } from "@/lib/prisma";
import { signVoterSession, VOTER_COOKIE } from "@/lib/voter-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { safeParseFormData, VoterLoginSchema } from "@/lib/validation/schemas";

export type VoterLoginError =
  | "INVALID_CREDENTIALS"
  | "ALREADY_VOTED"
  | "ELECTION_NOT_OPEN"
  | "UNKNOWN";

export interface VoterLoginResult {
  error: VoterLoginError;
  message: string;
}

const STATUS_MESSAGES: Record<string, string> = {
  DRAFT: "This election has not been opened yet.",
  SCHEDULED: "Voting has not started yet. Check the schedule.",
  CLOSED: "This election has already closed.",
};

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
    return {
      error: "ELECTION_NOT_OPEN",
      message:
        STATUS_MESSAGES[voter.election.status] ??
        "This election is not currently open.",
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
