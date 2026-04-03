"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  openElectionNow,
  closeElectionNow,
  rescheduleElection,
  advanceToScheduled,
} from "./actions";

// ─── Types ───────────────────────────────────────────────────────────────────
type ElectionStatus = "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED";
type AuditEntry = {
  id: string;
  action: string;
  toStatus: string | null;
  adminEmail: string;
  createdAt: Date;
};
type Election = {
  id: string;
  name: string;
  division: string;
  status: ElectionStatus;
  scheduledOpen: Date | null;
  scheduledClose: Date | null;
  _count: { voters: number; votes: number };
  votedCount: number;
};

interface ControlClientProps {
  election: Election;
  auditLogs: AuditEntry[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const DIVISION_LABELS: Record<string, string> = {
  GS: "Grade School",
  JHS: "Junior High School",
  SHS: "Senior High School",
  HC: "House Council",
};
const STATUS_LABELS: Record<ElectionStatus, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  OPEN: "Open",
  CLOSED: "Closed",
};
const STATUSES: ElectionStatus[] = ["DRAFT", "SCHEDULED", "OPEN", "CLOSED"];

function fmt(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function toInput(d: Date | null) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toISOString().slice(0, 16);
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusPill({ status }: { status: ElectionStatus }) {
  const styles: Record<ElectionStatus, string> = {
    DRAFT: "bg-white/[0.06] text-white/50",
    SCHEDULED: "bg-blue-400/[0.12] text-blue-400",
    OPEN: "bg-emerald-400/[0.12] text-emerald-400",
    CLOSED: "bg-white/[0.05] text-white/20",
  };
  const dotStyles: Record<ElectionStatus, string> = {
    DRAFT: "bg-white/20",
    SCHEDULED: "bg-blue-400",
    OPEN: "bg-emerald-400",
    CLOSED: "bg-white/20",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-[7px] py-[2px] text-[10px] font-semibold ${styles[status]}`}>
      <span className={`w-1 h-1 rounded-full ${dotStyles[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}

function FlowStep({ label, state }: { label: string; state: "done" | "active" | "future"; activeStatus: ElectionStatus }) {
  if (state === "done") return <span className="text-white/20 text-[10px] font-semibold px-2 py-1">{label}</span>;
  if (state === "future") return <span className="text-white/10 text-[10px] font-semibold px-2 py-1">{label}</span>;
  return (
    <span className="px-2 py-1 rounded-[5px] text-[10px] font-semibold border
      bg-white/[0.06] text-white/70 border-white/20">
      {label}
    </span>
  );
}

type DlgType = "open" | "close" | "reschedule" | "advance" | null;

interface DlgConfig {
  title: string;
  body: string;
  confirmLabel: string;
  confirmClass: string;
}

function getDlgConfig(type: DlgType, voted: number, total: number): DlgConfig {
  const pct = total > 0 ? Math.round((voted / total) * 100) : 0;
  switch (type) {
    case "open":
      return {
        title: "Open election now?",
        body: "This will immediately open the election for voting, overriding the scheduled open time. This action is irreversible and will be logged.",
        confirmLabel: "Open Election",
        confirmClass: "bg-emerald-400 text-[#0b1220] hover:opacity-90",
      };
    case "close":
      return {
        title: "Close election now?",
        body: `This will immediately stop all voting. ${voted} of ${total} voters (${pct}%) have voted so far. This cannot be undone.`,
        confirmLabel: "Close Election",
        confirmClass: "bg-red-400/[0.12] text-red-400 border border-red-400/25 hover:bg-red-400/20",
      };
    case "reschedule":
      return {
        title: "Save schedule override?",
        body: "The open/close times will be updated and the scheduler will use the new values. This will be logged with your credentials.",
        confirmLabel: "Save Override",
        confirmClass: "bg-amber-400 text-[#0b1220] hover:opacity-90",
      };
    case "advance":
      return {
        title: "Advance to Scheduled?",
        body: "This will mark the election as Scheduled, enabling the auto-open scheduler. You can still override times or open manually.",
        confirmLabel: "Advance to Scheduled",
        confirmClass: "bg-blue-400/[0.12] text-blue-400 border border-blue-400/25 hover:bg-blue-400/20",
      };
    default:
      return { title: "", body: "", confirmLabel: "", confirmClass: "" };
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ControlClient({ election, auditLogs }: ControlClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dlg, setDlg] = useState<DlgType>(null);
  const [toast, setToast] = useState<{ msg: string; color: string } | null>(null);
  const [dtOpen, setDtOpen] = useState(toInput(election.scheduledOpen));
  const [dtClose, setDtClose] = useState(toInput(election.scheduledClose));
  const [error, setError] = useState<string | null>(null);

  const { status } = election;
  const voters = election._count.voters;
  const voted = election.votedCount;
  const pct = voters > 0 ? Math.round((voted / voters) * 100) : 0;
  const statusIdx = STATUSES.indexOf(status);

  function showToast(msg: string, color: string) {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2500);
  }

  function handleOpen() {
    if (status === "OPEN" || status === "CLOSED" || status === "DRAFT") return;
    setDlg("open");
  }
  function handleClose() {
    if (status !== "OPEN") return;
    setDlg("close");
  }
  function handleReschedule() {
    setDlg("reschedule");
  }
  function handleAdvance() {
    if (status !== "DRAFT") return;
    setDlg("advance");
  }

  function confirmDlg() {
    if (!dlg) return;
    setError(null);
    startTransition(async () => {
      let result: { success: boolean; error?: string };
      if (dlg === "open") {
        result = await openElectionNow(election.id);
        if (result.success) showToast("Election is now OPEN", "green");
      } else if (dlg === "close") {
        result = await closeElectionNow(election.id);
        if (result.success) showToast("Election closed", "red");
      } else if (dlg === "reschedule") {
        result = await rescheduleElection(election.id, dtOpen || null, dtClose || null);
        if (result.success) showToast("Schedule updated", "amber");
      } else {
        result = await advanceToScheduled(election.id);
        if (result.success) showToast("Advanced to Scheduled", "blue");
      }
      if (!result.success) {
        setError(result.error ?? "An error occurred");
      }
      setDlg(null);
      router.refresh();
    });
  }

  const bannerStyles: Record<ElectionStatus, string> = {
    DRAFT: "bg-white/[0.04] border border-white/[0.1]",
    SCHEDULED: "bg-blue-400/[0.08] border border-blue-400/[0.22]",
    OPEN: "bg-emerald-400/[0.08] border border-emerald-400/[0.22]",
    CLOSED: "bg-white/[0.03] border border-white/[0.07]",
  };
  const bannerLabelStyles: Record<ElectionStatus, string> = {
    DRAFT: "text-white/60",
    SCHEDULED: "text-blue-400",
    OPEN: "text-emerald-400",
    CLOSED: "text-white/20",
  };
  const bannerMessages: Record<ElectionStatus, string> = {
    DRAFT: "DRAFT — not yet scheduled",
    SCHEDULED: "SCHEDULED — opens automatically",
    OPEN: "OPEN — accepting votes now",
    CLOSED: "CLOSED — election ended",
  };

  const dlgConfig = getDlgConfig(dlg, voted, voters);
  const toastColors: Record<string, string> = {
    green: "bg-emerald-400",
    red: "bg-red-400",
    amber: "bg-amber-400",
    blue: "bg-blue-400",
  };

  return (
    <div className="flex flex-col gap-[18px]">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-[5px] text-[11px] text-white/50">
        <button onClick={() => router.push("/admin")} className="hover:text-white/90 transition-colors cursor-pointer">Dashboard</button>
        <span className="opacity-40">›</span>
        <span className="text-white/70">{election.name}</span>
        <span className="opacity-40">›</span>
        <span>Control</span>
      </div>

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[20px] font-bold tracking-tight text-white/90">Election Control</h1>
            <StatusPill status={status} />
          </div>
          <p className="text-[12px] text-white/40">{election.name} — {DIVISION_LABELS[election.division] ?? election.division}</p>
        </div>
        <button
          onClick={() => router.push("/admin")}
          className="inline-flex items-center gap-[5px] rounded-[7px] px-[13px] py-[7px] text-[12px] font-semibold
            text-white/40 border border-white/[0.07] bg-transparent hover:text-white/70 hover:border-white/[0.12] transition-all"
        >
          <svg style={{ width: 11, height: 11 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </button>
      </div>

      {error && (
        <div className="bg-red-400/[0.08] border border-red-400/25 rounded-[9px] px-4 py-3 text-[12px] text-red-400">
          {error}
        </div>
      )}

      {/* ── Status Card ── */}
      <div className="bg-[#1a2540] border border-white/[0.07] rounded-[12px] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/40">Current Status</span>
          {/* Flow steps */}
          <div className="flex items-center gap-[2px]">
            {STATUSES.map((s, i) => (
              <span key={s} className="flex items-center gap-[2px]">
                {i > 0 && <span className="text-[9px] text-white/[0.12] mx-[1px]">›</span>}
                <FlowStep
                  label={STATUS_LABELS[s]}
                  state={i < statusIdx ? "done" : i === statusIdx ? "active" : "future"}
                  activeStatus={s as ElectionStatus}
                />
              </span>
            ))}
          </div>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {/* Banner */}
          <div className={`rounded-[9px] px-4 py-3 flex items-center justify-between gap-3 ${bannerStyles[status]}`}>
            <div>
              <div className="text-[12px] text-white/50">Election is</div>
              <div className={`text-[14px] font-semibold mt-[2px] ${bannerLabelStyles[status]}`}>{bannerMessages[status]}</div>
            </div>
            {status === "OPEN" && (
              <div className="flex items-center gap-[5px]">
                <span className="w-[7px] h-[7px] rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-semibold">LIVE</span>
              </div>
            )}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-[8px] px-[13px] py-[10px]">
              <div className="text-[10px] text-white/40 mb-1">Scheduled open</div>
              <div className="text-[13px] font-medium text-white/80 font-mono">{fmt(election.scheduledOpen)}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-[8px] px-[13px] py-[10px]">
              <div className="text-[10px] text-white/40 mb-1">Scheduled close</div>
              <div className="text-[13px] font-medium text-white/80 font-mono">{fmt(election.scheduledClose)}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-[8px] px-[13px] py-[10px]">
              <div className="text-[10px] text-white/40 mb-1">Registered voters</div>
              <div className="text-[13px] font-medium text-white/80 font-mono">{voters}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-[8px] px-[13px] py-[10px]">
              <div className="text-[10px] text-white/40 mb-1">Turnout</div>
              <div className="text-[12px] text-white/50 font-mono">{voted} / {voters} ({pct}%)</div>
              <div className="mt-[6px] h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>

          {/* Action row */}
          <div className="flex items-center gap-2 pt-[14px] border-t border-white/[0.07] flex-wrap">
            {/* Open Now */}
            <button
              onClick={handleOpen}
              disabled={status === "OPEN" || status === "CLOSED" || status === "DRAFT" || isPending}
              className={`inline-flex items-center gap-[5px] rounded-[7px] px-[13px] py-[7px] text-[12px] font-semibold transition-all
                bg-emerald-400 text-[#0b1220]
                ${(status === "OPEN" || status === "CLOSED" || status === "DRAFT") ? "opacity-30 cursor-not-allowed" : "hover:opacity-90 cursor-pointer"}`}
            >
              <svg style={{ width: 11, height: 11 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
              </svg>
              Open Now
            </button>

            {/* Advance to Scheduled (only for DRAFT) */}
            {status === "DRAFT" && (
              <button
                onClick={handleAdvance}
                disabled={isPending}
                className="inline-flex items-center gap-[5px] rounded-[7px] px-[13px] py-[7px] text-[12px] font-semibold
                  bg-blue-400/[0.1] text-blue-400 border border-blue-400/25 hover:bg-blue-400/20 transition-all cursor-pointer"
              >
                Advance to Scheduled
              </button>
            )}

            {/* Close Election */}
            <button
              onClick={handleClose}
              disabled={status !== "OPEN" || isPending}
              className={`inline-flex items-center gap-[5px] rounded-[7px] px-[13px] py-[7px] text-[12px] font-semibold transition-all
                bg-white/[0.06] text-white/60 border border-white/[0.12]
                ${status !== "OPEN" ? "opacity-30 cursor-not-allowed" : "hover:bg-white/[0.09] cursor-pointer"}`}
            >
              <svg style={{ width: 11, height: 11 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              Close Election
            </button>

            {/* Context hint */}
            <span className="text-[10px] text-white/[0.14] ml-1">
              {status === "OPEN" && "Election is live — close manually or let scheduler handle it"}
              {status === "CLOSED" && "Election is closed. No further transitions allowed."}
              {status === "DRAFT" && "Set a schedule then advance, or use Override Schedule to open directly."}
              {status === "SCHEDULED" && "Election will open automatically. Use Open Now to override."}
            </span>
          </div>
        </div>
      </div>

      {/* ── Schedule Override ── */}
      {status !== "CLOSED" && (
        <div className="bg-[#1a2540] border border-white/[0.07] rounded-[12px] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/40">Override Schedule</span>
            <span className="bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-[3px] text-[9px] px-[6px] py-[1px] font-semibold">Admin only</span>
          </div>
          <div className="p-4 flex flex-col gap-[10px]">
            {/* Warning */}
            <div className="flex gap-[7px] items-start bg-amber-400/[0.07] border border-amber-400/[0.18] rounded-[7px] px-3 py-[9px] text-[11px] text-amber-400/80 leading-relaxed">
              <svg style={{ width: 12, height: 12, flexShrink: 0, marginTop: 1 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Overriding times bypasses the scheduler. All changes are logged with your admin credentials and timestamp.
            </div>
            {/* Inputs */}
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
              <div className="flex flex-col gap-[5px]">
                <label className="text-[10px] text-white/40">Open date &amp; time</label>
                <input
                  type="datetime-local"
                  value={dtOpen}
                  onChange={(e) => setDtOpen(e.target.value)}
                  className="bg-white/[0.04] border border-white/[0.12] rounded-[7px] px-[9px] py-[6px] text-[11px] text-white/60
                    font-mono outline-none focus:border-blue-400/50 w-full [color-scheme:dark]"
                />
              </div>
              <div className="flex flex-col gap-[5px]">
                <label className="text-[10px] text-white/40">Close date &amp; time</label>
                <input
                  type="datetime-local"
                  value={dtClose}
                  onChange={(e) => setDtClose(e.target.value)}
                  className="bg-white/[0.04] border border-white/[0.12] rounded-[7px] px-[9px] py-[6px] text-[11px] text-white/60
                    font-mono outline-none focus:border-blue-400/50 w-full [color-scheme:dark]"
                />
              </div>
              <button
                onClick={handleReschedule}
                disabled={isPending}
                className="inline-flex items-center gap-[5px] rounded-[7px] px-[13px] py-[7px] text-[12px] font-semibold
                  bg-amber-400 text-[#0b1220] hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
              >
                Save Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Audit Trail ── */}
      <div className="bg-[#1a2540] border border-white/[0.07] rounded-[12px] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/40">Audit Trail</span>
          <span className="text-[10px] text-white/[0.14]">{auditLogs.length} events</span>
        </div>
        <div className="px-4 py-2">
          {auditLogs.length === 0 ? (
            <p className="text-[11px] text-white/30 py-4 text-center">No events yet</p>
          ) : (
            [...auditLogs].reverse().map((log) => {
              const dotColors: Record<string, string> = {
                OPEN: "bg-emerald-400",
                CLOSED: "bg-white/20",
                SCHEDULED: "bg-blue-400",
                DRAFT: "bg-white/30",
              };
              const dot = log.toStatus ? (dotColors[log.toStatus] ?? "bg-amber-400") : "bg-amber-400";
              const isAuto = log.adminEmail === "scheduler";
              return (
                <div key={log.id} className="flex items-start gap-[10px] py-[9px] border-b border-white/[0.04] last:border-0">
                  <span className={`w-[7px] h-[7px] rounded-full flex-shrink-0 mt-[4px] ${dot}`} />
                  <div>
                    <div className="text-[11px] text-white/70 font-medium flex items-center gap-1">
                      {log.action}
                      {isAuto && (
                        <span className="bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-[3px] text-[9px] px-[5px] py-[1px] font-semibold">
                          auto
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-white/40 mt-[1px]">
                      {log.adminEmail} · {new Date(log.createdAt).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Confirm Dialog ── */}
      {dlg && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]"
          onClick={(e) => { if (e.target === e.currentTarget) setDlg(null); }}
        >
          <div className="bg-[#1e2a47] border border-white/[0.12] rounded-[14px] p-[22px] max-w-[360px] w-[90%] animate-in zoom-in-95 duration-150">
            {/* Icon */}
            <div className={`w-[38px] h-[38px] rounded-[9px] flex items-center justify-center mb-3
              ${dlg === "open" ? "bg-emerald-400/[0.12]" : dlg === "close" ? "bg-red-400/[0.12]" : "bg-blue-400/[0.12]"}`}>
              {dlg === "open" && <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" /></svg>}
              {dlg === "close" && <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>}
              {(dlg === "reschedule" || dlg === "advance") && <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
            </div>
            <div className="text-[15px] font-bold text-white/90 mb-[7px]">{dlgConfig.title}</div>
            <div className="text-[12px] text-white/50 leading-relaxed mb-[18px]">{dlgConfig.body}</div>
            <div className="flex gap-[7px] justify-end">
              <button
                onClick={() => setDlg(null)}
                className="inline-flex items-center gap-[5px] rounded-[7px] px-[13px] py-[7px] text-[12px] font-semibold
                  text-white/40 border border-white/[0.07] bg-transparent hover:text-white/70 hover:border-white/[0.12] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDlg}
                disabled={isPending}
                className={`inline-flex items-center gap-[5px] rounded-[7px] px-[13px] py-[7px] text-[12px] font-semibold
                  transition-all cursor-pointer disabled:opacity-50 ${dlgConfig.confirmClass}`}
              >
                {isPending ? "Working…" : dlgConfig.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-5 right-5 bg-[#1e2a47] border border-white/[0.12] rounded-[10px] px-[14px] py-[10px]
          text-[12px] text-white/90 flex items-center gap-2 z-[9998] animate-in slide-in-from-bottom-4 duration-200 shadow-xl">
          <span className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${toastColors[toast.color] ?? "bg-white/50"}`} />
          {toast.msg}
        </div>
      )}
    </div>
  );
}
