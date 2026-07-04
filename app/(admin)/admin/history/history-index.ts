export type LoginHistoryIndexRow = {
  id: string;
  createdAt: string;
  officerName: string;
  officerEmail: string;
  verifierName: string;
  verifierEmail: string;
};

export type AccountLogIndexRow = {
  id: string;
  createdAt: string;
  action: string;
  actorName: string;
  actorEmail: string;
  targetName: string;
  targetEmail: string;
  targetRole: string;
};

export type HistoryPersonFilter = "ALL" | "OFFICER" | "VERIFIER";
export type HistoryDateFilter = "ALL" | "TODAY" | "7D" | "30D";
export type AccountActionFilter =
  | "ALL"
  | "ACCOUNT_CREATED"
  | "ROLE_CHANGED"
  | "CREDENTIAL"
  | "ACCOUNT_DELETED";
export type AccountRoleFilter = "ALL" | "SUPERADMIN" | "COMMISSIONER" | "CANVASSER" | "OFFICER";

export type HistoryFilters = {
  query: string;
  person: HistoryPersonFilter;
  date: HistoryDateFilter;
  now?: Date;
};

export type AccountLogFilters = {
  query: string;
  action: AccountActionFilter;
  role: AccountRoleFilter;
  date: HistoryDateFilter;
  now?: Date;
};

export type LoginHistorySummary = {
  total: number;
  uniqueOfficers: number;
  uniqueVerifiers: number;
};

export type AccountLogSummary = {
  total: number;
  uniqueActors: number;
  uniqueTargets: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function summarizeLoginHistory(rows: readonly LoginHistoryIndexRow[]): LoginHistorySummary {
  return {
    total: rows.length,
    uniqueOfficers: new Set(rows.map((row) => row.officerEmail.toLowerCase())).size,
    uniqueVerifiers: new Set(rows.map((row) => row.verifierEmail.toLowerCase())).size,
  };
}

export function summarizeAccountLogs(rows: readonly AccountLogIndexRow[]): AccountLogSummary {
  return {
    total: rows.length,
    uniqueActors: new Set(rows.map((row) => row.actorEmail.toLowerCase())).size,
    uniqueTargets: new Set(rows.map((row) => row.targetEmail.toLowerCase())).size,
  };
}

export function filterLoginHistory(
  rows: readonly LoginHistoryIndexRow[],
  filters: HistoryFilters,
): LoginHistoryIndexRow[] {
  const query = filters.query.trim().toLowerCase();
  const now = filters.now ?? new Date();

  return rows.filter((row) => {
    if (!matchesPerson(row, query, filters.person)) return false;
    return matchesDate(row.createdAt, filters.date, now);
  });
}

export function filterAccountLogs(
  rows: readonly AccountLogIndexRow[],
  filters: AccountLogFilters,
): AccountLogIndexRow[] {
  const query = filters.query.trim().toLowerCase();
  const now = filters.now ?? new Date();

  return rows.filter((row) => {
    if (!matchesAccountQuery(row, query)) return false;
    if (!matchesAccountAction(row.action, filters.action)) return false;
    if (!matchesAccountRole(row.targetRole, filters.role)) return false;
    return matchesDate(row.createdAt, filters.date, now);
  });
}

function matchesPerson(row: LoginHistoryIndexRow, query: string, person: HistoryPersonFilter) {
  if (query.length === 0) return true;

  const officer = `${row.officerName} ${row.officerEmail}`.toLowerCase();
  const verifier = `${row.verifierName} ${row.verifierEmail}`.toLowerCase();

  if (person === "OFFICER") return officer.includes(query);
  if (person === "VERIFIER") return verifier.includes(query);
  return officer.includes(query) || verifier.includes(query);
}

function matchesAccountQuery(row: AccountLogIndexRow, query: string) {
  if (query.length === 0) return true;

  return [
    row.action,
    row.actorName,
    row.actorEmail,
    row.targetName,
    row.targetEmail,
    row.targetRole,
  ].some((value) => value.toLowerCase().includes(query));
}

function matchesAccountAction(action: string, filter: AccountActionFilter) {
  if (filter === "ALL") return true;
  if (filter === "ACCOUNT_CREATED") return action.startsWith("Created account");
  if (filter === "ROLE_CHANGED") return action.startsWith("Changed role");
  if (filter === "CREDENTIAL") return action.startsWith("Reset password") || action.startsWith("Reset officer key");
  return action.startsWith("Deleted account");
}

function matchesAccountRole(targetRole: string, filter: AccountRoleFilter) {
  return filter === "ALL" || targetRole === filter;
}

function matchesDate(createdAt: string, date: HistoryDateFilter, now: Date) {
  if (date === "ALL") return true;

  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  if (created.getTime() > now.getTime()) return false;

  if (date === "TODAY") {
    return created.toLocaleDateString("en-PH", { timeZone: "Asia/Manila" })
      === now.toLocaleDateString("en-PH", { timeZone: "Asia/Manila" });
  }

  const days = date === "7D" ? 7 : 30;
  const ageMs = now.getTime() - created.getTime();
  return ageMs >= 0 && ageMs <= days * MS_PER_DAY;
}
