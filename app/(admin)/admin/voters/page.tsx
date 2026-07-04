import { PageContainer } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/server/auth";
import { VotersIndexClient } from "./VotersIndexClient";

export default async function AdminVotersPage() {
  await requireCapability("voters:view");

  const voters = await prisma.voter.findMany({
    where: { election: { archivedAt: null } },
    orderBy: [{ gradeLevel: "asc" }, { section: "asc" }, { voterCode: "asc" }],
    select: {
      id: true,
      studentId: true,
      voterCode: true,
      gradeLevel: true,
      section: true,
      hasVoted: true,
      division: true,
      election: {
        select: { id: true, name: true, division: true, createdAt: true, status: true, archivedAt: true },
      },
    },
  });

  return (
    <PageContainer className="flex flex-col gap-[18px]">
      <VotersIndexClient voters={voters} />
    </PageContainer>
  );
}
