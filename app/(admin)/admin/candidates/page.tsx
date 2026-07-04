import { PageContainer } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/server/auth";
import { CandidatesIndexClient } from "./CandidatesIndexClient";

export default async function AdminCandidatesPage() {
  await requireCapability("candidates:view");

  const positions = await prisma.position.findMany({
    where: { isActive: true, election: { archivedAt: null } },
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      eligibleGrades: true,
      candidateGrade: true,
      election: {
        select: { id: true, name: true, division: true, createdAt: true, status: true, archivedAt: true },
      },
      candidates: {
        orderBy: { fullName: "asc" },
        select: { id: true, fullName: true, gradeLevel: true },
      },
    },
  });

  return (
    <PageContainer className="flex flex-col gap-[18px]">
      <CandidatesIndexClient positions={positions} />
    </PageContainer>
  );
}
