"use client";

import { DataTable, EmptyState, highlightMatch } from "@/components/admin/ui";
import { historyDateFormatter } from "./history-index";

export type LoginHistoryRow = {
  id: string;
  createdAt: string;
  officerName: string;
  officerEmail: string;
  verifierName: string;
  verifierEmail: string;
};

export function HistoryTable({ history, query }: { history: readonly LoginHistoryRow[]; query?: string }) {
  return (
    <DataTable
      rows={history}
      getRowKey={(entry) => entry.id}
      mobile="stack"
      empty={
        <EmptyState
          title="No login history yet"
          hint="Successful admin sign-ins will appear here after the first 2FA login."
        />
      }
      columns={[
        {
          key: "time",
          header: "Time",
          priority: 1,
          className: "w-[213px]",
          render: (entry) => (
            <span className="whitespace-nowrap font-mono text-[12px] text-white/45">
              {historyDateFormatter.format(new Date(entry.createdAt))}
            </span>
          ),
        },
        {
          key: "officer",
          header: "Officer logged in",
          priority: 1,
          render: (entry) => <OfficerCell name={entry.officerName} email={entry.officerEmail} query={query} />,
        },
        {
          key: "verifier",
          header: "Verified by",
          render: (entry) => <OfficerCell name={entry.verifierName} email={entry.verifierEmail} query={query} />,
        },
      ]}
    />
  );
}

function OfficerCell({ name, email, query }: { name: string; email: string; query?: string }) {
  return (
    <div>
      <p className="text-[13px] font-medium text-white/80">{highlightMatch(name, query)}</p>
      <p className="mt-[2px] font-mono text-[11px] text-white/60">{highlightMatch(email, query)}</p>
    </div>
  );
}
