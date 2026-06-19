import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import PermissionNotice from "./PermissionNotice";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { denied?: string | string[] };
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const deniedParam = Array.isArray(searchParams.denied)
    ? searchParams.denied[0]
    : searchParams.denied;

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
      <PermissionNotice denied={deniedParam} />
      <DashboardClient
        elections={electionsWithVoted}
        globalVoterCount={globalVoterCount}
      />
    </div>
  );
}
