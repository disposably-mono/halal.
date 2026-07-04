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
  actionsClassName,
  mobile = "scroll",
  empty,
}: {
  rows: readonly T[];
  columns: readonly DataTableColumn<T>[];
  getRowKey: (row: T) => string;
  actions?: (row: T) => ReactNode;
  actionsClassName?: string;
  mobile?: "scroll" | "stack";
  empty?: ReactNode;
}) {
  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className={cn(mobile === "scroll" && "overflow-x-auto")}>
      {mobile === "stack" && (
        <div className="grid gap-[9px] md:hidden">
          {rows.map((row) => (
            <DataTableCard key={getRowKey(row)} row={row} columns={columns} actions={actions} />
          ))}
        </div>
      )}
      {/*
        table-fixed: column widths come only from the header row (via
        column.className), not from whichever rows happen to be rendered.
        Without it, table-layout:auto recomputes each column's width from the
        current row set, so switching a show-limit/search filter (a different
        set of names/emails becomes the widest cell) visibly shifts every
        column boundary.
      */}
      <table className={cn("w-full table-fixed", mobile === "stack" && "hidden md:table")}>
        <thead>
          <tr className="border-b border-white/6">
            {columns.map((column) => (
              <th key={column.key} className={cn("px-[18px] py-[8px] text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-white/35", column.className)}>
                {column.header}
              </th>
            ))}
            {actions && <th className={cn("px-[18px] py-[8px] text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-white/35", actionsClassName)}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="border-b border-white/4 last:border-0">
              {columns.map((column) => (
                <td key={column.key} className={cn("px-[18px] py-[11px] text-[13px] text-white/70", column.cellClassName)}>
                  {column.render(row)}
                </td>
              ))}
              {actions && <td className="px-[18px] py-[11px] text-right">{actions(row)}</td>}
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
    <div className="rounded-[9px] border border-white/[0.07] bg-white/3 p-[13px]">
      <div className="flex items-start justify-between gap-[13px]">
        <div className="min-w-[0px] space-y-[4px]">
          {primary.map((column) => <div key={column.key}>{column.render(row)}</div>)}
        </div>
        {actions && <div className="shrink-0">{actions(row)}</div>}
      </div>
      {secondary.length > 0 && (
        <dl className="mt-[13px] grid gap-[9px]">
          {secondary.map((column) => (
            <div key={column.key} className="flex items-center justify-between gap-[13px] text-[12px]">
              <dt className="text-white/35">{column.header}</dt>
              <dd className="text-right text-white/65">{column.render(row)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
