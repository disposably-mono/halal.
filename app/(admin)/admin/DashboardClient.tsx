"use client";

import Link from "next/link";
import { useState } from "react";
import { AttnCard } from "./_components/AttnCard";
import { ElectionRow } from "./_components/ElectionRow";
import { ArchivedSection } from "./_components/ArchivedSection";
import { Toast } from "@/components/admin/ui";
import { pct, type Election, type ElectionStatus } from "./_components/shared";

export default function DashboardClient({
  elections,
  uniqueStudentCount,
  totalRegistrations,
  archivedElections,
  canLifecycle,
}: {
  elections: Election[];
  uniqueStudentCount: number;
  totalRegistrations: number;
  archivedElections: Election[];
  canLifecycle: boolean;
}) {
  const [allOpen, setAllOpen] = useState(true);
  const [toast, setToast] = useState<{ msg: string; color: "green" | "red" } | null>(null);

  function onToast(msg: string, ok: boolean) {
    setToast({ msg, color: ok ? "green" : "red" });
    setTimeout(() => setToast(null), 2500);
  }

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

  const openElections = elections.filter((e) => e.status === "OPEN");
  const activeNames = openElections.map((e) => e.name).join(", ") || "None active";

  // Live turnout across all currently-open elections (voters who have cast a ballot).
  const openVoters = openElections.reduce((a, e) => a + e._count.voters, 0);
  const openVoted = openElections.reduce((a, e) => a + e.votedCount, 0);
  const activeTurnout = pct(openVoted, openVoters);

  const closedWithVoters = elections.filter((e) => e.status === "CLOSED" && e._count.voters > 0);
  const avgTurnout = closedWithVoters.length
    ? Math.round(closedWithVoters.reduce((a, e) => a + pct(e.votedCount, e._count.voters), 0) / closedWithVoters.length)
    : null;

  // Total ballots cast across every election (each voter votes at most once).
  const totalBallotsCast = elections.reduce((a, e) => a + e.votedCount, 0);

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
          <p className="text-[12px] text-white/50 mt-[3px]">{elections.length} elections · {openC} active now</p>
        </div>
        {canLifecycle && (
          <Link href="/admin/elections/new"
            className="inline-flex items-center gap-[5px] rounded-[7px] px-[13px] py-[7px] text-[12px] font-semibold bg-amber-400 text-[#0b1220] hover:opacity-90 transition-all no-underline">
            <svg style={{ width: 11, height: 11 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Election
          </Link>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-[10px]">
        <div className="bg-[#1a2540] border border-white/[0.07] rounded-[10px] px-4 py-[14px] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-400" />
          <div className="text-[10px] text-white/50 uppercase tracking-[0.06em] font-medium">Total Elections</div>
          <div className="text-[26px] font-bold tracking-[-1px] leading-none mt-2 text-white/90">{elections.length}</div>
          <div className="text-[10px] text-white/40 mt-1 truncate" title={statusBreakdown}>
            {statusBreakdown || "No elections yet"}
          </div>
        </div>
        <div className="bg-[#1a2540] border border-white/[0.07] rounded-[10px] px-4 py-[14px] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-400" />
          <div className="text-[10px] text-white/50 uppercase tracking-[0.06em] font-medium">Active Now</div>
          <div className={`text-[26px] font-bold tracking-[-1px] leading-none mt-2 ${openC > 0 ? "text-emerald-400" : "text-white/90"}`}>{openC}</div>
          <div className="text-[10px] text-white/40 mt-1 truncate" title={activeNames}>
            {openC > 0 ? `${activeNames} · ${activeTurnout}% voted` : "None active"}
          </div>
        </div>
        <div className="bg-[#1a2540] border border-white/[0.07] rounded-[10px] px-4 py-[14px] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-400" />
          <div className="text-[10px] text-white/50 uppercase tracking-[0.06em] font-medium">Registered Voters</div>
          <div className="text-[26px] font-bold tracking-[-1px] leading-none mt-2 text-white/90">{uniqueStudentCount.toLocaleString()}</div>
          <div className="text-[10px] text-white/40 mt-1 truncate" title={`${totalRegistrations.toLocaleString()} roster entries across ${elections.length} election${elections.length === 1 ? "" : "s"}`}>
            {uniqueStudentCount === totalRegistrations
              ? "unique students"
              : `unique students · ${totalRegistrations.toLocaleString()} registrations`}
          </div>
        </div>
        <div className="bg-[#1a2540] border border-white/[0.07] rounded-[10px] px-4 py-[14px] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-400/50" />
          <div className="text-[10px] text-white/50 uppercase tracking-[0.06em] font-medium">Avg. Final Turnout</div>
          <div className="text-[26px] font-bold tracking-[-1px] leading-none mt-2 text-white/90">
            {avgTurnout !== null ? `${avgTurnout}%` : "—"}
          </div>
          <div className="text-[10px] text-white/40 mt-1 truncate">
            {totalBallotsCast.toLocaleString()} ballot{totalBallotsCast === 1 ? "" : "s"} cast
            {closedWithVoters.length > 0
              ? ` · ${closedWithVoters.length} closed`
              : ""}
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
          <div className="w-10 h-10 rounded-[10px] border border-white/[0.07] flex items-center justify-center text-white/30">
            <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="text-[13px] font-medium text-white/60">No active elections</div>
          <div className="text-[11px] text-white/40">
            {canLifecycle
              ? "Create an election or restore one from the archive"
              : "No elections are currently active"}
          </div>
          {canLifecycle && (
            <Link href="/admin/elections/new" className="mt-1 text-[11px] text-amber-400 hover:opacity-80 transition-all no-underline">
              Create election →
            </Link>
          )}
        </div>
      )}

      {/* All Elections table */}
      {elections.length > 0 && (
        <div className="bg-[#1a2540] border border-white/[0.07] rounded-[12px] overflow-hidden">
          <button
            onClick={() => setAllOpen((v) => !v)}
            className="flex items-center gap-2 px-[14px] py-[10px] cursor-pointer border-b border-white/[0.07] bg-transparent w-full hover:bg-white/[0.025] transition-colors"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/50 flex-1 text-left">All Elections</span>
            <span className="text-[10px] bg-white/[0.06] text-white/50 rounded-full px-[7px] py-[1px]">{elections.length}</span>
            <svg className={`w-3 h-3 text-white/50 ml-[6px] transition-transform duration-200 ${allOpen ? "rotate-180" : ""}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {allOpen && elections.map((e) => (
            <ElectionRow key={e.id} e={e} onToast={onToast} canLifecycle={canLifecycle} />
          ))}
        </div>
      )}

      {/* Archived elections */}
      <ArchivedSection elections={archivedElections} onToast={onToast} canLifecycle={canLifecycle} />

      {toast && <Toast msg={toast.msg} color={toast.color} />}
    </>
  );
}
