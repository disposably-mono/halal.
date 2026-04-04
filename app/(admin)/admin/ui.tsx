"use client";

// ─── Design tokens (Tailwind class aliases kept as constants) ─────────────────
// All pages import from here to guarantee visual consistency.

// Card shells
export const CARD = "overflow-hidden rounded-xl border border-white/[0.08] bg-[#1a2540]";
export const CARD_HEADER = "flex items-center justify-between border-b border-white/[0.07] px-4 py-3";
export const CARD_TITLE = "text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40";
export const CARD_BODY = "p-4";

// Inputs / textareas
export const INPUT_BASE =
  "bg-white/[0.04] border border-white/[0.10] rounded-[7px] px-[10px] py-[7px] text-[12px] text-white/80 font-mono outline-none transition-colors focus:border-blue-400/50 w-full [color-scheme:dark] disabled:opacity-40 disabled:cursor-not-allowed";

// Buttons
export const BTN_PRIMARY =
  "inline-flex items-center gap-[5px] rounded-[7px] px-[13px] py-[7px] text-[12px] font-semibold bg-amber-400 text-[#0b1220] hover:opacity-90 active:scale-[0.97] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";
export const BTN_GHOST =
  "inline-flex items-center gap-[5px] rounded-[7px] px-[13px] py-[7px] text-[12px] font-semibold text-white/50 border border-white/[0.10] bg-transparent hover:text-white/80 hover:border-white/[0.20] active:scale-[0.97] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed";
export const BTN_EMERALD =
  "inline-flex items-center gap-[5px] rounded-[7px] px-[13px] py-[7px] text-[12px] font-semibold bg-emerald-400 text-[#0b1220] hover:opacity-90 active:scale-[0.97] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed";
export const BTN_BLUE =
  "inline-flex items-center gap-[5px] rounded-[7px] px-[13px] py-[7px] text-[12px] font-semibold bg-blue-400/[0.10] text-blue-400 border border-blue-400/25 hover:bg-blue-400/20 active:scale-[0.97] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed";
export const BTN_RED =
  "inline-flex items-center gap-[5px] rounded-[7px] px-[13px] py-[7px] text-[12px] font-semibold bg-red-400/[0.10] text-red-400 border border-red-400/25 hover:bg-red-400/20 active:scale-[0.97] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed";
export const BTN_SM = "px-[10px] py-[5px] text-[11px]";

// ─── Shared components ────────────────────────────────────────────────────────

import type { ReactNode } from "react";

/** Section card with consistent header + optional badge/meta slot */
export function Card({
  title,
  meta,
  children,
  noPad,
}: {
  title?: string;
  meta?: ReactNode;
  children: ReactNode;
  noPad?: boolean;
}) {
  return (
    <div className={CARD}>
      {title && (
        <div className={CARD_HEADER}>
          <span className={CARD_TITLE}>{title}</span>
          {meta && <div className="flex items-center gap-2">{meta}</div>}
        </div>
      )}
      <div className={noPad ? "" : CARD_BODY}>{children}</div>
    </div>
  );
}

/** Amber-accented "admin only" badge */
export function AdminBadge() {
  return (
    <span className="rounded-[3px] border border-amber-400/20 bg-amber-400/10 px-[6px] py-[1px] text-[9px] font-semibold text-amber-400">
      Admin only
    </span>
  );
}

/** "Auto" badge for scheduler-triggered audit entries */
export function AutoBadge() {
  return (
    <span className="rounded-[3px] border border-amber-400/20 bg-amber-400/10 px-[5px] py-[1px] text-[9px] font-semibold text-amber-400">
      auto
    </span>
  );
}

type Status = "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED";

const STATUS_LABELS: Record<Status, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  OPEN: "Open",
  CLOSED: "Closed",
};

