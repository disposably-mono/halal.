import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/server/auth";
import { PageContainer, PageHeader } from "@/components/admin/ui";
import { HistoryTable } from "./HistoryTable";

export const dynamic = "force-dynamic";

export default async function AdminHistoryPage() {
  await requireCapability("history:view");

  const history = await prisma.adminLoginHistory.findMany({
    orderBy: { createdAt: "desc" },
    take: 250,
  });

  return (
    <PageContainer className="flex flex-col gap-[18px]">
      <PageHeader
        title="Login History"
        meta="Successful admin sign-ins and the officer who verified each one."
        actions={
        <span className="rounded-[6px] border border-white/[0.07] bg-white/[0.04] px-[9px] py-[4px] text-[11px] text-white/50">
          Latest {history.length}
        </span>
        }
      />

      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-admin-surface">
        <HistoryTable
          history={history.map((entry) => ({
            id: entry.id,
            createdAt: entry.createdAt.toISOString(),
            officerName: entry.officerName,
            officerEmail: entry.officerEmail,
            verifierName: entry.verifierName,
            verifierEmail: entry.verifierEmail,
          }))}
        />
      </div>
      <p className="text-[10px] text-white/60">
        Times are shown in Philippine Standard Time. The latest 250 sign-ins are displayed.
      </p>
    </PageContainer>
  );
}
