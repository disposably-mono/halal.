"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  priority?: 1 | 2;
  className?: string;
  cellClassName?: string;
};

export function DataTable<T>({
  rows,
  columns,
  getRowKey,
  actions,
  mobile = "scroll",
  empty,
}: {
  rows: readonly T[];
  columns: readonly DataTableColumn<T>[];
  getRowKey: (row: T) => string;
  actions?: (row: T) => ReactNode;
  mobile?: "scroll" | "stack";
  empty?: ReactNode;
}) {
  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className={cn(mobile === "scroll" && "overflow-x-auto")}>
      {mobile === "stack" && (
        <div className="grid gap-2 md:hidden">
          {rows.map((row) => (
            <DataTableCard key={getRowKey(row)} row={row} columns={columns} actions={actions} />
          ))}
        </div>
      )}
      <table className={cn("w-full", mobile === "stack" && "hidden md:table")}>
        <thead>
          <tr className="border-b border-white/6">
            {columns.map((column) => (
              <th key={column.key} className={cn("px-4 py-[7px] text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-white/35", column.className)}>
                {column.header}
              </th>
            ))}
            {actions && <th className="px-4 py-[7px] text-right text-[10px] font-semibold uppercase tracking-[0.06em] text-white/35">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="border-b border-white/4 last:border-0">
              {columns.map((column) => (
                <td key={column.key} className={cn("px-4 py-[10px] text-[12px] text-white/70", column.cellClassName)}>
                  {column.render(row)}
                </td>
              ))}
              {actions && <td className="px-4 py-[10px] text-right">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DataTableCard<T>({
  row,
  columns,
  actions,
}: {
  row: T;
  columns: readonly DataTableColumn<T>[];
  actions?: (row: T) => ReactNode;
}) {
  const primary = columns.filter((column) => column.priority === 1);
  const secondary = columns.filter((column) => column.priority !== 1);

  return (
    <div className="rounded-[8px] border border-white/[0.07] bg-white/3 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          {primary.map((column) => <div key={column.key}>{column.render(row)}</div>)}
        </div>
        {actions && <div className="shrink-0">{actions(row)}</div>}
      </div>
      {secondary.length > 0 && (
        <dl className="mt-3 grid gap-2">
          {secondary.map((column) => (
            <div key={column.key} className="flex items-center justify-between gap-3 text-[11px]">
              <dt className="text-white/35">{column.header}</dt>
              <dd className="text-right text-white/65">{column.render(row)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
