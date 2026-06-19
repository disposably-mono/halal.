import type { AdminRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/server/auth";
import { AccountsManager } from "./AccountForms";

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

  const superadminCount = admins.filter((a) => a.role === "SUPERADMIN").length;

  const accounts = admins.map((a) => ({
    id: a.id,
    email: a.email,
    name: a.name,
    role: a.role as AdminRole,
    lastLogin: a.lastLogin ? a.lastLogin.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="p-6 flex flex-col gap-[18px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-white/90">
            Admin Accounts
          </h1>
          <p className="text-[12px] text-white/50 mt-[3px]">
            COMELEC super-admins manage who can operate elections, canvass
            results, and observe. Each account has its own password and officer
            key.
          </p>
        </div>
        <span className="bg-white/[0.04] border border-white/[0.07] text-white/50 rounded-[6px] px-[9px] py-[4px] text-[11px]">
          {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
        </span>
      </div>

      <AccountsManager
        accounts={accounts}
        currentUserId={session.user?.id ?? ""}
        superadminCount={superadminCount}
      />
    </div>
  );
}
