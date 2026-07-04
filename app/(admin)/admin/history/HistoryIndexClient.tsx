"use client";

import { useCallback, useMemo, useState } from "react";
import { CalendarClock, KeyRound, ListOrdered, ShieldCheck, UserCheck, UserCog, UserRound } from "lucide-react";
import {
  Card,
  EmptyState,
  FilterGrid,
  FilterGroup,
  FilterOption,
  FilterPanel,
  MetricCard,
  PageHeader,
  SearchInput,
} from "@/components/admin/ui";
import {
  filterAccountLogs,
  filterLoginHistory,
  summarizeAccountLogs,
  summarizeLoginHistory,
  type AccountActionFilter,
  type AccountRoleFilter,
  type HistoryDateFilter,
  type HistoryPersonFilter,
  type LoginHistoryIndexRow,
} from "./history-index";
import { HistoryTable } from "./HistoryTable";
import { AccountLogTable, type AccountLogRow } from "./AccountLogTable";

const PERSON_OPTIONS: HistoryPersonFilter[] = ["ALL", "OFFICER", "VERIFIER"];
const DATE_OPTIONS: HistoryDateFilter[] = ["ALL", "TODAY", "7D", "30D"];
const ACCOUNT_ACTION_OPTIONS: AccountActionFilter[] = ["ALL", "ACCOUNT_CREATED", "ROLE_CHANGED", "CREDENTIAL", "ACCOUNT_DELETED"];
const ACCOUNT_ROLE_OPTIONS: AccountRoleFilter[] = ["ALL", "SUPERADMIN", "COMMISSIONER", "CANVASSER", "OFFICER"];
const LIMIT_OPTIONS: ShowLimit[] = ["25", "50", "100", "ALL"];
const DEFAULT_LIMIT: ShowLimit = "50";

const PERSON_LABELS: Record<HistoryPersonFilter, string> = {
  ALL: "All people",
  OFFICER: "Logged-in officer",
  VERIFIER: "Verifying officer",
};

const DATE_LABELS: Record<HistoryDateFilter, string> = {
  ALL: "All dates",
  TODAY: "Today",
  "7D": "Last 7 days",
  "30D": "Last 30 days",
};

const ACCOUNT_ACTION_LABELS: Record<AccountActionFilter, string> = {
  ALL: "All changes",
  ACCOUNT_CREATED: "Created accounts",
  ROLE_CHANGED: "Role changes",
  CREDENTIAL: "Credential resets",
  ACCOUNT_DELETED: "Deleted accounts",
};

const ACCOUNT_ROLE_LABELS: Record<AccountRoleFilter, string> = {
  ALL: "All target roles",
  SUPERADMIN: "Super-admin",
  COMMISSIONER: "Commissioner",
  CANVASSER: "Canvasser",
  OFFICER: "Officer",
};

type ShowLimit = "25" | "50" | "100" | "ALL";

const LIMIT_LABELS: Record<ShowLimit, string> = {
  "25": "Latest 25",
  "50": "Latest 50",
  "100": "Latest 100",
  ALL: "All rows",
};

