"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const CARD_TITLE_CLASS =
  "text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50";

export function AdminCardTitle({
  className,
  children,
  as: As = "span",
}: {
  className?: string;
  children: ReactNode;
  as?: "span" | "h2" | "h3" | "h4";
}) {
  return <As className={cn(CARD_TITLE_CLASS, className)}>{children}</As>;
}

export function Card({
  title,
  meta,
  children,
  noPad,
}: {
  title?: string;
  meta?: ReactNode;
  children: ReactNode;
  noPad?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/8 bg-admin-surface">
      {title && (
        <div className="flex items-center justify-between border-b border-white/[0.07] px-[18px] py-[13px]">
          <AdminCardTitle>{title}</AdminCardTitle>
          {meta && <div className="flex items-center gap-[9px]">{meta}</div>}
        </div>
      )}
      <div className={noPad ? "" : "p-[18px]"}>{children}</div>
    </div>
  );
}

export type MetricAccent = "emerald" | "amber" | "blue" | "gold";

export function MetricCard({
  label,
  value,
  sub,
  mono,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  mono?: boolean;
  accent?: MetricAccent;
}) {
  const valColor =
    accent === "emerald" ? "text-emerald-400" :
      accent === "blue" ? "text-blue-400" :
        accent === "amber" || accent === "gold" ? "text-gold" :
          "text-white/90";

  return (
    <div className="relative overflow-hidden rounded-[9px] border border-white/[0.07] bg-white/3 px-[15px] py-[11px]">
      {accent && <div className={cn("absolute inset-x-[0px] top-[0px] h-[2px]", valColor.replace("text-", "bg-"))} />}
      <p className="mb-[6px] text-[10px] uppercase tracking-[0.12em] text-white/40">{label}</p>
      <p className={cn("text-[20px] font-bold leading-none", valColor, mono && "font-mono text-[15px]")}>
        {value}
      </p>
      {sub && <p className="mt-[6px] text-[10px] text-white/60">{sub}</p>}
    </div>
  );
}

/**
 * @deprecated Use MetricCard. Kept as a compatibility export during admin sweeps.
 */
export const StatCell = MetricCard;
