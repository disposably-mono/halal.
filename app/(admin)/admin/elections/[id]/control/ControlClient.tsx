"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  openElectionNow,
  closeElectionNow,
  rescheduleElection,
  advanceToScheduled,
} from "./actions";
import {
  Card,
  INPUT_BASE,
  BTN_PRIMARY,
  BTN_GHOST,
  BTN_EMERALD,
  BTN_BLUE,
  BTN_RED,
  StatusPill,
  FlowTrack,
  AdminBadge,
  AutoBadge,
  WarnBanner,
  ErrorBanner,
  StatCell,
  ConfirmDialog,
  Toast,
} from "@/app/admin/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIVISION_LABELS: Record<string, string> = {
  GS: "Grade School",
  JHS: "Junior High School",
  SHS: "Senior High School",
  HC: "House Council",
};

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
  return new Date(d).toISOString().slice(0, 16);
}

type DlgType = "open" | "close" | "reschedule" | "advance" | null;

interface DlgConfig {
  title: string;
  body: string;
  confirmLabel: string;
  confirmClass: string;
  iconBg: string;
  icon: React.ReactNode;
}

function getDlgConfig(type: DlgType, voted: number, total: number): DlgConfig {
  const pct = total > 0 ? Math.round((voted / total) * 100) : 0;

  const icons = {
    open: (
      <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
      </svg>
    ),
    close: (
      <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <rect x="6" y="6" width="12" height="12" rx="2" />
      </svg>
    ),
    calendar: (
      <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  };

  switch (type) {
    case "open":
      return {
        title: "Open election now?",
        body: "This will immediately open the election for voting, overriding the scheduled open time. This action is irreversible and will be logged.",
        confirmLabel: "Open Election",
        confirmClass: BTN_EMERALD,
        iconBg: "bg-emerald-400/[0.12] text-emerald-400",
        icon: icons.open,
      };
    case "close":
      return {
        title: "Close election now?",
        body: `This will immediately stop all voting. ${voted} of ${total} voters (${pct}%) have voted so far. This cannot be undone.`,
        confirmLabel: "Close Election",
        confirmClass: BTN_RED,
        iconBg: "bg-red-400/[0.12] text-red-400",
        icon: icons.close,
      };
    case "reschedule":
      return {
        title: "Save schedule override?",
        body: "The open/close times will be updated and the scheduler will use the new values. This will be logged with your credentials.",
        confirmLabel: "Save Override",
        confirmClass: BTN_PRIMARY,
        iconBg: "bg-amber-400/[0.12] text-amber-400",
        icon: icons.calendar,
      };
    case "advance":
      return {
        title: "Advance to Scheduled?",
        body: "This will mark the election as Scheduled, enabling the auto-open scheduler. You can still override times or open manually.",
        confirmLabel: "Advance to Scheduled",
        confirmClass: BTN_BLUE,
        iconBg: "bg-blue-400/[0.12] text-blue-400",
        icon: icons.calendar,
      };
    default:
      return { title: "", body: "", confirmLabel: "", confirmClass: "", iconBg: "", icon: null };
  }
}

// ─── Audit dot colors ─────────────────────────────────────────────────────────

const DOT_COLORS: Record<string, string> = {
  OPEN: "bg-emerald-400",
  CLOSED: "bg-white/20",
  SCHEDULED: "bg-blue-400",
  DRAFT: "bg-white/30",
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function ControlClient({ election, auditLogs }: ControlClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dlg, setDlg] = useState<DlgType>(null);
  const [toast, setToast] = useState<{ msg: string; color: "green" | "red" | "amber" | "blue" } | null>(null);
  const [dtOpen, setDtOpen] = useState(toInput(election.scheduledOpen));
  const [dtClose, setDtClose] = useState(toInput(election.scheduledClose));
  const [error, setError] = useState<string | null>(null);

  const { status } = election;
  const voters = election._count.voters;
  const voted = election.votedCount;
  const pct = voters > 0 ? Math.round((voted / voters) * 100) : 0;

  function showToast(msg: string, color: "green" | "red" | "amber" | "blue") {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2500);
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
      if (!result.success) setError(result.error ?? "An error occurred");
      setDlg(null);
      router.refresh();
    });
  }

  const dlgConfig = getDlgConfig(dlg, voted, voters);

  // Context hint shown in action row
  const contextHint: Record<ElectionStatus, string> = {
    OPEN: "Election is live — close manually or let the scheduler handle it",
    CLOSED: "Election is closed. No further transitions are allowed.",
    DRAFT: "Set a schedule, then advance to Scheduled, or override to open directly.",
    SCHEDULED: "Election will open automatically at the scheduled time. Use Open Now to override.",
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-white/30">
            {DIVISION_LABELS[election.division] ?? election.division}
          </p>
          <h1 className="text-[22px] font-semibold tracking-tight text-white/90">
            {election.name}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-1">
          <StatusPill status={status} />
          <button
            onClick={() => router.push("/admin")}
            className={BTN_GHOST}
          >
            <svg style={{ width: 11, height: 11 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && <ErrorBanner message={error} />}

      {/* ── Status card ── */}
      <Card
        title="Election Status"
        meta={<FlowTrack status={status} />}
      >
        {/* Quick stats */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCell label="Scheduled Open" value={fmt(election.scheduledOpen)} mono />
          <StatCell label="Scheduled Close" value={fmt(election.scheduledClose)} mono />
          <StatCell label="Registered Voters" value={voters.toString()} />
          <div className="rounded-[8px] border border-white/[0.07] bg-white/[0.03] px-[13px] py-[10px]">
            <p className="mb-[5px] text-[9px] uppercase tracking-[0.12em] text-white/30">Turnout</p>
            <p className="text-[13px] font-semibold text-white/80">
              {voted}{" "}
              <span className="text-[11px] font-normal text-white/35">/ {voters} ({pct}%)</span>
            </p>
            <div className="mt-[6px] h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action row */}
        <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-4">
          {/* Open Now */}
          <button
            onClick={() => {
              if (status !== "SCHEDULED") return;
              setDlg("open");
            }}
            disabled={status !== "SCHEDULED" || isPending}
            className={BTN_EMERALD}
          >
            <svg style={{ width: 11, height: 11 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
            </svg>
            Open Now
          </button>

          {/* Advance to Scheduled (DRAFT only) */}
          {status === "DRAFT" && (
            <button
              onClick={() => setDlg("advance")}
              disabled={isPending}
              className={BTN_BLUE}
            >
              Advance to Scheduled
            </button>
          )}

          {/* Close Election */}
          <button
            onClick={() => {
              if (status !== "OPEN") return;
              setDlg("close");
            }}
            disabled={status !== "OPEN" || isPending}
            className={BTN_GHOST}
          >
            <svg style={{ width: 11, height: 11 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            Close Election
          </button>

          <span className="ml-1 text-[10px] text-white/[0.18]">{contextHint[status]}</span>
        </div>
      </Card>

      {/* ── Schedule override ── */}
      {status !== "CLOSED" && (
        <Card title="Override Schedule" meta={<AdminBadge />}>
          <div className="flex flex-col gap-3">
            <WarnBanner>
              Overriding times bypasses the scheduler. All changes are logged with your admin credentials and timestamp.
            </WarnBanner>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div>
                <label className="mb-[5px] block text-[10px] text-white/40">
                  Open date &amp; time
                </label>
                <input
                  type="datetime-local"
                  value={dtOpen}
                  onChange={(e) => setDtOpen(e.target.value)}
                  className={INPUT_BASE}
                />
              </div>
              <div>
                <label className="mb-[5px] block text-[10px] text-white/40">
                  Close date &amp; time
                </label>
                <input
                  type="datetime-local"
                  value={dtClose}
                  onChange={(e) => setDtClose(e.target.value)}
                  className={INPUT_BASE}
                />
              </div>
              <button
                onClick={() => setDlg("reschedule")}
                disabled={isPending}
                className={BTN_PRIMARY}
              >
                Save Override
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* ── Audit trail ── */}
      <Card title="Audit Trail" meta={<span className="text-[10px] text-white/25">{auditLogs.length} events</span>} noPad>
        {auditLogs.length === 0 ? (
          <p className="py-6 text-center text-[11px] text-white/30">No events yet</p>
        ) : (
          <div>
            {[...auditLogs].reverse().map((log) => {
              const dot = log.toStatus ? (DOT_COLORS[log.toStatus] ?? "bg-amber-400") : "bg-amber-400";
              const isAuto = log.adminEmail === "scheduler";
              return (
                <div key={log.id} className="flex items-start gap-[10px] border-b border-white/[0.04] px-4 py-[9px] last:border-0">
                  <span className={`mt-[4px] h-[7px] w-[7px] shrink-0 rounded-full ${dot}`} />
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/70">
                      {log.action}
                      {isAuto && <AutoBadge />}
                    </div>
                    <div className="mt-[2px] text-[10px] text-white/40">
                      {log.adminEmail} ·{" "}
                      {new Date(log.createdAt).toLocaleString("en-PH", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── Confirm dialog ── */}
      <ConfirmDialog
        open={dlg !== null}
        title={dlgConfig.title}
        body={dlgConfig.body}
        confirmLabel={dlgConfig.confirmLabel}
        confirmClass={dlgConfig.confirmClass}
        isPending={isPending}
        onCancel={() => setDlg(null)}
        onConfirm={confirmDlg}
        icon={
          dlg ? (
            <div className={`flex h-[38px] w-[38px] items-center justify-center rounded-[9px] ${dlgConfig.iconBg}`}>
              {dlgConfig.icon}
            </div>
          ) : undefined
        }
      />

      {/* ── Toast ── */}
      {toast && <Toast msg={toast.msg} color={toast.color} />}
    </div>
  );
}
