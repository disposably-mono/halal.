import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { can } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import PermissionNotice from "./PermissionNotice";
import { PageContainer } from "@/components/admin/ui";

export default async function AdminDashboard(
  props: {
    searchParams: Promise<{ denied?: string | string[] }>;
  }
) {
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session) redirect("/admin/login");
  const canLifecycle = can(session.user?.role, "election:lifecycle");

  const deniedParam = Array.isArray(searchParams.denied)
    ? searchParams.denied[0]
    : searchParams.denied;

  const [elections, totalRegistrations, distinctStudents, votedGroups] =
    await Promise.all([
      prisma.election.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          division: true,
          status: true,
          scheduledOpen: true,
          scheduledClose: true,
          archivedAt: true,
          archivedBy: true,
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
      // Every Voter row is one per-election registration (voterCode is globally
      // unique). Counting rows sums rosters, so the same student is counted once
      // per election they're registered in.
      prisma.voter.count(),
      // The real electorate: one entry per distinct student across all rosters.
      prisma.voter.groupBy({ by: ["studentId"] }),
      // Voted counts per election in one query (no N+1).
      prisma.voter.groupBy({
        by: ["electionId"],
        where: { hasVoted: true },
        _count: { _all: true },
      }),
    ]);

  const votedByElection = new Map(
    votedGroups.map((g) => [g.electionId, g._count._all]),
  );

  const electionsWithVoted = elections.map((e) => ({
    ...e,
    votedCount: votedByElection.get(e.id) ?? 0,
  }));

  const activeElections = electionsWithVoted.filter((e) => e.archivedAt === null);
  const archivedElections = electionsWithVoted.filter((e) => e.archivedAt !== null);

  return (
    <PageContainer className="flex flex-col gap-[18px]">
      <PermissionNotice denied={deniedParam} />
      <DashboardClient
        elections={activeElections}
        archivedElections={archivedElections}
        uniqueStudentCount={distinctStudents.length}
        totalRegistrations={totalRegistrations}
        canLifecycle={canLifecycle}
      />
    </PageContainer>
  );
}
