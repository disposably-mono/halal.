import { auth } from "@/auth";
import { PageContainer } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CandidatesIndexClient } from "./CandidatesIndexClient";

export default async function AdminCandidatesPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const positions = await prisma.position.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      eligibleGrades: true,
      candidateGrade: true,
      election: {
        select: { id: true, name: true, division: true, status: true },
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
