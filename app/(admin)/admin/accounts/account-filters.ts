import type { AdminRole } from "@prisma/client";
import { activeFilterCount } from "../shared/filter-state";

export type AccountLoginFilter = "ALL" | "HAS_LOGIN" | "NEVER";
export type AccountRoleFilter = AdminRole | "ALL";

export type AccountFilterState = {
  query: string;
  role: AccountRoleFilter;
  loginState: AccountLoginFilter;
};

export type AccountFilterRow = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  lastLogin: string | null;
};

export const ACCOUNT_ROLE_FILTERS: readonly AccountRoleFilter[] = [
  "ALL",
  "SUPERADMIN",
  "COMMISSIONER",
  "CANVASSER",
  "OFFICER",
];

export const ACCOUNT_LOGIN_FILTERS: readonly AccountLoginFilter[] = [
  "ALL",
  "HAS_LOGIN",
  "NEVER",
];

export const ACCOUNT_ROLE_FILTER_LABELS: Record<AccountRoleFilter, string> = {
  ALL: "All roles",
  SUPERADMIN: "Super-admin",
  COMMISSIONER: "Commissioner",
  CANVASSER: "Canvasser",
  OFFICER: "Officer",
};

export const ACCOUNT_LOGIN_FILTER_LABELS: Record<AccountLoginFilter, string> = {
  ALL: "All login states",
  HAS_LOGIN: "Has signed in",
  NEVER: "Never signed in",
};

export const DEFAULT_ACCOUNT_FILTERS: AccountFilterState = {
  query: "",
  role: "ALL",
  loginState: "ALL",
};

export function filterAccounts<T extends AccountFilterRow>(
  accounts: readonly T[],
  filters: AccountFilterState,
): T[] {
  const query = filters.query.trim().toLowerCase();

  return accounts.filter((account) => {
    const matchesQuery =
      query.length === 0 ||
      account.name.toLowerCase().includes(query) ||
      account.email.toLowerCase().includes(query);
    const matchesRole = filters.role === "ALL" || account.role === filters.role;
    const matchesLogin =
      filters.loginState === "ALL" ||
      (filters.loginState === "HAS_LOGIN" && account.lastLogin !== null) ||
      (filters.loginState === "NEVER" && account.lastLogin === null);

    return matchesQuery && matchesRole && matchesLogin;
  });
}

export function countActiveAccountFilters(filters: AccountFilterState): number {
  return activeFilterCount([
    filters.query.trim().length > 0,
    filters.role !== "ALL",
    filters.loginState !== "ALL",
  ]);
}
