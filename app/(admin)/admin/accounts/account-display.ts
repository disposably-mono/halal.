import type { AdminRole } from "@prisma/client";

export function getAccountSummary(accounts: readonly { role: AdminRole | string }[]) {
  const total = accounts.length;
  return {
    totalLabel: `${total} ${total === 1 ? "account" : "accounts"}`,
    superadminCount: accounts.filter((account) => account.role === "SUPERADMIN").length,
  };
}