/** Unified status pill — used in topbar and status cards */
export function StatusPill({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    DRAFT: "border-white/10 bg-white/[0.05] text-white/50",
    SCHEDULED: "border-blue-400/30 bg-blue-400/[0.08] text-blue-400",
    OPEN: "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-400",
    CLOSED: "border-white/10 bg-white/[0.03] text-white/20",
  };
  const dotStyles: Record<Status, string> = {
    DRAFT: "bg-white/20",
    SCHEDULED: "bg-blue-400",
    OPEN: "bg-emerald-400 animate-pulse",
    CLOSED: "bg-white/10",
  };
  return (
    <span
      className={`inline-flex items-center gap-[5px] rounded-full border px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.10em] ${styles[status]}`}
    >
      <span className={`h-[6px] w-[6px] rounded-full ${dotStyles[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}

/** Election lifecycle flow track (Draft › Scheduled › Open › Closed) */
const STATUSES: Status[] = ["DRAFT", "SCHEDULED", "OPEN", "CLOSED"];

export function FlowTrack({ status }: { status: Status }) {
  const idx = STATUSES.indexOf(status);
  return (
    <div className="flex items-center gap-[3px]">
      {STATUSES.map((s, i) => {
        const state = i < idx ? "done" : i === idx ? "active" : "future";
        return (
          <span key={s} className="flex items-center gap-[3px]">
            {i > 0 && (
              <span className="text-[9px] text-white/[0.12]">›</span>
            )}
            {state === "active" ? (
              <span className="rounded-[5px] border border-white/20 bg-white/[0.06] px-[9px] py-[3px] text-[10px] font-semibold text-white/80">
                {STATUS_LABELS[s]}
              </span>
            ) : (
              <span
                className={`px-[9px] py-[3px] text-[10px] font-semibold ${state === "done" ? "text-white/25" : "text-white/10"}`}
              >
                {STATUS_LABELS[s]}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

/** Warning banner (amber, for override/destructive notices) */
export function WarnBanner({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-[7px] rounded-[7px] border border-amber-400/[0.18] bg-amber-400/[0.06] px-3 py-[9px] text-[11px] leading-relaxed text-amber-400/80">
      <svg
        style={{ width: 12, height: 12, flexShrink: 0, marginTop: 1 }}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      {children}
    </div>
  );
}

/** Error banner (red, for action errors) */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-[9px] border border-red-400/25 bg-red-400/[0.08] px-4 py-3 text-[12px] text-red-400">
      {message}
    </div>
  );
}

/** Lock / finalize status banner */
export function FinalizeBanner({
  locked,
  lockedText,
  lockedSub,
  unlockedText,
  unlockedSub,
  onUnlock,
  canUnlock,
}: {
  locked: boolean;
  lockedText: string;
  lockedSub: string;
  unlockedText: string;
  unlockedSub: string;
  onUnlock?: () => void;
  canUnlock?: boolean;
}) {
  if (locked) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3">
        <div>
          <p className="text-[12px] font-semibold text-amber-400/90">{lockedText}</p>
          <p className="mt-0.5 text-[10px] text-amber-400/45">{lockedSub}</p>
        </div>
        {onUnlock && (
          <button onClick={onUnlock} disabled={!canUnlock} className={`${BTN_GHOST} ${BTN_SM}`}>
            Unlock
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-3">
      <div>
        <p className="text-[12px] font-semibold text-emerald-400/90">{unlockedText}</p>
        <p className="mt-0.5 text-[10px] text-emerald-400/45">{unlockedSub}</p>
      </div>
    </div>
  );
}

/** Mini stat cell (used in metrics strip and status cards) */
export function StatCell({
  label,
  value,
  sub,
  mono,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
  accent?: "emerald" | "amber" | "blue";
}) {
  const valColor =
    accent === "emerald"
      ? "text-emerald-400"
      : accent === "amber"
        ? "text-amber-400"
        : accent === "blue"
          ? "text-blue-400"
          : "text-white/90";

  return (
    <div className="rounded-[8px] border border-white/[0.07] bg-white/[0.03] px-[13px] py-[10px]">
      <p className="mb-[5px] text-[9px] uppercase tracking-[0.12em] text-white/30">{label}</p>
      <p
        className={`text-[18px] font-bold leading-none ${valColor} ${mono ? "font-mono text-[13px]" : ""
          }`}
      >
        {value}
      </p>
      {sub && <p className="mt-[5px] text-[9px] text-white/25">{sub}</p>}
    </div>
  );
}

/** Confirm dialog — shared across Control page actions */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  confirmClass,
  isPending,
  onCancel,
  onConfirm,
  icon,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  confirmClass: string;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  icon?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-[90%] max-w-[360px] animate-in zoom-in-95 duration-150 rounded-[14px] border border-white/[0.12] bg-[#1e2a47] p-[22px]">
        {icon && (
          <div className="mb-3 flex h-[38px] w-[38px] items-center justify-center rounded-[9px]">
            {icon}
          </div>
        )}
        <p className="mb-[7px] text-[15px] font-bold text-white/90">{title}</p>
        <p className="mb-[18px] text-[12px] leading-relaxed text-white/50">{body}</p>
        <div className="flex justify-end gap-[7px]">
          <button onClick={onCancel} className={BTN_GHOST}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={`inline-flex items-center gap-[5px] rounded-[7px] px-[13px] py-[7px] text-[12px] font-semibold transition-all cursor-pointer disabled:opacity-50 ${confirmClass}`}
          >
            {isPending ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Toast notification */
export function Toast({
  msg,
  color,
}: {
  msg: string;
  color: "green" | "red" | "amber" | "blue";
}) {
  const dotColors = {
    green: "bg-emerald-400",
    red: "bg-red-400",
    amber: "bg-amber-400",
    blue: "bg-blue-400",
  };
  return (
    <div className="fixed bottom-5 right-5 z-[9998] flex animate-in slide-in-from-bottom-4 items-center gap-2 rounded-[10px] border border-white/[0.12] bg-[#1e2a47] px-[14px] py-[10px] text-[12px] text-white/90 shadow-xl duration-200">
      <span className={`h-[6px] w-[6px] shrink-0 rounded-full ${dotColors[color]}`} />
      {msg}
    </div>
  );
}
