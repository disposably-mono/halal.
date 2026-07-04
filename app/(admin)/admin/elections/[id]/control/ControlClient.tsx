"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, Lock, Play, RotateCcw, Square, Undo2 } from "lucide-react";
import {
  openElectionNow,
  closeElectionNow,
  rescheduleElection,
  advanceToScheduled,
  initiateRecount,
} from "./actions";
import { archiveElection, restoreElection } from "@/app/(admin)/admin/actions";
import { canArchive } from "@/lib/domain/election-state";
import {
  Card,
  StatusPill,
  FlowTrack,
  AdminBadge,
  AutoBadge,
  WarnBanner,
  ErrorBanner,
  StatCell,
  ConfirmDialog,
  Breadcrumb,
  Field,
  PageContainer,
  PageHeader,
  AdminInput,
  Toast,
  useToast,
  type ToastVariant,
} from "@/components/admin/ui";
import { Button, type buttonVariants } from "@/components/ui/button";
import { calcTurnoutPercent } from "@/lib/domain/tally";
import { DIVISION_LABELS } from "@/lib/ui/division-labels";
import { getControlSuccessToast, type ControlToastAction } from "./toast-messages";
import type { VariantProps } from "class-variance-authority";
import type { ElectionStatus } from "@prisma/client";

type AdminButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;

// ─── Types ────────────────────────────────────────────────────────────────────

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
  archivedAt: Date | null;
  archivedBy: string | null;
  _count: { voters: number; votes: number };
  votedCount: number;
  auditFingerprint: string | null;
  auditVersion: number | null;
  certification: { snapshotHash: string; createdAt: Date; createdBy: string } | null;
  recounts: Array<{
    id: string;
    createdAt: Date;
    initiatedBy: string;
    matchesOfficial: boolean;
    ballotCount: number;
    validBallots: number;
    invalidBallots: number;
    discrepancies: unknown;
  }>;
};

