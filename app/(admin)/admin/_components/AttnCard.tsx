"use client";

import { AttnBtn } from "./AttnBtn";
import { CheckRow } from "./CheckRow";
import { StatusPill } from "./StatusPill";
import { DIVISION_LABELS, fmt, pct, type Election, type ElectionStatus } from "./shared";

export function AttnCard({ e }: { e: Election }) {
  const p = pct(e.votedCount, e._count.voters);
  const topColors: Record<ElectionStatus, string> = {
    OPEN: "bg-emerald-400",
    SCHEDULED: "bg-blue-400",
    DRAFT: "bg-white/15",
    CLOSED: "bg-white/[0.07]",
  };
  const subtitles: Record<ElectionStatus, string> = {
    OPEN: "Active election",
    SCHEDULED: "Upcoming",
    DRAFT: "Not published",
    CLOSED: "Ended",
  };

  return (
    <div className="bg-admin-surface border border-white/[0.07] rounded-[11px] p-[14px] flex flex-col gap-[10px]
      relative overflow-hidden hover:border-white/[0.12] hover:bg-admin-raised transition-all">
      <div className={`absolute left-0 right-0 top-0 h-[2px] ${topColors[e.status]}`} />

      {/* Header */}
      <div className="flex items-start justify-between gap-[6px]">
        <div>
          <div className="text-[11px] font-semibold text-white/90">{DIVISION_LABELS[e.division] ?? e.division}</div>
          <div className="text-[10px] text-white/50 mt-[1px]">{subtitles[e.status]}</div>
        </div>
        <StatusPill status={e.status} />
      </div>

      {/* OPEN */}
      {e.status === "OPEN" && (
        <>
          <div>
            <div className="text-[22px] font-bold tracking-[-0.5px] leading-none">
              {e.votedCount}<span className="text-[14px] text-white/60 font-normal"> / {e._count.voters}</span>
            </div>
            <div className="text-[10px] text-white/50 mt-[2px]">voters who have voted</div>
          </div>
          <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${p}%` }} />
          </div>
          <div className="flex justify-between">
            <span className="text-[11px] text-emerald-400 font-semibold">{p}% turnout</span>
            <span className="text-[10px] text-white/50">{e._count.voters - e.votedCount} remaining</span>
          </div>
          <div className="grid grid-cols-2 gap-[5px] border-t border-white/[0.07] pt-2">
            <AttnBtn href="/admin/results" label="Results" />
            <AttnBtn href={`/admin/elections/${e.id}/monitor`} label="📊 Monitor" danger />
            <AttnBtn href={`/admin/elections/${e.id}/voters`} label="Voters" />
            <AttnBtn href={`/admin/elections/${e.id}/control`} label="⚡ Control" primary />
          </div>
        </>
      )}

      {/* SCHEDULED */}
      {e.status === "SCHEDULED" && (
        <>
          <div>
            <div className="text-[16px] font-semibold text-blue-400 leading-snug">{fmt(e.scheduledOpen)}</div>
            <div className="text-[10px] text-white/50 mt-[2px]">scheduled open</div>
          </div>
          <div className="text-[10px] text-white/50">{e._count.voters} voters registered</div>
          <div className="grid grid-cols-2 gap-[5px] border-t border-white/[0.07] pt-2">
            <AttnBtn href={`/admin/elections/${e.id}/voters`} label="Voters" />
            <AttnBtn href={`/admin/elections/${e.id}/candidates`} label="Candidates" />
            <AttnBtn href={`/admin/elections/${e.id}/control`} label="⚡ Control" primary />
          </div>
        </>
      )}

      {/* DRAFT */}
      {e.status === "DRAFT" && (
        <>
          <div className="inline-flex items-center gap-1 bg-gold/10 text-gold/80 rounded-[5px] px-[6px] py-[3px] text-[10px] font-medium w-fit">
            <svg style={{ width: 11, height: 11 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Needs setup
          </div>
          <div className="flex flex-col gap-[5px]">
            <CheckRow done={e._count.positions > 0} yes="Candidates set" no="Add candidates" />
            <CheckRow done={e._count.voters > 0} yes={`${e._count.voters} voters added`} no="Add voters" />
          </div>
          <div className="grid grid-cols-2 gap-[5px] border-t border-white/[0.07] pt-2">
            <AttnBtn href={`/admin/elections/${e.id}/candidates`} label="Candidates" />
            <AttnBtn href={`/admin/elections/${e.id}/voters`} label="Voters" />
            <AttnBtn href={`/admin/elections/${e.id}/control`} label="⚡ Control" primary />
          </div>
        </>
      )}

      {/* CLOSED */}
      {e.status === "CLOSED" && (
        <>
          <div>
            <div className="text-[22px] font-bold tracking-[-0.5px] leading-none">{p}%</div>
            <div className="text-[10px] text-white/50 mt-[2px]">final turnout · {e.votedCount} of {e._count.voters}</div>
          </div>
          <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-white/20 rounded-full" style={{ width: `${p}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-[5px] border-t border-white/[0.07] pt-2">
            <AttnBtn href="/admin/results" label="Results" />
            <AttnBtn href={`/admin/elections/${e.id}/monitor`} label="Monitor" />
            <AttnBtn href={`/admin/elections/${e.id}/control`} label="⚡ Control" primary />
          </div>
        </>
      )}
    </div>
  );
}
