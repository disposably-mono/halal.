import type { AdminRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/server/auth";
import { PageContainer, PageHeader } from "@/components/admin/ui";
import { AccountsManager } from "./AccountForms";
import { getAccountSummary } from "./account-display";

export const dynamic = "force-dynamic";

export default async function AdminAccountsPage() {
  const session = await requireCapability("accounts:manage");

  const admins = await prisma.adminUser.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      lastLogin: true,
      createdAt: true,
    },
  });

  const summary = getAccountSummary(admins);

  const accounts = admins.map((a) => ({
    id: a.id,
    email: a.email,
    name: a.name,
    role: a.role as AdminRole,
    lastLogin: a.lastLogin ? a.lastLogin.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <PageContainer className="flex flex-col gap-[18px]">
      <PageHeader
        title="Admin Accounts"
        meta="COMELEC super-admins manage who can operate elections, canvass results, and observe. Each account has its own password and officer key."
        actions={
        <span className="bg-white/[0.04] border border-white/[0.07] text-white/50 rounded-[6px] px-[9px] py-[4px] text-[11px]">
          {summary.totalLabel}
        </span>
        }
      />

      <AccountsManager
        accounts={accounts}
        currentUserId={session.user?.id ?? ""}
        superadminCount={summary.superadminCount}
      />
    </PageContainer>
  );
}
