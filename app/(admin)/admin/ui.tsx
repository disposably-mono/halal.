"use client";

// ─── Design tokens ────────────────────────────────────────────────────────────

export const CARD = "overflow-hidden rounded-xl border border-white/[0.08] bg-[#1a2540]";
export const CARD_HEADER = "flex items-center justify-between border-b border-white/[0.07] px-4 py-3";
export const CARD_TITLE = "text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40";
export const CARD_BODY = "p-4";

export const INPUT_BASE =
  "bg-white/[0.04] border border-white/[0.10] rounded-[7px] px-[10px] py-[7px] text-[12px] text-white/80 font-mono outline-none transition-colors focus:border-blue-400/50 w-full [color-scheme:dark] disabled:opacity-40 disabled:cursor-not-allowed";

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

// ─── Imports ──────────────────────────────────────────────────────────────────

import { useFormState } from "react-dom";
import { useTransition } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ─── Card ─────────────────────────────────────────────────────────────────────

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

// ─── Badges ───────────────────────────────────────────────────────────────────

export function AdminBadge() {
  return (
    <span className="rounded-[3px] border border-amber-400/20 bg-amber-400/10 px-[6px] py-[1px] text-[9px] font-semibold text-amber-400">
      Admin only
    </span>
  );
}

export function AutoBadge() {
  return (
    <span className="rounded-[3px] border border-amber-400/20 bg-amber-400/10 px-[5px] py-[1px] text-[9px] font-semibold text-amber-400">
      auto
    </span>
  );
}

// ─── StatusPill ───────────────────────────────────────────────────────────────

type Status = "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED";

const STATUS_LABELS: Record<Status, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  OPEN: "Open",
  CLOSED: "Closed",
};

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
    <span className={`inline-flex items-center gap-[5px] rounded-full border px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.10em] ${styles[status]}`}>
      <span className={`h-[6px] w-[6px] rounded-full ${dotStyles[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── FlowTrack ────────────────────────────────────────────────────────────────

const STATUSES: Status[] = ["DRAFT", "SCHEDULED", "OPEN", "CLOSED"];

export function FlowTrack({ status }: { status: Status }) {
  const idx = STATUSES.indexOf(status);
  return (
    <div className="flex items-center gap-[3px]">
      {STATUSES.map((s, i) => {
        const state = i < idx ? "done" : i === idx ? "active" : "future";
        return (
          <span key={s} className="flex items-center gap-[3px]">
            {i > 0 && <span className="text-[9px] text-white/[0.12]">›</span>}
            {state === "active" ? (
              <span className="rounded-[5px] border border-white/20 bg-white/[0.06] px-[9px] py-[3px] text-[10px] font-semibold text-white/80">
                {STATUS_LABELS[s]}
              </span>
            ) : (
              <span className={`px-[9px] py-[3px] text-[10px] font-semibold ${state === "done" ? "text-white/25" : "text-white/10"}`}>
                {STATUS_LABELS[s]}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

// ─── ElectionSubNav ───────────────────────────────────────────────────────────
// Persistent tab strip rendered below the topbar on all election sub-pages.

export function ElectionSubNav({
  electionId,
  status,
}: {
  electionId: string;
  status: Status;
}) {
  const pathname = usePathname();
  const base = `/admin/elections/${electionId}`;

  const tabs = [
    {
      href: `${base}/voters`,
      label: "Voters",
      icon: (
        <svg style={{ width: 12, height: 12 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
      disabled: false,
    },
    {
      href: `${base}/candidates`,
      label: "Candidates",
      icon: (
        <svg style={{ width: 12, height: 12 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      ),
      disabled: false,
    },
    {
      href: `${base}/control`,
      label: "Control",
      icon: (
        <svg style={{ width: 12, height: 12 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
        </svg>
      ),
      disabled: false,
    },
    {
      href: `${base}/monitor`,
      label: "Monitor",
      icon: (
        <svg style={{ width: 12, height: 12 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      disabled: status === "DRAFT" || status === "SCHEDULED",
    },
  ];

  return (
    <div className="border-b border-white/[0.06] bg-[#0f1928]">
      <div className="mx-auto flex h-[38px] max-w-7xl items-center gap-[2px] px-6">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          if (tab.disabled) {
            return (
              <span
                key={tab.label}
                className="flex items-center gap-[5px] px-[10px] py-[5px] text-[11px] text-white/20 cursor-not-allowed select-none"
                title={`Available when election is Open`}
              >
                {tab.icon}
                {tab.label}
              </span>
            );
          }
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex items-center gap-[5px] px-[10px] py-[5px] text-[11px] rounded-[5px] transition-all no-underline relative ${isActive
                ? "text-white/90 bg-white/[0.06]"
                : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                }`}
            >
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-amber-400 rounded-t-[2px]" />
              )}
              {tab.icon}
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── SetupStepper ─────────────────────────────────────────────────────────────
// 3-step progress indicator shown on voters / candidates / control pages.

