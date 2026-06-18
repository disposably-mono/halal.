"use client";

import Link from "next/link";
import { StatusPill } from "./StatusPill";
import { DIVISION_LABELS, fmt, pct, type Election } from "./shared";

export function ElectionRow({ e }: { e: Election }) {
  const p = pct(e.votedCount, e._count.voters);
  const showProg = e.status === "OPEN" || e.status === "CLOSED";

  const ghostBtn = "text-[10px] text-white/50 border border-white/[0.07] rounded-[5px] px-[7px] py-[3px] hover:text-white/70 hover:border-white/[0.12] transition-all no-underline";
  const amberBtn = "text-[10px] text-amber-400 bg-amber-400/[0.08] border border-amber-400/20 rounded-[5px] px-[7px] py-[3px] hover:bg-amber-400/[0.15] transition-all no-underline";
  const emeraldBtn = "text-[10px] text-emerald-400 bg-emerald-400/[0.06] border border-emerald-400/20 rounded-[5px] px-[7px] py-[3px] hover:bg-emerald-400/[0.12] transition-all no-underline";

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

      {/* Actions — all 4 always visible */}
      <div className="flex gap-1 flex-shrink-0">
        <Link href={`/admin/elections/${e.id}/voters`} className={ghostBtn}>Voters</Link>
        <Link href={`/admin/elections/${e.id}/candidates`} className={ghostBtn}>Candidates</Link>
        {(e.status === "OPEN" || e.status === "CLOSED") && (
          <Link href={`/admin/elections/${e.id}/monitor`} className={emeraldBtn}>Monitor</Link>
        )}
        {(e.status === "DRAFT" || e.status === "SCHEDULED") && (
          <Link href="/admin/results" className={ghostBtn}>Results</Link>
        )}
        {(e.status === "OPEN" || e.status === "CLOSED") && (
          <Link href="/admin/results" className={ghostBtn}>Results</Link>
        )}
        <Link href={`/admin/elections/${e.id}/control`} className={amberBtn}>⚡ Control</Link>
      </div>
    </div>
  );
}
