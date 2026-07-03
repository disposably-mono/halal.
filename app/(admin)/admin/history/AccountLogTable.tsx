"use client";

import { DataTable, EmptyState } from "@/components/admin/ui";

export type AccountLogRow = {
  id: string;
  createdAt: string;
  action: string;
  actorName: string;
  actorEmail: string;
  targetName: string;
  targetEmail: string;
  targetRole: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function AccountLogTable({ logs }: { logs: readonly AccountLogRow[] }) {
  return (
    <DataTable
      rows={logs}
      getRowKey={(entry) => entry.id}
      mobile="stack"
      empty={
        <EmptyState
          title="No account changes yet"
          hint="Account creations, role changes, credential resets, and deletions will appear here."
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
          key: "action",
          header: "Change",
          priority: 1,
          render: (entry) => (
            <div>
              <p className="text-[12px] font-medium text-white/80">{entry.action}</p>
              <p className="mt-0.5 text-[10px] text-white/45">
                {entry.targetName} ({entry.targetRole}) · {entry.targetEmail}
              </p>
            </div>
          ),
        },
        {
          key: "actor",
          header: "Performed by",
          render: (entry) => (
            <div>
              <p className="text-[12px] font-medium text-white/80">{entry.actorName}</p>
              <p className="mt-0.5 font-mono text-[10px] text-white/60">{entry.actorEmail}</p>
            </div>
          ),
        },
      ]}
    />
  );
}
