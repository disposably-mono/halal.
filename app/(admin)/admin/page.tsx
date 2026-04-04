import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const [elections, globalVoterCount] = await Promise.all([
    prisma.election.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        division: true,
        status: true,
        scheduledOpen: true,
        scheduledClose: true,
        _count: {
          select: {
            voters: true,
            votes: true,
            positions: true,
            candidates: true, // requires direct Candidate→Election relation
          },
        },
      },
    }),
    prisma.voter.count(),
  ]);

  const votedCounts = await Promise.all(
    elections.map((e) =>
      prisma.voter.count({ where: { electionId: e.id, hasVoted: true } })
    )
  );

  const electionsWithVoted = elections.map((e, i) => ({
    ...e,
    votedCount: votedCounts[i],
  }));

  return (
    <div className="p-6 flex flex-col gap-[18px]">
      <DashboardClient
        elections={electionsWithVoted}
        globalVoterCount={globalVoterCount}
      />
    </div>
  );
}
