"use client";

import Link from "next/link";
import type { ToastVariant } from "@/components/admin/ui";
import { StatusPill } from "./StatusPill";
import { RowActions } from "./RowActions";
import { DIVISION_LABELS, fmt, pct, type Election } from "./shared";

export function ElectionRow({
  e,
  onToast,
  canLifecycle,
}: {
  e: Election;
  onToast: (msg: string, variant: ToastVariant) => void;
  canLifecycle: boolean;
}) {
  const p = pct(e.votedCount, e._count.voters);
  const showProg = e.status === "OPEN" || e.status === "CLOSED";

  const goldBtn = "text-[10px] text-gold bg-gold/[0.08] border border-gold/20 rounded-[5px] px-[7px] py-[3px] hover:bg-gold/[0.15] transition-all no-underline";

  return (
    <div className="flex items-center gap-3 px-[14px] py-[10px] border-b border-white/[0.04] last:border-0 hover:bg-white/[0.025] transition-colors group">
      <StatusPill status={e.status} />

      {/* Name + division */}
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-white/80 truncate group-hover:text-white/90 transition-colors">{e.name}</div>
        <div className="text-[10px] text-white/40 mt-[1px]">{DIVISION_LABELS[e.division] ?? e.division}</div>
      </div>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-4 flex-shrink-0 text-[10px] text-white/50">
        <span className="flex items-center gap-[5px]">
          <svg style={{ width: 10, height: 10 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
          {e._count.voters.toLocaleString()}
        </span>
        <span className="flex items-center gap-[5px]">
          <svg style={{ width: 10, height: 10 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          {e._count.candidates} cand.
        </span>
        <span className="flex items-center gap-[5px]">
          <svg style={{ width: 10, height: 10 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
          </svg>
          {e._count.positions} pos.
        </span>
        {showProg && (
          <span className="flex items-center gap-[6px]">
            <div className="w-9 h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${e.status === "OPEN" ? "bg-emerald-400" : "bg-white/25"}`} style={{ width: `${p}%` }} />
            </div>
            <span className="min-w-[26px] text-right">{p}%</span>
          </span>
        )}
        {e.status === "SCHEDULED" && e.scheduledOpen && (
          <span className="text-blue-400/70">{fmt(e.scheduledOpen)}</span>
        )}
      </div>

      {/* Actions — primary Control + overflow menu */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Link href={`/admin/elections/${e.id}/control`} className={goldBtn}>⚡ Control</Link>
        <RowActions e={e} onToast={onToast} canLifecycle={canLifecycle} />
      </div>
    </div>
  );
}
