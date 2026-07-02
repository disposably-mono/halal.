import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/server/auth";
import { PageContainer } from "@/components/admin/ui";
import { HistoryIndexClient } from "./HistoryIndexClient";

export const dynamic = "force-dynamic";

export default async function AdminHistoryPage() {
  await requireCapability("history:view");

  const history = await prisma.adminLoginHistory.findMany({
    orderBy: { createdAt: "desc" },
    take: 250,
  });

  return (
    <PageContainer className="flex flex-col gap-[18px]">
      <HistoryIndexClient
        history={history.map((entry) => ({
          id: entry.id,
          createdAt: entry.createdAt.toISOString(),
          officerName: entry.officerName,
          officerEmail: entry.officerEmail,
          verifierName: entry.verifierName,
          verifierEmail: entry.verifierEmail,
        }))}
      />
    </PageContainer>
  );
}
