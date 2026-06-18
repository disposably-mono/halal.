"use client";

import { STATUS_LABELS, type ElectionStatus } from "./shared";

export function StatusPill({ status }: { status: ElectionStatus }) {
  const styles: Record<ElectionStatus, string> = {
    DRAFT: "bg-white/[0.06] text-white/60",
    SCHEDULED: "bg-blue-400/[0.12] text-blue-400",
    OPEN: "bg-emerald-400/[0.12] text-emerald-400",
    CLOSED: "bg-white/[0.05] text-white/30",
  };
  const dots: Record<ElectionStatus, string> = {
    DRAFT: "bg-white/20",
    SCHEDULED: "bg-blue-400",
    OPEN: "bg-emerald-400",
    CLOSED: "bg-white/20",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-[7px] py-[2px] text-[10px] font-semibold ${styles[status]}`}>
      <span className={`w-1 h-1 rounded-full ${dots[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}