interface ControlClientProps {
  election: Election;
  auditLogs: AuditEntry[];
  canLifecycle: boolean;
  canClose: boolean;
  canRecount: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

type DlgType = "open" | "close" | "recount" | "reschedule" | "advance" | "archive" | "restore" | null;

interface DlgConfig {
  title: string;
  body: string;
  confirmLabel: string;
  confirmVariant: AdminButtonVariant;
  iconBg: string;
  icon: React.ReactNode;
}

function getDlgConfig(type: DlgType, voted: number, total: number): DlgConfig {
  const pct = calcTurnoutPercent(voted, total);

  const icons = {
    open: <Play aria-hidden="true" className="h-[20px] w-[20px]" />,
    close: <Square aria-hidden="true" className="h-[20px] w-[20px]" />,
    calendar: <CalendarClock aria-hidden="true" className="h-[20px] w-[20px]" />,
  };

  switch (type) {
    case "open":
      return {
        title: "Open election now?",
        body: "This will immediately open the election for voting, overriding the scheduled open time. This action is irreversible and will be logged.",
        confirmLabel: "Open Election",
        confirmVariant: "adminEmerald",
        iconBg: "bg-emerald-400/12 text-emerald-400",
        icon: icons.open,
      };
    case "close":
      return {
        title: "Close election now?",
        body: `This will immediately stop all voting. ${voted} of ${total} voters (${pct}%) have voted so far. This cannot be undone.`,
        confirmLabel: "Close Election",
        confirmVariant: "adminDestructive",
        iconBg: "bg-red-400/12 text-red-400",
        icon: icons.close,
      };
    case "recount":
      return {
        title: "Initiate certified recount?",
        body: "Every anonymous ballot commitment will be revalidated and the rebuilt tally will be compared with the official closing snapshot. The result is permanent and audited.",
        confirmLabel: "Run Recount",
        confirmVariant: "adminPrimary",
        iconBg: "bg-gold/12 text-gold",
        icon: icons.calendar,
      };
    case "reschedule":
      return {
        title: "Save schedule override?",
        body: "The open/close times will be updated and the scheduler will use the new values. This will be logged with your credentials.",
        confirmLabel: "Save Override",
        confirmVariant: "adminPrimary",
        iconBg: "bg-gold/12 text-gold",
        icon: icons.calendar,
      };
    case "advance":
      return {
        title: "Advance to Scheduled?",
        body: "This will mark the election as Scheduled, enabling the auto-open scheduler. You can still override times or open manually.",
        confirmLabel: "Advance to Scheduled",
        confirmVariant: "adminBlue",
        iconBg: "bg-blue-400/12 text-blue-400",
        icon: icons.calendar,
      };
    case "archive":
      return {
        title: "Archive this election?",
        body: "It will be hidden from the active dashboard and from public results. You can restore it anytime. This is logged.",
        confirmLabel: "Archive Election",
        confirmVariant: "adminDestructive",
        iconBg: "bg-white/6 text-white/60",
        icon: icons.close,
      };
    case "restore":
      return {
        title: "Restore this election?",
        body: "It will return to the active dashboard. This is logged.",
        confirmLabel: "Restore Election",
        confirmVariant: "adminPrimary",
        iconBg: "bg-gold/12 text-gold",
        icon: icons.calendar,
      };
    default:
      return { title: "", body: "", confirmLabel: "", confirmVariant: "adminGhost", iconBg: "", icon: null };
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

export default function ControlClient({ election, auditLogs, canLifecycle, canClose, canRecount }: ControlClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dlg, setDlg] = useState<DlgType>(null);
  const { toast, showToast, dismissToast } = useToast();
  const [dtOpen, setDtOpen] = useState(toInput(election.scheduledOpen));
  const [dtClose, setDtClose] = useState(toInput(election.scheduledClose));
  const [error, setError] = useState<string | null>(null);

  const { status } = election;
  const voters = election._count.voters;
  const voted = election.votedCount;
  const pct = calcTurnoutPercent(voted, voters);

  function notify(msg: string, variant: ToastVariant) {
    showToast({ msg, variant });
  }

  function confirmDlg() {
    if (!dlg) return;
    setError(null);
    startTransition(async () => {
      let result: { success: boolean; error?: string };
      if (dlg === "open") {
        result = await openElectionNow(election.id);
      } else if (dlg === "close") {
        result = await closeElectionNow(election.id);
      } else if (dlg === "recount") {
        result = await initiateRecount(election.id);
      } else if (dlg === "reschedule") {
        result = await rescheduleElection(election.id, dtOpen || null, dtClose || null);
      } else if (dlg === "archive") {
        result = await archiveElection(election.id);
      } else if (dlg === "restore") {
        result = await restoreElection(election.id);
      } else {
        result = await advanceToScheduled(election.id);
      }
      if (result.success) {
        const successToast = getControlSuccessToast(dlg as ControlToastAction);
        notify(successToast.msg, successToast.variant);
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
    <PageContainer className="flex max-w-4xl flex-col gap-[22px]">
      <PageHeader
        eyebrow={DIVISION_LABELS[election.division] ?? election.division}
        title={election.name}
        breadcrumb={
          <Breadcrumb
            items={[
              { href: "/admin", label: "Dashboard" },
              { label: "Control" },
            ]}
          />
        }
        meta={
          <div className="flex flex-wrap items-center gap-[9px]">
            <StatusPill status={status} />
            {!canLifecycle && !canClose && (
              <span className="inline-flex items-center gap-[4px] rounded-full border border-white/8 bg-white/3 px-[9px] py-[4px] text-[11px] text-white/50">
                <Lock aria-hidden="true" className="h-[13px] w-[13px]" />
                Read-only
              </span>
            )}
          </div>
        }
        actions={
          <Button onClick={() => router.push("/admin")} variant="adminGhost" size="adminMd">
            <ArrowLeft aria-hidden="true" />
            Back
          </Button>
        }
      />

      {/* ── Error ── */}
      {error && <ErrorBanner message={error} />}

      {/* ── Status card ── */}
      <Card
        title="Election Status"
        meta={<FlowTrack status={status} />}
      >
        {/* Quick stats */}
        <div className="mb-[18px] grid grid-cols-2 gap-[9px] sm:grid-cols-4">
          <StatCell label="Scheduled Open" value={fmt(election.scheduledOpen)} mono />
          <StatCell label="Scheduled Close" value={fmt(election.scheduledClose)} mono />
          <StatCell label="Registered Voters" value={voters.toString()} />
          <div className="rounded-[9px] border border-white/[0.07] bg-white/3 px-[15px] py-[11px]">
            <p className="mb-[6px] text-[10px] uppercase tracking-[0.12em] text-white/40">Turnout</p>
            <p className="text-[15px] font-semibold text-white/80">
              {voted}{" "}
              <span className="text-[12px] font-normal text-white/45">/ {voters} ({pct}%)</span>
            </p>
            <div className="mt-[7px] h-[3px] overflow-hidden rounded-full bg-white/6">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action row */}
        <div className="flex flex-wrap items-center gap-[9px] border-t border-white/[0.07] pt-[18px]">
          {/* Open Now — Commissioner (lifecycle) */}
          {canLifecycle && (
            <Button
              onClick={() => {
                if (status !== "SCHEDULED") return;
                setDlg("open");
              }}
              disabled={status !== "SCHEDULED" || isPending}
              variant="adminEmerald"
              size="adminMd"
              className="min-h-[49px]"
            >
              <Play aria-hidden="true" />
              Open Now
            </Button>
          )}

          {/* Advance to Scheduled (DRAFT only) — Commissioner (lifecycle) */}
          {canLifecycle && status === "DRAFT" && (
            <Button
              onClick={() => setDlg("advance")}
              disabled={isPending}
              variant="adminBlue"
              size="adminMd"
              className="min-h-[49px]"
            >
              <CalendarClock aria-hidden="true" />
              Advance to Scheduled
            </Button>
          )}

          {/* Close Election — Canvassing Head */}
          {canClose && (
            <Button
              onClick={() => {
                if (status !== "OPEN") return;
                setDlg("close");
              }}
              disabled={status !== "OPEN" || isPending}
              variant="adminGhost"
              size="adminMd"
              className="min-h-[49px]"
            >
              <Square aria-hidden="true" />
              Close Election
            </Button>
          )}

          {!canLifecycle && !canClose && (
            <span className="text-[12px] text-white/40">
              You have read-only access to this election.
            </span>
          )}

          <span className="text-[11px] text-white/40 md:ml-[4px]">{contextHint[status]}</span>
        </div>
      </Card>

      {/* ── Schedule override ── Commissioner (lifecycle) only */}
      {canLifecycle && status !== "CLOSED" && (
        <Card title="Override Schedule" meta={<AdminBadge />}>
          <div className="flex flex-col gap-[13px]">
            <WarnBanner>
              Overriding times bypasses the scheduler. All changes are logged with your admin credentials and timestamp.
            </WarnBanner>
            <div className="grid grid-cols-1 gap-[13px] md:grid-cols-[1fr_1fr_auto] md:items-end">
              <Field label="Open date & time">
                <AdminInput
                  type="datetime-local"
                  value={dtOpen}
                  onChange={(e) => setDtOpen(e.target.value)}
                />
              </Field>
              <Field label="Close date & time">
                <AdminInput
                  type="datetime-local"
                  value={dtClose}
                  onChange={(e) => setDtClose(e.target.value)}
                />
              </Field>
              <Button
                onClick={() => setDlg("reschedule")}
                disabled={isPending}
                variant="adminPrimary"
                size="adminMd"
                className="min-h-[49px]"
              >
                <CalendarClock aria-hidden="true" />
                Save Override
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card
        title="Ballot Integrity & Recounts"
        meta={election.auditVersion ? <span className="text-[11px] text-emerald-400/70">Verifiable v{election.auditVersion}</span> : <span className="text-[11px] text-gold/70">Legacy</span>}
      >
        {!election.auditVersion ? (
          <WarnBanner>This election predates verifiable ballots. Existing votes remain available, but receipts and cryptographic recounts are not supported.</WarnBanner>
        ) : (
          <div className="flex flex-col gap-[18px]">
            <div className="rounded-[9px] border border-white/[0.07] bg-white/2.5 p-[13px]">
              <div className="text-[10px] uppercase tracking-[0.14em] text-white/35">Public audit fingerprint</div>
              <div className="mt-[4px] break-all font-mono text-[11px] text-white/60">{election.auditFingerprint}</div>
            </div>
            {election.certification ? (
              <div className="flex flex-wrap items-center justify-between gap-[13px]">
                <div>
                  <div className="text-[13px] font-medium text-emerald-300">Official tally certified</div>
                  <div className="mt-[4px] text-[11px] text-white/40">{fmt(election.certification.createdAt)} by {election.certification.createdBy}</div>
                </div>
                {canRecount && (
                  <Button onClick={() => setDlg("recount")} disabled={isPending || status !== "CLOSED"} variant="adminPrimary" size="adminMd" className="min-h-[49px]">
                    <RotateCcw aria-hidden="true" />
                    Initiate Recount
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-[12px] text-white/45">The official snapshot will be frozen when this election closes.</p>
            )}
            {election.recounts.length > 0 && (
              <div className="border-t border-white/[0.07] pt-[13px]">
                <div className="mb-[9px] text-[10px] uppercase tracking-[0.14em] text-white/35">Recount history</div>
                <div className="flex flex-col gap-[9px]">
                  {election.recounts.map((recount) => {
                    const discrepancies = Array.isArray(recount.discrepancies) ? recount.discrepancies.filter((item): item is string => typeof item === "string") : [];
                    return (
                      <div key={recount.id} className={`rounded-[8px] border px-[13px] py-[9px] ${recount.matchesOfficial ? "border-emerald-400/15 bg-emerald-400/4" : "border-red-400/25 bg-red-400/5"}`}>
                        <div className="flex justify-between gap-[13px] text-[12px]">
                          <span className={recount.matchesOfficial ? "text-emerald-300" : "text-red-300"}>{recount.matchesOfficial ? "Matched official tally" : "Integrity discrepancy"}</span>
                          <span className="text-white/35">{fmt(recount.createdAt)}</span>
                        </div>
                        <div className="mt-[4px] text-[11px] text-white/40">{recount.ballotCount} ballots · {recount.validBallots} valid · {recount.invalidBallots} invalid · {recount.initiatedBy}</div>
                        {discrepancies.map((item) => <div key={item} className="mt-[4px] text-[11px] text-red-300/80">{item}</div>)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── Audit trail ── */}
      <Card title="Audit Trail" meta={<span className="text-[11px] text-white/35">{auditLogs.length} events</span>} noPad>
        {auditLogs.length === 0 ? (
          <p className="py-[27px] text-center text-[12px] text-white/40">No events yet</p>
        ) : (
          <div>
            {[...auditLogs].reverse().map((log) => {
              const dot = log.toStatus ? (DOT_COLORS[log.toStatus] ?? "bg-gold") : "bg-gold";
              const isAuto = log.adminEmail === "scheduler";
              return (
                <div key={log.id} className="flex items-start gap-[11px] border-b border-white/4 px-[18px] py-[10px] last:border-0">
                  <span className={`mt-[4px] h-[8px] w-[8px] shrink-0 rounded-full ${dot}`} />
                  <div>
                    <div className="flex items-center gap-[7px] text-[12px] font-medium text-white/70">
                      {log.action}
                      {isAuto && <AutoBadge />}
                    </div>
                    <div className="mt-[2px] text-[11px] text-white/50">
                      {log.adminEmail} ·{" "}
                      {fmt(log.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── Archive ── */}
      {canLifecycle && <Card title="Archive">
        {election.archivedAt ? (
          <div className="flex flex-wrap items-center justify-between gap-[13px]">
            <p className="text-[12px] text-white/50">
              Archived{election.archivedBy ? ` by ${election.archivedBy}` : ""} on {fmt(election.archivedAt)}.
              Hidden from the active dashboard and public results.
            </p>
            <Button onClick={() => setDlg("restore")} disabled={isPending} variant="adminPrimary" size="adminMd">
              <Undo2 aria-hidden="true" />
              Restore
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-[13px]">
            <p className="text-[12px] text-white/50">
              {canArchive(status, election.archivedAt).ok
                ? "Hide this election from the active dashboard and public results. Reversible."
                : "Close or unschedule the election before it can be archived."}
            </p>
            <Button
              onClick={() => setDlg("archive")}
              disabled={isPending || !canArchive(status, election.archivedAt).ok}
              variant="adminGhost"
              size="adminMd"
            >
              <Lock aria-hidden="true" />
              Archive
            </Button>
          </div>
        )}
      </Card>}

      {/* ── Confirm dialog ── */}
      <ConfirmDialog
        open={dlg !== null}
        title={dlgConfig.title}
        body={dlgConfig.body}
        confirmLabel={dlgConfig.confirmLabel}
        confirmVariant={dlgConfig.confirmVariant}
        isPending={isPending}
        onCancel={() => setDlg(null)}
        onConfirm={confirmDlg}
        icon={
          dlg ? (
            <div className={`flex h-[43px] w-[43px] items-center justify-center rounded-[10px] ${dlgConfig.iconBg}`}>
              {dlgConfig.icon}
            </div>
          ) : undefined
        }
      />

      {/* ── Toast ── */}
      <Toast toast={toast} onDismiss={dismissToast} />
    </PageContainer>
  );
}
