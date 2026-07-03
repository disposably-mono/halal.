"use client";

import { useCallback, useMemo, useState } from "react";
import { CalendarClock, ListOrdered, UserCheck, UserCog, UserRound } from "lucide-react";
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
  filterLoginHistory,
  summarizeLoginHistory,
  type HistoryDateFilter,
  type HistoryPersonFilter,
  type LoginHistoryIndexRow,
} from "./history-index";
import { HistoryTable } from "./HistoryTable";
import { AccountLogTable, type AccountLogRow } from "./AccountLogTable";

const PERSON_OPTIONS: HistoryPersonFilter[] = ["ALL", "OFFICER", "VERIFIER"];
const DATE_OPTIONS: HistoryDateFilter[] = ["ALL", "TODAY", "7D", "30D"];
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
  const visibleAccountLogs = useMemo(
    () => (accountLimit === "ALL" ? accountLogs : accountLogs.slice(0, Number(accountLimit))),
    [accountLogs, accountLimit],
  );
  const totalSummary = useMemo(() => summarizeLoginHistory(history), [history]);
  const matchedSummary = useMemo(() => summarizeLoginHistory(filtered), [filtered]);
  const visibleSummary = useMemo(() => summarizeLoginHistory(visible), [visible]);
  const activeFilters = activeFilterCount({ query, person, date, limit });

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

      <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Sign-ins" value={totalSummary.total.toLocaleString()} sub="latest 255 retained" accent="gold" />
        <MetricCard label="Officers" value={totalSummary.uniqueOfficers.toLocaleString()} sub="logged-in accounts" />
        <MetricCard label="Verifiers" value={totalSummary.uniqueVerifiers.toLocaleString()} sub="second-officer checks" />
        <MetricCard label="Visible" value={visibleSummary.total.toLocaleString()} sub={`${activeFilters} active filters`} accent="blue" />
      </div>

      <FilterPanel title="Filter history" meta={`${matchedSummary.total} login rows matched`}>
        <SearchInput onSearch={onSearch} placeholder="Search officer, verifier, or email" className="sm:max-w-none" />
        <FilterGrid>
          <FilterGroup
            icon={<UserRound aria-hidden="true" className="h-4 w-4" />}
            label="Person"
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
        meta={<span className="text-[10px] text-white/45">{visibleAccountLogs.length} of {accountLogs.length} shown</span>}
        noPad
      >
        <AccountLogTable logs={visibleAccountLogs} />
      </Card>
    </>
  );
}

function activeFilterCount(filters: {
  query: string;
  person: HistoryPersonFilter;
  date: HistoryDateFilter;
  limit: ShowLimit;
}) {
  return [
    filters.query.trim().length > 0,
    filters.person !== "ALL",
    filters.date !== "ALL",
    filters.limit !== DEFAULT_LIMIT,
  ].filter(Boolean).length;
}
