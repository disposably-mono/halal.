"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AttnCard } from "./_components/AttnCard";
import { ArchivedSection } from "./_components/ArchivedSection";
import { RowActions } from "./_components/RowActions";
import { StatusPill } from "./_components/StatusPill";
import { DashboardLiveStats } from "./_components/DashboardLiveStats";
import {
  AccordionCard,
  DataTable,
  EmptyState,
  FilterGroup,
  FilterOption,
  FilterPanel,
  MetricCard,
  PageHeader,
  SearchInput,
  Toast,
  useToast,
  highlightMatch,
  type ToastVariant,
} from "@/components/admin/ui";
import {
  buildDashboardSummary,
  filterDashboardBuckets,
  type DashboardArchiveFilter,
  type DashboardStatusFilter,
} from "./_components/dashboard-helpers";
import { DIVISION_LABELS, fmt, pct, type Election } from "./_components/shared";
import { Button } from "@/components/ui/button";
import { Archive, CalendarClock, ListFilter } from "lucide-react";
import { hasActiveFilters } from "./shared/filter-state";
import {
  ALL_RECENT_ELECTION_FILTER_OPTIONS as RECENT_OPTIONS,
  formatRecentElectionFilter,
  type RecentElectionFilter,
} from "./shared/recent-election-filter";

const ARCHIVE_SCOPE_OPTIONS: DashboardArchiveFilter[] = ["ACTIVE", "ARCHIVED", "ALL"];

const ARCHIVE_SCOPE_LABELS: Record<DashboardArchiveFilter, string> = {
  ACTIVE: "Active only",
  ARCHIVED: "Archived only",
  ALL: "Active + Archived",
};

