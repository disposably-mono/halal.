"use client";

import { useState } from "react";
import Link from "next/link";

type ElectionStatus = "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED";
type Election = {
  id: string;
  name: string;
  division: string;
  status: ElectionStatus;
  scheduledOpen: Date | null;
  scheduledClose: Date | null;
  _count: { voters: number; votes: number; positions: number; candidates: number };
  votedCount: number;
};

const DIVISION_LABELS: Record<string, string> = {
  GS: "Grade School",
  JHS: "Junior High School",
  SHS: "Senior High School",
  HC: "House Council",
};
const STATUS_LABELS: Record<ElectionStatus, string> = {
  DRAFT: "Draft", SCHEDULED: "Scheduled", OPEN: "Open", CLOSED: "Closed",
};

function pct(voted: number, total: number) {
  return total > 0 ? Math.round((voted / total) * 100) : 0;
}
function fmt(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Status Pill ───────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: ElectionStatus }) {
  const styles: Record<ElectionStatus, string> = {
    DRAFT: "bg-white/[0.06] text-white/50",
    SCHEDULED: "bg-blue-400/[0.12] text-blue-400",
    OPEN: "bg-emerald-400/[0.12] text-emerald-400",
    CLOSED: "bg-white/[0.05] text-white/20",
  };
  const dots: Record<ElectionStatus, string> = {
    DRAFT: "bg-white/20", SCHEDULED: "bg-blue-400", OPEN: "bg-emerald-400", CLOSED: "bg-white/20",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-[7px] py-[2px] text-[10px] font-semibold ${styles[status]}`}>
      <span className={`w-1 h-1 rounded-full ${dots[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}

// ── Attention card action button ──────────────────────────────────────────────
function AttnBtn({ href, label, primary = false }: { href: string; label: string; primary?: boolean }) {
  const base = "flex-1 py-[5px] text-center text-[10px] rounded-[6px] transition-all no-underline";
  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}
      className={primary
        ? `${base} text-amber-400 bg-amber-400/10 border border-amber-400/20 hover:bg-amber-400/20`
        : `${base} text-white/40 border border-white/[0.07] hover:text-white/70 hover:border-white/[0.12]`}
    >
      {label}
    </Link>
  );
}

// ── Checklist row ─────────────────────────────────────────────────────────────
function CheckRow({ done, yes, no }: { done: boolean; yes: string; no: string }) {
  return (
    <div className="flex items-center gap-[7px] text-[10px]">
      <span className={`w-[14px] h-[14px] rounded-full border flex-shrink-0 flex items-center justify-center
        ${done ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-400" : "border-white/[0.12] text-white/[0.14]"}`}>
        {done
          ? <svg style={{ width: 8, height: 8 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          : <svg style={{ width: 8, height: 8 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        }
      </span>
      <span className="text-white/70">{done ? yes : no}</span>
    </div>
  );
}

// ── Attention Card ────────────────────────────────────────────────────────────
function AttnCard({ e }: { e: Election }) {
  const p = pct(e.votedCount, e._count.voters);
  const topColors: Record<ElectionStatus, string> = {
    OPEN: "#34d399", SCHEDULED: "#60a5fa",
    DRAFT: "rgba(255,255,255,0.15)", CLOSED: "rgba(255,255,255,0.07)",
  };
  const subtitles: Record<ElectionStatus, string> = {
    OPEN: "Active election", SCHEDULED: "Upcoming",
    DRAFT: "Not published", CLOSED: "Ended",
  };

  return (
    <div className="bg-[#1a2540] border border-white/[0.07] rounded-[11px] p-[14px] flex flex-col gap-[10px]
      relative overflow-hidden hover:border-white/[0.12] hover:bg-[#1e2a47] transition-all">
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: topColors[e.status] }} />

      {/* Header */}
      <div className="flex items-start justify-between gap-[6px]">
        <div>
          <div className="text-[11px] font-semibold text-white/90">{DIVISION_LABELS[e.division] ?? e.division}</div>
          <div className="text-[10px] text-white/40 mt-[1px]">{subtitles[e.status]}</div>
        </div>
        <StatusPill status={e.status} />
      </div>

      {/* OPEN */}
      {e.status === "OPEN" && (
        <>
          <div>
            <div className="text-[22px] font-bold tracking-[-0.5px] leading-none">
              {e.votedCount}<span className="text-[14px] text-white/[0.14] font-normal"> / {e._count.voters}</span>
            </div>
            <div className="text-[10px] text-white/40 mt-[2px]">voters who have voted</div>
          </div>
          <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${p}%` }} />
          </div>
          <div className="flex justify-between">
            <span className="text-[11px] text-emerald-400 font-semibold">{p}% turnout</span>
            <span className="text-[10px] text-white/40">{e._count.voters - e.votedCount} remaining</span>
          </div>
          <div className="flex gap-[5px] border-t border-white/[0.07] pt-2">
            <AttnBtn href="/admin/results" label="Results" />
            <AttnBtn href={`/admin/elections/${e.id}/control`} label="⚡ Control" primary />
          </div>
        </>
      )}

      {/* SCHEDULED */}
      {e.status === "SCHEDULED" && (
        <>
          <div>
            <div className="text-[16px] font-semibold text-blue-400 leading-snug">{fmt(e.scheduledOpen)}</div>
            <div className="text-[10px] text-white/40 mt-[2px]">scheduled open</div>
          </div>
          <div className="text-[10px] text-white/40">{e._count.voters} voters registered</div>
          <div className="flex gap-[5px] border-t border-white/[0.07] pt-2">
            <AttnBtn href={`/admin/elections/${e.id}/voters`} label="Voters" />
            <AttnBtn href={`/admin/elections/${e.id}/candidates`} label="Candidates" />
            <AttnBtn href={`/admin/elections/${e.id}/control`} label="⚡ Control" primary />
          </div>
        </>
      )}

      {/* DRAFT */}
      {e.status === "DRAFT" && (
        <>
          <div className="inline-flex items-center gap-1 bg-amber-400/10 text-amber-400/80 rounded-[5px] px-[6px] py-[3px] text-[10px] font-medium w-fit">
            <svg style={{ width: 11, height: 11 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Needs setup
          </div>
          <div className="flex flex-col gap-[5px]">
            <CheckRow done={e._count.voters > 0} yes={`${e._count.voters} voters added`} no="Add voters" />
            <CheckRow done={e._count.positions > 0} yes="Candidates set" no="Add candidates" />
          </div>
          <div className="flex gap-[5px] border-t border-white/[0.07] pt-2">
            <AttnBtn href={`/admin/elections/${e.id}/voters`} label="Voters" />
            <AttnBtn href={`/admin/elections/${e.id}/candidates`} label="Candidates" />
            <AttnBtn href={`/admin/elections/${e.id}/control`} label="⚡ Control" primary />
          </div>
        </>
      )}

      {/* CLOSED */}
      {e.status === "CLOSED" && (
        <>
          <div>
            <div className="text-[22px] font-bold tracking-[-0.5px] leading-none">{p}%</div>
            <div className="text-[10px] text-white/40 mt-[2px]">final turnout · {e.votedCount} of {e._count.voters}</div>
          </div>
          <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-white/20 rounded-full" style={{ width: `${p}%` }} />
          </div>
          <div className="flex gap-[5px] border-t border-white/[0.07] pt-2">
            <AttnBtn href="/admin/results" label="Results" />
            <AttnBtn href={`/admin/elections/${e.id}/control`} label="⚡ Control" primary />
          </div>
        </>
      )}
    </div>
  );
}

// ── All Elections compact row ─────────────────────────────────────────────────
function ElectionRow({ e }: { e: Election }) {
  const p = pct(e.votedCount, e._count.voters);
  const showProg = e.status === "OPEN" || e.status === "CLOSED";

  return (
    <div className="flex items-center gap-3 px-[14px] py-[10px] border-b border-white/[0.04] last:border-0 hover:bg-white/[0.025] transition-colors group">
      <StatusPill status={e.status} />

      {/* Name + division */}
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-white/80 truncate group-hover:text-white/90 transition-colors">{e.name}</div>
        <div className="text-[10px] text-white/30 mt-[1px]">{DIVISION_LABELS[e.division] ?? e.division}</div>
      </div>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-4 flex-shrink-0 text-[10px] text-white/40">
        <span className="flex items-center gap-[5px]">
          <svg style={{ width: 10, height: 10 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
          {e._count.voters.toLocaleString()}
        </span>
        <span className="flex items-center gap-[5px]">
          <svg style={{ width: 10, height: 10 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
          {e._count.candidates} cand.
        </span>
        <span className="flex items-center gap-[5px]">
          <svg style={{ width: 10, height: 10 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
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

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0">
        {(e.status === "DRAFT" || e.status === "SCHEDULED") && (
          <>
            <Link href={`/admin/elections/${e.id}/voters`}
              className="text-[10px] text-white/40 border border-white/[0.07] rounded-[5px] px-[7px] py-[3px] hover:text-white/70 hover:border-white/[0.12] transition-all no-underline">
              Voters
            </Link>
            <Link href={`/admin/elections/${e.id}/candidates`}
              className="text-[10px] text-white/40 border border-white/[0.07] rounded-[5px] px-[7px] py-[3px] hover:text-white/70 hover:border-white/[0.12] transition-all no-underline">
              Candidates
            </Link>
          </>
        )}
        {(e.status === "OPEN" || e.status === "CLOSED") && (
          <Link href="/admin/results"
            className="text-[10px] text-white/40 border border-white/[0.07] rounded-[5px] px-[7px] py-[3px] hover:text-white/70 hover:border-white/[0.12] transition-all no-underline">
            Results
          </Link>
        )}
        <Link href={`/admin/elections/${e.id}/control`}
          className="text-[10px] text-amber-400 bg-amber-400/[0.08] border border-amber-400/20 rounded-[5px] px-[7px] py-[3px] hover:bg-amber-400/[0.15] transition-all no-underline">
          ⚡ Control
        </Link>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DashboardClient({
  elections,
  globalVoterCount,
}: {
  elections: Election[];
  globalVoterCount: number;
}) {
  const [allOpen, setAllOpen] = useState(true);

  const byStatus = (s: ElectionStatus) => elections.filter((e) => e.status === s).length;
  const openC = byStatus("OPEN");
  const draftC = byStatus("DRAFT");
  const scheduledC = byStatus("SCHEDULED");
  const closedC = byStatus("CLOSED");

  const statusBreakdown = [
    openC > 0 && `${openC} open`,
    scheduledC > 0 && `${scheduledC} scheduled`,
    draftC > 0 && `${draftC} drafted`,
    closedC > 0 && `${closedC} closed`,
  ].filter(Boolean).join(" · ");

  const activeNames = elections
    .filter((e) => e.status === "OPEN")
    .map((e) => e.name)
    .join(", ") || "None active";

  const closedWithVoters = elections.filter((e) => e.status === "CLOSED" && e._count.voters > 0);
  const avgTurnout = closedWithVoters.length
    ? Math.round(closedWithVoters.reduce((a, e) => a + pct(e.votedCount, e._count.voters), 0) / closedWithVoters.length)
    : null;

  const attnOrder: ElectionStatus[] = ["OPEN", "SCHEDULED", "DRAFT", "CLOSED"];
  const attnElections = [...elections].sort(
    (a, b) => attnOrder.indexOf(a.status) - attnOrder.indexOf(b.status)
  );

  return (
    <>
      {/* Page header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-white/90">Elections Dashboard</h1>
          <p className="text-[12px] text-white/40 mt-[3px]">{elections.length} elections · {openC} active now</p>
        </div>
        <Link href="/admin/elections/new"
          className="inline-flex items-center gap-[5px] rounded-[7px] px-[13px] py-[7px] text-[12px] font-semibold bg-amber-400 text-[#0b1220] hover:opacity-90 transition-all no-underline">
          <svg style={{ width: 11, height: 11 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Election
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-[10px]">
        {/* 1 — Total Elections */}
        <div className="bg-[#1a2540] border border-white/[0.07] rounded-[10px] px-4 py-[14px] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-400" />
          <div className="text-[10px] text-white/40 uppercase tracking-[0.06em] font-medium">Total Elections</div>
          <div className="text-[26px] font-bold tracking-[-1px] leading-none mt-2 text-white/90">{elections.length}</div>
          <div className="text-[10px] text-white/30 mt-1 truncate" title={statusBreakdown}>
            {statusBreakdown || "No elections yet"}
          </div>
        </div>

        {/* 2 — Active Now */}
        <div className="bg-[#1a2540] border border-white/[0.07] rounded-[10px] px-4 py-[14px] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-400" />
          <div className="text-[10px] text-white/40 uppercase tracking-[0.06em] font-medium">Active Now</div>
          <div className={`text-[26px] font-bold tracking-[-1px] leading-none mt-2 ${openC > 0 ? "text-emerald-400" : "text-white/90"}`}>{openC}</div>
          <div className="text-[10px] text-white/30 mt-1 truncate" title={activeNames}>{activeNames}</div>
        </div>

        {/* 3 — Total Voters */}
        <div className="bg-[#1a2540] border border-white/[0.07] rounded-[10px] px-4 py-[14px] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-400" />
          <div className="text-[10px] text-white/40 uppercase tracking-[0.06em] font-medium">Total Voters</div>
          <div className="text-[26px] font-bold tracking-[-1px] leading-none mt-2 text-white/90">{globalVoterCount.toLocaleString()}</div>
          <div className="text-[10px] text-white/30 mt-1">unique control numbers</div>
        </div>

        {/* 4 — Avg Final Turnout */}
        <div className="bg-[#1a2540] border border-white/[0.07] rounded-[10px] px-4 py-[14px] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-400/50" />
          <div className="text-[10px] text-white/40 uppercase tracking-[0.06em] font-medium">Avg. Final Turnout</div>
          <div className="text-[26px] font-bold tracking-[-1px] leading-none mt-2 text-white/90">
            {avgTurnout !== null ? `${avgTurnout}%` : "—"}
          </div>
          <div className="text-[10px] text-white/30 mt-1">
            {closedWithVoters.length > 0
              ? `from ${closedWithVoters.length} closed election${closedWithVoters.length > 1 ? "s" : ""}`
              : "no closed elections yet"}
          </div>
        </div>
      </div>

      {/* Attention strip */}
      {attnElections.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/[0.14] mb-2">
            Active &amp; Upcoming
          </div>
          <div className="grid gap-[10px]" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
            {attnElections.map((e) => <AttnCard key={e.id} e={e} />)}
          </div>
        </div>
      )}

      {/* Empty state */}
      {elections.length === 0 && (
        <div className="bg-[#1a2540] border border-white/[0.07] rounded-[12px] flex flex-col items-center gap-[10px] py-12 text-center">
          <div className="w-10 h-10 rounded-[10px] border border-white/[0.07] flex items-center justify-center text-white/20">
            <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="text-[13px] font-medium text-white/50">No elections yet</div>
          <div className="text-[11px] text-white/30">Create your first election to get started</div>
          <Link href="/admin/elections/new" className="mt-1 text-[11px] text-amber-400 hover:opacity-80 transition-all no-underline">
            Create election →
          </Link>
        </div>
      )}

      {/* All Elections table */}
      {elections.length > 0 && (
        <div className="bg-[#1a2540] border border-white/[0.07] rounded-[12px] overflow-hidden">
          <button
            onClick={() => setAllOpen((v) => !v)}
            className="flex items-center gap-2 px-[14px] py-[10px] cursor-pointer border-b border-white/[0.07] bg-transparent w-full hover:bg-white/[0.025] transition-colors"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/40 flex-1 text-left">All Elections</span>
            <span className="text-[10px] bg-white/[0.06] text-white/40 rounded-full px-[7px] py-[1px]">{elections.length}</span>
            <svg className={`w-3 h-3 text-white/40 ml-[6px] transition-transform duration-200 ${allOpen ? "rotate-180" : ""}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {allOpen && elections.map((e) => <ElectionRow key={e.id} e={e} />)}
        </div>
      )}
    </>
  );
}
