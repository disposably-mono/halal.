"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AttnCard } from "./_components/AttnCard";
import { ArchivedSection } from "./_components/ArchivedSection";
import { RowActions } from "./_components/RowActions";
import { StatusPill } from "./_components/StatusPill";
import { DashboardLiveStats } from "./_components/DashboardLiveStats";
import {
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
  type ToastVariant,
} from "@/components/admin/ui";
import {
  buildDashboardSummary,
  filterDashboardElections,
  sortDashboardElections,
  type DashboardStatusFilter,
} from "./_components/dashboard-helpers";
import { DIVISION_LABELS, fmt, pct, type Election, type ElectionStatus } from "./_components/shared";
import { Button } from "@/components/ui/button";
import { ListFilter } from "lucide-react";

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
  const { toast, showToast, dismissToast } = useToast();

  function onToast(msg: string, variant: ToastVariant) {
    showToast({ msg, variant });
  }

  const onSearch = useCallback((value: string) => setQuery(value), []);
  const summary = buildDashboardSummary(elections, uniqueStudentCount, totalRegistrations);
  const attnOrder: ElectionStatus[] = ["OPEN", "SCHEDULED", "DRAFT", "CLOSED"];
  const attnElections = [...elections].sort(
    (a, b) => attnOrder.indexOf(a.status) - attnOrder.indexOf(b.status)
  );
  const filteredElections = useMemo(
    () => sortDashboardElections(filterDashboardElections(elections, { query, status: statusFilter })),
    [elections, query, statusFilter],
  );
  const statusOptions: DashboardStatusFilter[] = ["ALL", "OPEN", "SCHEDULED", "DRAFT", "CLOSED"];

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Elections Dashboard"
        meta={`${summary.totalElections} elections · ${summary.openCount} active now`}
        actions={canLifecycle && (
          <Button asChild variant="adminPrimary" size="adminMd">
            <Link href="/admin/elections/new">New Election</Link>
          </Button>
        )}
      />

      <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Elections" value={summary.totalElections} sub={summary.statusBreakdown || "No elections yet"} accent="gold" />
        <MetricCard label="Active Now" value={summary.openCount} sub={summary.openCount > 0 ? `${summary.activeNames} · ${summary.activeTurnout}% voted` : "None active"} accent={summary.openCount > 0 ? "emerald" : undefined} />
        <MetricCard label="Registered Voters" value={summary.uniqueStudentCount.toLocaleString()} sub={summary.uniqueStudentCount === summary.totalRegistrations ? "unique students" : `unique students · ${summary.totalRegistrations.toLocaleString()} registrations`} accent="blue" />
        <MetricCard label="Avg. Final Turnout" value={summary.avgTurnout !== null ? `${summary.avgTurnout}%` : "—"} sub={`${summary.totalBallotsCast.toLocaleString()} ballots cast${summary.closedCount > 0 ? ` · ${summary.closedCount} closed` : ""}`} accent="gold" />
      </div>

      <DashboardLiveStats elections={elections} />

      {attnElections.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/40 mb-2">
            Active &amp; Upcoming
          </div>
          <div className="grid gap-[10px]" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
            {attnElections.map((e) => <AttnCard key={e.id} e={e} />)}
          </div>
        </div>
      )}

      {elections.length === 0 && (
        <EmptyState
          title="No active elections"
          hint={canLifecycle ? "Create an election or restore one from the archive." : "No elections are currently active."}
          icon={
            <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
          action={canLifecycle && <Link href="/admin/elections/new" className="text-[11px] text-gold no-underline transition-all hover:opacity-80">Create election →</Link>}
        />
      )}

      {elections.length > 0 && (
        <>
          <FilterPanel
            title="Filter elections"
            meta={`${filteredElections.length} of ${elections.length} shown`}
          >
            <SearchInput onSearch={onSearch} placeholder="Search elections" className="sm:max-w-none" />
            <FilterGroup
              icon={<ListFilter aria-hidden="true" className="h-4 w-4" />}
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
          </FilterPanel>
          <div className="overflow-hidden rounded-[12px] border border-white/[0.07] bg-admin-surface">
          <DataTable
            rows={filteredElections}
            getRowKey={(election) => election.id}
            mobile="stack"
            empty={<EmptyState title="No elections match" hint="Try a different search or status filter." />}
            columns={[
              {
                key: "name",
                header: "Election",
                priority: 1,
                render: (election) => (
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-white/80">{election.name}</p>
                    <p className="mt-px text-[10px] text-white/40">{DIVISION_LABELS[election.division] ?? election.division}</p>
                  </div>
                ),
              },
              { key: "status", header: "Status", priority: 1, render: (election) => <StatusPill status={election.status} /> },
              { key: "voters", header: "Voters", render: (election) => election._count.voters.toLocaleString() },
              { key: "setup", header: "Setup", render: (election) => `${election._count.positions} pos. · ${election._count.candidates} cand.` },
              {
                key: "turnout",
                header: "Turnout",
                render: (election) => election.status === "OPEN" || election.status === "CLOSED"
                  ? `${pct(election.votedCount, election._count.voters)}%`
                  : "—",
              },
              {
                key: "schedule",
                header: "Schedule",
                render: (election) => election.status === "SCHEDULED" && election.scheduledOpen ? fmt(election.scheduledOpen) : "—",
              },
            ]}
            actions={(election) => (
              <div className="flex items-center justify-end gap-1">
                <Link href={`/admin/elections/${election.id}/control`} className="rounded-[5px] border border-gold/20 bg-gold/8 px-[7px] py-[5px] text-[10px] text-gold no-underline transition-all hover:bg-gold/15">
                  Control
                </Link>
                <RowActions e={election} onToast={onToast} canLifecycle={canLifecycle} />
              </div>
            )}
          />
          </div>
        </>
      )}

      <ArchivedSection elections={archivedElections} onToast={onToast} canLifecycle={canLifecycle} />

      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}
