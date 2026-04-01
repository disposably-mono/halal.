"use server";

import { prisma } from "@/lib/prisma";
import { signVoterSession, VOTER_COOKIE } from "@/lib/voter-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type VoterLoginError =
  | "INVALID_CODE"
  | "ALREADY_VOTED"
  | "ELECTION_NOT_OPEN"
  | "UNKNOWN";

export interface VoterLoginResult {
  error: VoterLoginError;
  message: string;
}

export async function validateVoterCode(
  _prev: VoterLoginResult | null,
  formData: FormData
): Promise<VoterLoginResult> {
  const rawCode = formData.get("voterCode");

  if (!rawCode || typeof rawCode !== "string") {
    return { error: "INVALID_CODE", message: "Please enter your control number." };
  }

  const voterCode = rawCode.trim().toUpperCase();

  // Basic format check: YYGGSNNN (8 chars, digits + 1 letter)
  if (!/^\d{4}[A-H]\d{3}$/.test(voterCode)) {
    return {
      error: "INVALID_CODE",
      message: "Invalid control number format. Check your slip and try again.",
    };
  }

  let voter;
  try {
    voter = await prisma.voter.findUnique({
      where: { voterCode },
      include: {
        election: {
          select: { id: true, status: true, division: true },
        },
      },
    });
  } catch {
    return { error: "UNKNOWN", message: "Something went wrong. Please try again." };
  }

  if (!voter) {
    return {
      error: "INVALID_CODE",
      message: "Control number not found. Double-check your slip.",
    };
  }

  if (voter.hasVoted) {
    return {
      error: "ALREADY_VOTED",
      message: "This control number has already been used to vote.",
    };
  }

  if (voter.election.status !== "OPEN") {
    const statusMessages: Record<string, string> = {
      DRAFT: "This election has not been opened yet.",
      SCHEDULED: "Voting has not started yet. Check the schedule.",
      CLOSED: "This election has already closed.",
    };
    return {
      error: "ELECTION_NOT_OPEN",
      message:
        statusMessages[voter.election.status] ??
        "This election is not currently open.",
    };
  }

  // Sign session JWT and set cookie
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
    maxAge: 60 * 30, // 30 minutes
    path: "/",
  });

  redirect("/vote/ballot");
}
