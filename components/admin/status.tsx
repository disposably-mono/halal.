"use client";

import { ADMIN_STATUS_LABELS, type AdminStatus } from "./types";

const STATUSES: AdminStatus[] = ["DRAFT", "SCHEDULED", "OPEN", "CLOSED"];

export function StatusPill({ status }: { status: AdminStatus }) {
  const styles: Record<AdminStatus, string> = {
    DRAFT: "border-white/10 bg-white/5 text-white/60",
    SCHEDULED: "border-blue-400/30 bg-blue-400/8 text-blue-400",
    OPEN: "border-emerald-500/30 bg-emerald-500/8 text-emerald-400",
    CLOSED: "border-white/10 bg-white/3 text-white/60",
  };
  const dotStyles: Record<AdminStatus, string> = {
    DRAFT: "bg-white/20",
    SCHEDULED: "bg-blue-400",
    OPEN: "bg-emerald-400 animate-pulse",
    CLOSED: "bg-white/10",
  };

  return (
    <span className={`inline-flex items-center gap-[6px] rounded-full border px-[9px] py-[3px] text-[11px] font-semibold uppercase tracking-widest ${styles[status]}`}>
      <span className={`h-[7px] w-[7px] rounded-full ${dotStyles[status]}`} />
      {ADMIN_STATUS_LABELS[status]}
    </span>
  );
}

export function FlowTrack({ status }: { status: AdminStatus }) {
  const idx = STATUSES.indexOf(status);

  return (
    <div className="flex items-center gap-[3px]">
      {STATUSES.map((item, i) => {
        const state = i < idx ? "done" : i === idx ? "active" : "future";
        const isDone = state === "done";
        const isActive = state === "active";

        return (
          <span key={item} className="flex items-center gap-[3px]">
            {i > 0 && <span className="text-[10px] text-white/12">›</span>}
            {isActive ? (
              <span className="rounded-[6px] border border-white/20 bg-white/6 px-[10px] py-[3px] text-[11px] font-semibold text-white/80">
                {ADMIN_STATUS_LABELS[item]}
              </span>
            ) : (
              <span className={`px-[10px] py-[3px] text-[11px] font-semibold ${isDone ? "text-white/60" : "text-white/10"}`}>
                {ADMIN_STATUS_LABELS[item]}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