export function SetupStepper({
  votersFinalized,
  candidatesFinalized,
  status,
}: {
  votersFinalized: boolean;
  candidatesFinalized: boolean;
  status: Status;
}) {
  const electionLaunched = status === "OPEN" || status === "CLOSED" || status === "SCHEDULED";

  const steps = [
    { label: "Candidates", done: candidatesFinalized },
    { label: "Voters", done: votersFinalized },
    { label: "Launch", done: electionLaunched },
  ];

  const firstIncomplete = steps.findIndex((s) => !s.done);

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const isDone = step.done;
        const isCurrent = !isDone && i === firstIncomplete;
        const isFuture = !isDone && i !== firstIncomplete;

        return (
          <div key={step.label} className="flex items-center">
            {/* Connector line */}
            {i > 0 && (
              <div className={`h-px w-8 ${steps[i - 1].done ? "bg-emerald-400/40" : "bg-white/[0.08]"}`} />
            )}
            <div className="flex items-center gap-[6px]">
              {/* Circle */}
              <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold transition-all ${isDone
                ? "bg-emerald-400/20 border border-emerald-400/40 text-emerald-400"
                : isCurrent
                  ? "bg-amber-400/15 border border-amber-400/40 text-amber-400"
                  : "bg-white/[0.04] border border-white/[0.10] text-white/20"
                }`}>
                {isDone ? (
                  <svg style={{ width: 9, height: 9 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              {/* Label */}
              <span className={`text-[11px] font-medium ${isDone ? "text-emerald-400/70" : isCurrent ? "text-amber-400/80" : "text-white/20"
                }`}>
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── WarnBanner ───────────────────────────────────────────────────────────────

export function WarnBanner({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-[7px] rounded-[7px] border border-amber-400/[0.18] bg-amber-400/[0.06] px-3 py-[9px] text-[11px] leading-relaxed text-amber-400/80">
      <svg style={{ width: 12, height: 12, flexShrink: 0, marginTop: 1 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      {children}
    </div>
  );
}

// ─── ErrorBanner ──────────────────────────────────────────────────────────────

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-[9px] border border-red-400/25 bg-red-400/[0.08] px-4 py-3 text-[12px] text-red-400">
      {message}
    </div>
  );
}

// ─── FinalizeBanner ───────────────────────────────────────────────────────────
// FIXED: uses formAction + electionId instead of onUnlock callback.
// Server Actions can only be passed as form action props, not as onClick/onUnlock
// callbacks from a Server Component into a Client Component.

export function FinalizeBanner({
  locked,
  lockedText,
  lockedSub,
  unlockedText,
  unlockedSub,
  unlockAction,
  electionId,
  canUnlock,
}: {
  locked: boolean;
  lockedText: string;
  lockedSub: string;
  unlockedText: string;
  unlockedSub: string;
  /** Server action that accepts FormData with an `electionId` field */
  unlockAction?: (prevState: any, formData: FormData) => Promise<any>;
  electionId?: string;
  canUnlock?: boolean;
}) {
  if (locked) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3">
        <div>
          <p className="text-[12px] font-semibold text-amber-400/90">{lockedText}</p>
          <p className="mt-0.5 text-[10px] text-amber-400/45">{lockedSub}</p>
        </div>
        {unlockAction && electionId && canUnlock && (
          <form action={async (formData: FormData) => {
            await unlockAction(null, formData);
          }}>
            <input type="hidden" name="electionId" value={electionId} />
            <button type="submit" className={`${BTN_GHOST} ${BTN_SM}`}>
              Unlock
            </button>
          </form>
        )}
        {unlockAction && electionId && !canUnlock && (
          <button disabled className={`${BTN_GHOST} ${BTN_SM} opacity-30`}>
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

// ─── StatCell ─────────────────────────────────────────────────────────────────

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
    accent === "emerald" ? "text-emerald-400" :
      accent === "amber" ? "text-amber-400" :
        accent === "blue" ? "text-blue-400" :
          "text-white/90";

  return (
    <div className="rounded-[8px] border border-white/[0.07] bg-white/[0.03] px-[13px] py-[10px]">
      <p className="mb-[5px] text-[9px] uppercase tracking-[0.12em] text-white/30">{label}</p>
      <p className={`text-[18px] font-bold leading-none ${valColor} ${mono ? "font-mono text-[13px]" : ""}`}>
        {value}
      </p>
      {sub && <p className="mt-[5px] text-[9px] text-white/25">{sub}</p>}
    </div>
  );
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────────

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
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-[90%] max-w-[360px] animate-in zoom-in-95 duration-150 rounded-[14px] border border-white/[0.12] bg-[#1e2a47] p-[22px]">
        {icon && <div className="mb-3 flex h-[38px] w-[38px] items-center justify-center rounded-[9px]">{icon}</div>}
        <p className="mb-[7px] text-[15px] font-bold text-white/90">{title}</p>
        <p className="mb-[18px] text-[12px] leading-relaxed text-white/50">{body}</p>
        <div className="flex justify-end gap-[7px]">
          <button onClick={onCancel} className={BTN_GHOST}>Cancel</button>
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

// ─── Toast ────────────────────────────────────────────────────────────────────

export function Toast({ msg, color }: { msg: string; color: "green" | "red" | "amber" | "blue" }) {
  const dotColors = { green: "bg-emerald-400", red: "bg-red-400", amber: "bg-amber-400", blue: "bg-blue-400" };
  return (
    <div className="fixed bottom-5 right-5 z-[9998] flex animate-in slide-in-from-bottom-4 items-center gap-2 rounded-[10px] border border-white/[0.12] bg-[#1e2a47] px-[14px] py-[10px] text-[12px] text-white/90 shadow-xl duration-200">
      <span className={`h-[6px] w-[6px] shrink-0 rounded-full ${dotColors[color]}`} />
      {msg}
    </div>
  );
}

// ─── FinalizeButton ───────────────────────────────────────────────────────────

type FinalizeResult = { success: boolean; error?: string };

export function FinalizeButton({
  action,
  electionId,
  label,
  hint,
}: {
  action: (prevState: FinalizeResult | null, formData: FormData) => Promise<FinalizeResult>;
  electionId: string;
  label: string;
  hint?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useFormState<FinalizeResult | null, FormData>(action, null);

  const dispatch = (formData: FormData) => {
    startTransition(() => { formAction(formData); });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {state && !state.success && state.error && (
        <div role="alert" className="flex w-full items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
          <span className="mt-[1px] shrink-0 text-[13px] text-red-400">⚠</span>
          <p className="text-[11px] leading-relaxed text-red-300">{state.error}</p>
        </div>
      )}
      <form action={dispatch} className="flex items-center gap-3">
        <input type="hidden" name="electionId" value={electionId} />
        {hint && <p className="text-[11px] text-white/30">{hint}</p>}
        <button type="submit" disabled={isPending} className={`${BTN_PRIMARY} disabled:opacity-50 disabled:cursor-not-allowed`}>
          {isPending ? "Saving…" : label}
        </button>
      </form>
    </div>
  );
}
