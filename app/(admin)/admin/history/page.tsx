import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/server/auth";
import { Card, PageContainer } from "@/components/admin/ui";
import { HistoryIndexClient } from "./HistoryIndexClient";
import { AccountLogTable } from "./AccountLogTable";

export const dynamic = "force-dynamic";

const ACCOUNT_LOG_LIMIT = 100;

export default async function AdminHistoryPage() {
  await requireCapability("history:view");

  const [history, accountLogs] = await Promise.all([
    prisma.adminLoginHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 250,
    }),
    prisma.adminAccountLog.findMany({
      orderBy: { createdAt: "desc" },
      take: ACCOUNT_LOG_LIMIT,
    }),
  ]);

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

      <Card
        title="Account changes"
        meta={<span className="text-[10px] text-white/45">Latest {accountLogs.length}</span>}
        noPad
      >
        <AccountLogTable
          logs={accountLogs.map((entry) => ({
            id: entry.id,
            createdAt: entry.createdAt.toISOString(),
            action: entry.action,
            actorName: entry.actorName,
            actorEmail: entry.actorEmail,
            targetName: entry.targetName,
            targetEmail: entry.targetEmail,
            targetRole: entry.targetRole,
          }))}
        />
      </Card>
    </PageContainer>
  );
}
