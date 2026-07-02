"use client";

import { DataTable, EmptyState } from "@/components/admin/ui";

export type LoginHistoryRow = {
  id: string;
  createdAt: string;
  officerName: string;
  officerEmail: string;
  verifierName: string;
  verifierEmail: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function HistoryTable({ history }: { history: readonly LoginHistoryRow[] }) {
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
          render: (entry) => (
            <span className="whitespace-nowrap font-mono text-[11px] text-white/45">
              {dateFormatter.format(new Date(entry.createdAt))}
            </span>
          ),
        },
        {
          key: "officer",
          header: "Officer logged in",
          priority: 1,
          render: (entry) => <OfficerCell name={entry.officerName} email={entry.officerEmail} />,
        },
        {
          key: "verifier",
          header: "Verified by",
          render: (entry) => <OfficerCell name={entry.verifierName} email={entry.verifierEmail} />,
        },
      ]}
    />
  );
}

function OfficerCell({ name, email }: { name: string; email: string }) {
  return (
    <div>
      <p className="text-[12px] font-medium text-white/80">{name}</p>
      <p className="mt-0.5 font-mono text-[10px] text-white/60">{email}</p>
    </div>
  );
}
