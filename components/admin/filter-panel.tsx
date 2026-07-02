"use client";

import type { ReactNode } from "react";
import { Check, ChevronDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export function FilterPanel({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[14px] border border-white/[0.08] bg-admin-surface shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-gold/20 bg-gold/[0.08] text-gold">
            <Filter aria-hidden="true" className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold tracking-normal text-white/90">{title}</h2>
            {meta && <p className="mt-0.5 text-[10px] text-white/40">{meta}</p>}
          </div>
        </div>
      </div>
      <div className="space-y-3 px-4 py-3">{children}</div>
    </section>
  );
}

export function FilterGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">{children}</div>;
}

export function FilterGroup({
  icon,
  label,
  value,
  children,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-white/[0.10] bg-white/[0.025]">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-3 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="shrink-0 text-gold/80">{icon}</span>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.08em] text-white/35">{label}</p>
            <p className="mt-0.5 truncate text-[12px] font-medium text-white/80">{value}</p>
          </div>
        </div>
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-white/35" />
      </div>
      <div className="flex flex-wrap gap-1.5 p-3">{children}</div>
    </div>
  );
}

export function FilterOption({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-9 items-center gap-2 rounded-[7px] border px-3 text-[11px] font-medium transition-colors",
        active
          ? "border-gold/45 bg-gold/[0.13] text-gold shadow-[inset_0_0_0_1px_rgba(245,197,66,0.10)]"
          : "border-white/[0.08] bg-admin-bg/40 text-white/55 hover:border-white/[0.16] hover:text-white/78",
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-[4px] border",
          active ? "border-gold bg-gold text-admin-bg" : "border-white/[0.14] bg-white/[0.03]",
        )}
      >
        {active && <Check aria-hidden="true" className="h-3 w-3" />}
      </span>
      {children}
    </button>
  );
}
