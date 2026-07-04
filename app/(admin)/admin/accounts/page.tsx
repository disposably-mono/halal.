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
    <PageContainer className="flex flex-col gap-[20px]">
      <PageHeader
        eyebrow="Administration"
        title="Admin Accounts"
        meta={
          <span>
            <span className="font-medium text-gold/80">Officer access is gated by two-person verification.</span>
            {" "}Each account has its own password and officer key.
          </span>
        }
        actions={
        <span className="rounded-[7px] border border-gold/20 bg-gold/[0.07] px-[10px] py-[4px] text-[12px] text-gold/80">
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
