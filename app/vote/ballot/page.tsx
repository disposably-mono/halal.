import { redirect } from "next/navigation";
import { getVoterSession } from "@/lib/voter-session";
import { prisma } from "@/lib/prisma";
import BallotClient from "./BallotClient";

export const dynamic = "force-dynamic";

/** Parse Position.candidateGrade (stored as string e.g. "9" or "9,10,11") */
function parseCandidateGrade(raw: string): number | number[] {
  const parts = raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
  if (parts.length === 0) return 0;
  if (parts.length === 1) return parts[0];
  return parts;
}

export default async function BallotPage() {
  const session = await getVoterSession();

  if (!session) redirect("/vote");

  const voter = await prisma.voter.findUnique({
    where: { id: session.voterId },
    select: { hasVoted: true, gradeLevel: true, section: true, division: true },
  });

  if (!voter) redirect("/vote");
  if (voter.hasVoted) redirect("/vote/confirmed");

  const election = await prisma.election.findUnique({
    where: { id: session.electionId },
    select: { status: true, name: true, division: true },
  });

  if (!election || election.status !== "OPEN") redirect("/vote");

  const positions = await prisma.position.findMany({
    where: {
      electionId: session.electionId,
      isActive: true,
      eligibleGrades: { has: voter.gradeLevel },
    },
    include: {
      candidates: {
        select: { id: true, fullName: true, gradeLevel: true },
        orderBy: { fullName: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  return (
    <BallotClient
      electionName={election.name}
      division={session.division}
      gradeLevel={voter.gradeLevel}
      section={voter.section}
      positions={positions.map((p) => ({
        id: p.id,
        title: p.title,
        candidateGrade: parseCandidateGrade(p.candidateGrade),
        candidates: p.candidates,
      }))}
    />
  );
}
