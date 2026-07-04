"use client";

import { useId, useState, type ReactNode } from "react";
import { Check, ChevronDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCollapse } from "./animated-collapse";

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
    <section className="overflow-hidden rounded-[14px] border border-white/8 bg-admin-surface shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-gold/20 bg-gold/8 text-gold">
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
  return <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">{children}</div>;
}

export function FilterGroup({
  icon,
  label,
  value,
  children,
  defaultOpen = true,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  children: ReactNode;
  /** Groups start expanded (matching prior always-visible behavior) unless opted out. */
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className="overflow-hidden rounded-[8px] border border-white/10 bg-white/2.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={contentId}
        className={cn(
          "flex w-full items-center justify-between gap-3 px-3 py-3 text-left outline-hidden transition-colors",
          "hover:bg-white/3 focus-visible:bg-white/3 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/40",
          open && "border-b border-white/6",
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="shrink-0 text-gold/80">{icon}</span>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.08em] text-white/35">{label}</p>
            <p className="mt-0.5 truncate text-[12px] font-medium text-white/80">{value}</p>
          </div>
        </div>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-4 w-4 shrink-0 text-white/35 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      <AnimatedCollapse id={contentId} open={open}>
        <div className="flex flex-wrap gap-1.5 p-3">{children}</div>
      </AnimatedCollapse>
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
          ? "border-gold/45 bg-gold/13 text-gold shadow-[inset_0_0_0_1px_rgba(245,197,66,0.10)]"
          : "border-white/8 bg-admin-bg/40 text-white/55 hover:border-white/16 hover:text-white/78",
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-[4px] border",
          active ? "border-gold bg-gold text-admin-bg" : "border-white/[0.14] bg-white/3",
        )}
      >
        {active && <Check aria-hidden="true" className="h-3 w-3" />}
      </span>
      {children}
    </button>
  );
}
