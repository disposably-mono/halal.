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
    <section className="overflow-hidden rounded-[16px] border border-white/8 bg-admin-surface shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between gap-[13px] border-b border-white/[0.07] px-[18px] py-[13px]">
        <div className="flex min-w-[0px] items-center gap-[11px]">
          <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[9px] border border-gold/20 bg-gold/8 text-gold">
            <Filter aria-hidden="true" className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-[0px]">
            <h2 className="truncate text-[17px] font-semibold tracking-normal text-white/90">{title}</h2>
            {meta && <p className="mt-[2px] text-[11px] text-white/40">{meta}</p>}
          </div>
        </div>
      </div>
      <div className="space-y-[13px] px-[18px] py-[13px]">{children}</div>
    </section>
  );
}

export function FilterGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 items-start gap-[13px] lg:grid-cols-2">{children}</div>;
}

export function FilterGroup({
  icon,
  label,
  value,
  children,
  defaultOpen = true,
  className,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  children: ReactNode;
  /** Groups start expanded (matching prior always-visible behavior) unless opted out. */
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className={cn("overflow-hidden rounded-[9px] border border-white/10 bg-white/2.5", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={contentId}
        className={cn(
          "flex w-full items-center justify-between gap-[13px] px-[13px] py-[13px] text-left outline-hidden transition-colors",
          "hover:bg-white/3 focus-visible:bg-white/3 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/40",
          open && "border-b border-white/6",
        )}
      >
        <div className="flex min-w-[0px] items-center gap-[11px]">
          <span className="shrink-0 text-gold/80">{icon}</span>
          <div className="min-w-[0px]">
            <p className="text-[11px] uppercase tracking-[0.08em] text-white/35">{label}</p>
            <p className="mt-[2px] truncate text-[13px] font-medium text-white/80">{value}</p>
          </div>
        </div>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-[18px] w-[18px] shrink-0 text-white/35 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      <AnimatedCollapse id={contentId} open={open}>
        <div className="flex flex-wrap gap-[7px] p-[13px]">{children}</div>
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
        "inline-flex min-h-[40px] items-center gap-[9px] rounded-[8px] border px-[13px] text-[12px] font-medium transition-colors",
        active
          ? "border-gold/45 bg-gold/13 text-gold shadow-[inset_0_0_0_1px_rgba(245,197,66,0.10)]"
          : "border-white/8 bg-admin-bg/40 text-white/55 hover:border-white/16 hover:text-white/78",
      )}
    >
      <span
        className={cn(
          "flex h-[18px] w-[18px] items-center justify-center rounded-[4px] border",
          active ? "border-gold bg-gold text-admin-bg" : "border-white/[0.14] bg-white/3",
        )}
      >
        {active && <Check aria-hidden="true" className="h-[13px] w-[13px]" />}
      </span>
      {children}
    </button>
  );
}