export function HistoryIndexClient({
  history,
  accountLogs,
}: {
  history: LoginHistoryIndexRow[];
  accountLogs: AccountLogRow[];
}) {
  const [query, setQuery] = useState("");
  const [person, setPerson] = useState<HistoryPersonFilter>("ALL");
  const [date, setDate] = useState<HistoryDateFilter>("ALL");
  const [accountAction, setAccountAction] = useState<AccountActionFilter>("ALL");
  const [accountRole, setAccountRole] = useState<AccountRoleFilter>("ALL");
  const [limit, setLimit] = useState<ShowLimit>(DEFAULT_LIMIT);
  const [accountLimit, setAccountLimit] = useState<ShowLimit>(DEFAULT_LIMIT);
  const onSearch = useCallback((value: string) => setQuery(value), []);

  const filtered = useMemo(
    () => filterLoginHistory(history, { query, person, date }),
    [date, history, person, query],
  );
  const visible = useMemo(
    () => (limit === "ALL" ? filtered : filtered.slice(0, Number(limit))),
    [filtered, limit],
  );
  const filteredAccountLogs = useMemo(
    () => filterAccountLogs(accountLogs, { query, action: accountAction, role: accountRole, date }),
    [accountAction, accountLogs, accountRole, date, query],
  );
  const visibleAccountLogs = useMemo(
    () => (accountLimit === "ALL" ? filteredAccountLogs : filteredAccountLogs.slice(0, Number(accountLimit))),
    [accountLimit, filteredAccountLogs],
  );
  const totalSummary = useMemo(() => summarizeLoginHistory(history), [history]);
  const matchedSummary = useMemo(() => summarizeLoginHistory(filtered), [filtered]);
  const visibleSummary = useMemo(() => summarizeLoginHistory(visible), [visible]);
  const totalAccountSummary = useMemo(() => summarizeAccountLogs(accountLogs), [accountLogs]);
  const matchedAccountSummary = useMemo(() => summarizeAccountLogs(filteredAccountLogs), [filteredAccountLogs]);
  const visibleAccountSummary = useMemo(() => summarizeAccountLogs(visibleAccountLogs), [visibleAccountLogs]);
  const activeFilters = activeFilterCount({ query, person, date, accountAction, accountRole, limit, accountLimit });

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Login History"
        meta={
          <span>
            <span className="font-medium text-gold/80">{visibleSummary.total.toLocaleString()} visible</span>
            {" "}of {totalSummary.total.toLocaleString()} successful sign-ins.
          </span>
        }
        actions={
          <span className="rounded-[6px] border border-gold/20 bg-gold/[0.07] px-[9px] py-[4px] text-[11px] text-gold/80">
            Latest {totalSummary.total}
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Sign-ins" value={totalSummary.total.toLocaleString()} sub="latest 255 retained" accent="gold" />
        <MetricCard label="Officers" value={totalSummary.uniqueOfficers.toLocaleString()} sub="logged-in accounts" />
        <MetricCard label="Verifiers" value={totalSummary.uniqueVerifiers.toLocaleString()} sub="second-officer checks" />
        <MetricCard label="Account changes" value={totalAccountSummary.total.toLocaleString()} sub="latest 125 retained" />
        <MetricCard label="Visible" value={(visibleSummary.total + visibleAccountSummary.total).toLocaleString()} sub={`${activeFilters} active filters`} accent="blue" />
      </div>

      <FilterPanel title="Filter history" meta={`${matchedSummary.total} sign-ins and ${matchedAccountSummary.total} account changes matched`}>
        <SearchInput onSearch={onSearch} placeholder="Search officer, verifier, actor, target, action, or email" className="sm:max-w-none" />
        <FilterGrid>
          <FilterGroup
            icon={<UserRound aria-hidden="true" className="h-4 w-4" />}
            label="Sign-in person"
            value={PERSON_LABELS[person]}
          >
            {PERSON_OPTIONS.map((option) => (
              <FilterOption key={option} active={person === option} onClick={() => setPerson(option)}>
                {PERSON_LABELS[option]}
              </FilterOption>
            ))}
          </FilterGroup>
          <FilterGroup
            icon={<CalendarClock aria-hidden="true" className="h-4 w-4" />}
            label="Date range"
            value={DATE_LABELS[date]}
          >
            {DATE_OPTIONS.map((option) => (
              <FilterOption key={option} active={date === option} onClick={() => setDate(option)}>
                {DATE_LABELS[option]}
              </FilterOption>
            ))}
          </FilterGroup>
          <FilterGroup
            icon={<KeyRound aria-hidden="true" className="h-4 w-4" />}
            label="Account action"
            value={ACCOUNT_ACTION_LABELS[accountAction]}
          >
            {ACCOUNT_ACTION_OPTIONS.map((option) => (
              <FilterOption key={option} active={accountAction === option} onClick={() => setAccountAction(option)}>
                {ACCOUNT_ACTION_LABELS[option]}
              </FilterOption>
            ))}
          </FilterGroup>
          <FilterGroup
            icon={<ShieldCheck aria-hidden="true" className="h-4 w-4" />}
            label="Target role"
            value={ACCOUNT_ROLE_LABELS[accountRole]}
          >
            {ACCOUNT_ROLE_OPTIONS.map((option) => (
              <FilterOption key={option} active={accountRole === option} onClick={() => setAccountRole(option)}>
                {ACCOUNT_ROLE_LABELS[option]}
              </FilterOption>
            ))}
          </FilterGroup>
          <FilterGroup
            icon={<ListOrdered aria-hidden="true" className="h-4 w-4" />}
            label="Show sign-ins"
            value={LIMIT_LABELS[limit]}
          >
            {LIMIT_OPTIONS.map((option) => (
              <FilterOption key={option} active={limit === option} onClick={() => setLimit(option)}>
                {LIMIT_LABELS[option]}
              </FilterOption>
            ))}
          </FilterGroup>
          <FilterGroup
            icon={<UserCog aria-hidden="true" className="h-4 w-4" />}
            label="Show account changes"
            value={LIMIT_LABELS[accountLimit]}
          >
            {LIMIT_OPTIONS.map((option) => (
              <FilterOption key={option} active={accountLimit === option} onClick={() => setAccountLimit(option)}>
                {LIMIT_LABELS[option]}
              </FilterOption>
            ))}
          </FilterGroup>
        </FilterGrid>
      </FilterPanel>

      <Card
        title="Recent sign-ins"
        meta={<span className="text-[10px] text-white/45">{visible.length} of {matchedSummary.total} shown</span>}
        noPad
      >
        {history.length === 0 ? (
          <EmptyState
            icon={<UserCheck aria-hidden="true" className="h-[18px] w-[18px]" />}
            title="No login history yet"
            hint="Successful admin sign-ins will appear here after the first 2FA login."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<UserCheck aria-hidden="true" className="h-[18px] w-[18px]" />}
            title="No history rows match"
            hint="Try a different search, person, or date filter."
          />
        ) : (
          <>
            <HistoryTable history={visible} query={query} />
            <p className="border-t border-white/[0.07] px-4 py-3 text-[10px] text-white/40">
              Times are shown in Philippine Standard Time. The latest 255 sign-ins are displayed.
            </p>
          </>
        )}
      </Card>

      <Card
        title="Account changes"
        meta={<span className="text-[10px] text-white/45">{visibleAccountLogs.length} of {matchedAccountSummary.total} shown</span>}
        noPad
      >
        {accountLogs.length === 0 ? (
          <EmptyState
            icon={<UserCog aria-hidden="true" className="h-[18px] w-[18px]" />}
            title="No account changes yet"
            hint="Account creations, role changes, credential resets, and deletions will appear here."
          />
        ) : filteredAccountLogs.length === 0 ? (
          <EmptyState
            icon={<UserCog aria-hidden="true" className="h-[18px] w-[18px]" />}
            title="No account changes match"
            hint="Try a different search, action, role, or date filter."
          />
        ) : (
          <>
            <AccountLogTable logs={visibleAccountLogs} query={query} />
            <p className="border-t border-white/[0.07] px-4 py-3 text-[10px] text-white/40">
              Times are shown in Philippine Standard Time. The latest 125 account changes are displayed.
            </p>
          </>
        )}
      </Card>
    </>
  );
}

function activeFilterCount(filters: {
  query: string;
  person: HistoryPersonFilter;
  date: HistoryDateFilter;
  accountAction: AccountActionFilter;
  accountRole: AccountRoleFilter;
  limit: ShowLimit;
  accountLimit: ShowLimit;
}) {
  return [
    filters.query.trim().length > 0,
    filters.person !== "ALL",
    filters.date !== "ALL",
    filters.accountAction !== "ALL",
    filters.accountRole !== "ALL",
    filters.limit !== DEFAULT_LIMIT,
    filters.accountLimit !== DEFAULT_LIMIT,
  ].filter(Boolean).length;
}