export default function DashboardClient({
  elections,
  uniqueStudentCount,
  totalRegistrations,
  archivedElections,
  canLifecycle,
}: {
  elections: Election[];
  uniqueStudentCount: number;
  totalRegistrations: number;
  archivedElections: Election[];
  canLifecycle: boolean;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DashboardStatusFilter>("ALL");
  const [recentElectionCount, setRecentElectionCount] =
    useState<RecentElectionFilter>("ALL");
  const [archiveScope, setArchiveScope] =
    useState<DashboardArchiveFilter>("ACTIVE");

  const { toast, showToast, dismissToast } = useToast();

  const onToast = useCallback(
    (msg: string, variant: ToastVariant) => {
      showToast({ msg, variant });
    },
    [showToast],
  );

  const summary = useMemo(
    () => buildDashboardSummary(elections, uniqueStudentCount, totalRegistrations),
    [elections, uniqueStudentCount, totalRegistrations],
  );

  const hasSearchFilters = hasActiveFilters([
    query.trim().length > 0,
    statusFilter !== "ALL",
    recentElectionCount !== "ALL",
  ]);

  const buckets = useMemo(
    () =>
      filterDashboardBuckets(elections, archivedElections, {
        query,
        status: statusFilter,
        recentElectionCount,
        archiveScope,
      }),
    [
      elections,
      archivedElections,
      query,
      statusFilter,
      recentElectionCount,
      archiveScope,
    ],
  );

  const filteredElections = buckets.active;

  const attnElections = useMemo(
    () =>
      filteredElections.filter(
        (election) =>
          election.status === "OPEN" || election.status === "SCHEDULED",
      ),
    [filteredElections],
  );

  const filteredArchivedElections = buckets.archived;

  const activeScopedTotal = archiveScope === "ARCHIVED" ? 0 : elections.length;
  const archivedScopedTotal =
    archiveScope === "ACTIVE" ? 0 : archivedElections.length;

  const shouldOpenActive = archiveScope !== "ARCHIVED";
  const shouldOpenArchived =
    archiveScope === "ARCHIVED" || (archiveScope === "ALL" && hasSearchFilters);

  const totalElectionCount = elections.length + archivedElections.length;

  const statusOptions: DashboardStatusFilter[] = [
    "ALL",
    "OPEN",
    "SCHEDULED",
    "DRAFT",
    "CLOSED",
  ];

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Elections Dashboard"
        meta={`${summary.totalElections} elections · ${summary.openCount} active now`}
        actions={
          canLifecycle && (
            <Button asChild variant="adminPrimary" size="adminMd">
              <Link href="/admin/elections/new">New Election</Link>
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-[11px] sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Elections"
          value={summary.totalElections}
          sub={summary.statusBreakdown || "No elections yet"}
          accent="gold"
        />

        <MetricCard
          label="Active Now"
          value={summary.openCount}
          sub={
            summary.openCount > 0
              ? `${summary.activeNames} · ${summary.activeTurnout}% voted`
              : "None active"
          }
          accent={summary.openCount > 0 ? "emerald" : undefined}
        />

        <MetricCard
          label="Registered Voters"
          value={summary.uniqueStudentCount.toLocaleString()}
          sub={
            summary.uniqueStudentCount === summary.totalRegistrations
              ? "unique students"
              : `unique students · ${summary.totalRegistrations.toLocaleString()} registrations`
          }
          accent="blue"
        />

        <MetricCard
          label="Avg. Final Turnout"
          value={summary.avgTurnout !== null ? `${summary.avgTurnout}%` : "—"}
          sub={`${summary.totalBallotsCast.toLocaleString()} ballots cast${
            summary.closedCount > 0 ? ` · ${summary.closedCount} closed` : ""
          }`}
          accent="gold"
        />
      </div>

      <DashboardLiveStats elections={elections} />

      {attnElections.length > 0 && (
        <div>
          <div className="mb-[9px] text-[11px] font-semibold uppercase tracking-[0.07em] text-white/40">
            Active &amp; Upcoming
          </div>

          <div
            className="grid gap-[11px]"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
          >
            {attnElections.map((election) => (
              <AttnCard key={election.id} e={election} query={query} />
            ))}
          </div>
        </div>
      )}

      {totalElectionCount === 0 && (
        <EmptyState
          title="No active elections"
          hint={
            canLifecycle
              ? "Create an election or restore one from the archive."
              : "No elections are currently active."
          }
          icon={
            <svg
              style={{ width: 20, height: 20 }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
          action={
            canLifecycle && (
              <Link
                href="/admin/elections/new"
                className="text-[12px] text-gold no-underline transition-all hover:opacity-80"
              >
                Create election →
              </Link>
            )
          }
        />
      )}

      {totalElectionCount > 0 && (
        <>
          <FilterPanel
            title="Filter elections"
            meta={`${buckets.totalVisible} of ${buckets.totalScoped} shown`}
          >
            <SearchInput
              onSearch={setQuery}
              placeholder="Search elections"
              className="sm:max-w-none"
            />

            <div className="space-y-[13px]">
              <FilterGroup
                icon={<ListFilter aria-hidden="true" className="h-[18px] w-[18px]" />}
                label="Election status"
                value={statusFilter === "ALL" ? "All statuses" : statusFilter}
              >
                {statusOptions.map((status) => (
                  <FilterOption
                    key={status}
                    active={statusFilter === status}
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === "ALL" ? "All statuses" : status}
                  </FilterOption>
                ))}
              </FilterGroup>

              <FilterGroup
                icon={
                  <CalendarClock
                    aria-hidden="true"
                    className="h-[18px] w-[18px]"
                  />
                }
                label="Recent elections"
                value={formatRecentElectionFilter(recentElectionCount)}
              >
                {RECENT_OPTIONS.map((option) => (
                  <FilterOption
                    key={option}
                    active={recentElectionCount === option}
                    onClick={() => setRecentElectionCount(option)}
                  >
                    {formatRecentElectionFilter(option)}
                  </FilterOption>
                ))}
              </FilterGroup>

              <FilterGroup
                icon={<Archive aria-hidden="true" className="h-[18px] w-[18px]" />}
                label="Archive scope"
                value={ARCHIVE_SCOPE_LABELS[archiveScope]}
              >
                {ARCHIVE_SCOPE_OPTIONS.map((option) => (
                  <FilterOption
                    key={option}
                    active={archiveScope === option}
                    onClick={() => setArchiveScope(option)}
                  >
                    {ARCHIVE_SCOPE_LABELS[option]}
                  </FilterOption>
                ))}
              </FilterGroup>
            </div>
          </FilterPanel>

          <AccordionCard
            title="Elections"
            meta={
              <span className="text-[11px] text-white/45">
                {filteredElections.length} of {activeScopedTotal} shown
              </span>
            }
            defaultOpen={shouldOpenActive}
            noPad
          >
            <DataTable
              rows={filteredElections}
              getRowKey={(election) => election.id}
              mobile="stack"
              empty={
                <EmptyState
                  title="No elections match"
                  hint="Try a different search, status, or recent-election filter."
                />
              }
              columns={[
                {
                  key: "name",
                  header: "Election",
                  priority: 1,
                  render: (election) => (
                    <div className="min-w-[0px]">
                      <p className="truncate text-[13px] font-medium text-white/80">
                        {highlightMatch(election.name, query)}
                      </p>
                      <p className="mt-px text-[11px] text-white/40">
                        {highlightMatch(
                          DIVISION_LABELS[election.division] ?? election.division,
                          query,
                        )}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  priority: 1,
                  className: "w-[112px]",
                  render: (election) => <StatusPill status={election.status} />,
                },
                {
                  key: "voters",
                  header: "Voters",
                  className: "w-[90px]",
                  render: (election) => election._count.voters.toLocaleString(),
                },
                {
                  key: "setup",
                  header: "Setup",
                  className: "w-[146px]",
                  render: (election) =>
                    `${election._count.positions} pos. · ${election._count.candidates} cand.`,
                },
                {
                  key: "turnout",
                  header: "Turnout",
                  className: "w-[101px]",
                  render: (election) =>
                    election.status === "OPEN" || election.status === "CLOSED"
                      ? `${pct(election.votedCount, election._count.voters)}%`
                      : "—",
                },
                {
                  key: "schedule",
                  header: "Schedule",
                  className: "w-[146px]",
                  render: (election) =>
                    election.status === "SCHEDULED" && election.scheduledOpen
                      ? fmt(election.scheduledOpen)
                      : "—",
                },
              ]}
              actionsClassName="w-[157px]"
              actions={(election) => (
                <div className="flex items-center justify-end gap-[4px]">
                  <Link
                    href={`/admin/elections/${election.id}/control`}
                    className="rounded-[6px] border border-gold/20 bg-gold/8 px-[8px] py-[6px] text-[11px] text-gold no-underline transition-all hover:bg-gold/15"
                  >
                    Control
                  </Link>

                  <RowActions
                    e={election}
                    onToast={onToast}
                    canLifecycle={canLifecycle}
                  />
                </div>
              )}
            />
          </AccordionCard>
        </>
      )}

      <ArchivedSection
        elections={filteredArchivedElections}
        totalCount={archivedScopedTotal}
        query={query}
        defaultOpen={shouldOpenArchived}
        onToast={onToast}
        canLifecycle={canLifecycle}
      />

      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}