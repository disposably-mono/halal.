import { redirect } from "next/navigation";
import { getVoterSession } from "@/lib/voter-session";
import { prisma } from "@/lib/prisma";
import { parseGrades, formatGradeList } from "@/lib/domain/grade-format";
import { gradesForDivision } from "@/lib/elections/constants";
import BallotClient from "./BallotClient";

export const dynamic = "force-dynamic";

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
      positions={positions.map((p) => {
        const fullRange = gradesForDivision(session.division as "GS" | "JHS" | "SHS" | "HC");
        const voterGrades = p.eligibleGrades;
        const isVoterLocked = voterGrades.length > 0 && voterGrades.length < fullRange.length;
        return {
          id: p.id,
          title: p.title,
          candidateGradeLabel: formatGradeList(parseGrades(p.candidateGrade), fullRange),
          voterLockLabel: isVoterLocked ? formatGradeList(voterGrades, fullRange) : null,
          candidates: p.candidates,
        };
      })}
    />
  );
}
