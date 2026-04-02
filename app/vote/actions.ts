"use server";

import { prisma } from "@/lib/prisma";
import { signVoterSession, VOTER_COOKIE } from "@/lib/voter-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type VoterLoginError =
  | "INVALID_CREDENTIALS"
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
  const rawId = formData.get("studentId");

  if (
    !rawCode || typeof rawCode !== "string" ||
    !rawId || typeof rawId !== "string"
  ) {
    return {
      error: "INVALID_CREDENTIALS",
      message: "Please enter both your Student ID and Control Number.",
    };
  }

  const voterCode = rawCode.trim().toUpperCase();
  const studentId = rawId.trim();

  // Format validation — fail fast before hitting DB
  if (!/^\d{4}[A-H]\d{3}$/.test(voterCode) || !/^\d{4}-\d{4}$/.test(studentId)) {
    return {
      error: "INVALID_CREDENTIALS",
      message: "Invalid credentials. Check your Student ID and Control Number.",
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

  // Generic response for not found OR studentId mismatch — no info leak
  if (!voter || voter.studentId !== studentId) {
    return {
      error: "INVALID_CREDENTIALS",
      message: "Invalid credentials. Check your Student ID and Control Number.",
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

  // Both factors valid — sign session JWT and set cookie
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
