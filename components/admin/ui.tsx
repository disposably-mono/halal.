"use client";

import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useServerActionForm } from "@/lib/client/use-server-action-form";
import { Button, type buttonVariants } from "@/components/ui/button";
import { SecretInput } from "@/components/ui/secret-input";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

// ─── Internal class strings ───────────────────────────────────────────────────
// Kept module-private — external consumers should use the wrapper components
// (AdminInput / AdminTextarea), ThemedSelect, or shadcn's <Button> with admin variants.

const CARD = "overflow-hidden rounded-xl border border-white/[0.08] bg-admin-surface";
const CARD_HEADER = "flex items-center justify-between border-b border-white/[0.07] px-4 py-3";
const CARD_TITLE_CLASS = "text-[10px] font-semibold uppercase tracking-[0.08em] text-white/50";
const CARD_BODY = "p-4";

const adminInputClass =
  "bg-white/[0.04] border border-white/[0.10] rounded-[7px] px-[10px] py-[7px] text-[12px] text-white/80 font-mono outline-none transition-colors focus:border-gold/50 focus:ring-2 focus:ring-gold/10 w-full [color-scheme:dark] disabled:opacity-40 disabled:cursor-not-allowed";

// ─── Admin form primitives ────────────────────────────────────────────────────

export function AdminInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(adminInputClass, className)} {...props} />;
}

export function AdminSecretInput({ className, ...props }: ComponentProps<typeof SecretInput>) {
  return <SecretInput className={cn(adminInputClass, className)} {...props} />;
}

export function AdminTextarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(adminInputClass, className)} {...props} />;
}

export function AdminCardTitle({ className, children, as: As = "span" }: { className?: string; children: ReactNode; as?: "span" | "h2" | "h3" | "h4" }) {
  return <As className={cn(CARD_TITLE_CLASS, className)}>{children}</As>;
}

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
          <span className={CARD_TITLE_CLASS}>{title}</span>
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
    <span className="rounded-[3px] border border-gold/20 bg-gold/10 px-[6px] py-[1px] text-[9px] font-semibold text-gold">
      Admin only
    </span>
  );
}

export function AutoBadge() {
  return (
    <span className="rounded-[3px] border border-gold/20 bg-gold/10 px-[5px] py-[1px] text-[9px] font-semibold text-gold">
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
    DRAFT: "border-white/10 bg-white/[0.05] text-white/60",
    SCHEDULED: "border-blue-400/30 bg-blue-400/[0.08] text-blue-400",
    OPEN: "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-400",
    CLOSED: "border-white/10 bg-white/[0.03] text-white/60",
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
              <span className={`px-[9px] py-[3px] text-[10px] font-semibold ${state === "done" ? "text-white/60" : "text-white/10"}`}>
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

export function ElectionSubNav({
  electionId,
  status,
  candidatesFinalized,
  votersFinalized,
}: {
  electionId: string;
  status: Status;
  candidatesFinalized: boolean;
  votersFinalized: boolean;
}) {
  const pathname = usePathname();
  const base = `/admin/elections/${electionId}`;

  const tabs = [
    {
      href: `${base}/candidates`,
      label: "Candidates",
      step: 1,
      done: candidatesFinalized,
      disabled: false,
    },
    {
      href: `${base}/voters`,
      label: "Voters",
      step: 2,
      done: votersFinalized,
      disabled: false,
    },
    {
      href: `${base}/control`,
      label: "Control",
      step: 3,
      done: status !== "DRAFT",
      disabled: false,
    },
    {
      href: `${base}/monitor`,
      label: "Monitor",
      step: null,
      done: false,
      icon: (
        <svg style={{ width: 12, height: 12 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      disabled: status === "DRAFT" || status === "SCHEDULED",
    },
  ];

  return (
    <div className="overflow-x-auto border-b border-white/[0.06] bg-admin-bg">
      <div className="mx-auto flex h-[42px] min-w-max max-w-7xl items-center gap-1 px-4 sm:px-6" aria-label="Election setup navigation">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const marker = tab.step ? (
            <span className={`flex h-[17px] w-[17px] items-center justify-center rounded-full border text-[9px] font-bold ${tab.done
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
              : isActive
                ? "border-gold/40 bg-gold/10 text-gold"
                : "border-white/[0.12] text-white/60"
              }`}>
              {tab.done ? "✓" : tab.step}
            </span>
          ) : tab.icon;

          if (tab.disabled) {
            return (
              <span
                key={tab.label}
                className="ml-2 flex cursor-not-allowed select-none items-center gap-[5px] border-l border-white/[0.08] px-[12px] py-[5px] text-[11px] text-white/60"
                title="Available once the election opens"
              >
                {marker}
                {tab.label}
              </span>
            );
          }
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`relative flex items-center gap-[6px] rounded-[6px] px-[10px] py-[6px] text-[11px] no-underline transition-all ${tab.step === null ? "ml-2 border-l border-white/[0.08] pl-[14px]" : ""} ${isActive
                ? "text-white/90 bg-white/[0.06]"
                : "text-white/50 hover:text-white/70 hover:bg-white/[0.03]"
                }`}
            >
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-gold rounded-t-[2px]" />
              )}
              {marker}
              {tab.label}
              {tab.step && tab.step < 3 && (
                <span className="ml-1 text-white/[0.12]">›</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── SetupStepper ─────────────────────────────────────────────────────────────

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
    { label: "Control", done: electionLaunched },
  ];

  const firstIncomplete = steps.findIndex((s) => !s.done);

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const isDone = step.done;
        const isCurrent = !isDone && i === firstIncomplete;

        return (
          <div key={step.label} className="flex items-center">
            {i > 0 && (
              <div className={`h-px w-8 ${steps[i - 1].done ? "bg-emerald-400/40" : "bg-white/[0.08]"}`} />
            )}
            <div className="flex items-center gap-[6px]">
              <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold transition-all ${isDone
                ? "bg-emerald-400/20 border border-emerald-400/40 text-emerald-400"
                : isCurrent
                  ? "bg-gold/15 border border-gold/40 text-gold"
                  : "bg-white/[0.04] border border-white/[0.10] text-white/60"
                }`}>
                {isDone ? (
                  <svg style={{ width: 9, height: 9 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span className={`text-[11px] font-medium ${isDone ? "text-emerald-400/70" : isCurrent ? "text-gold/80" : "text-white/60"
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

export function SetupNextStep({
  href,
  title,
  description,
  label,
}: {
  href: string;
  title: string;
  description: string;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gold/20 bg-gold/[0.05] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[12px] font-semibold text-white/80">{title}</p>
        <p className="mt-0.5 text-[10px] text-white/40">{description}</p>
      </div>
      <Button asChild variant="adminPrimary" size="adminMd" className="shrink-0">
        <Link href={href}>
          {label}
          <span aria-hidden="true">→</span>
        </Link>
      </Button>
    </div>
  );
}

// ─── WarnBanner ───────────────────────────────────────────────────────────────

export function WarnBanner({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-[7px] rounded-[7px] border border-gold/[0.18] bg-gold/[0.06] px-3 py-[9px] text-[11px] leading-relaxed text-gold/80">
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
// Server actions can only be passed as form action props, not as onClick callbacks
// from a Server Component into a Client Component — hence the FormData dispatch.

type AdminButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;

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
  // Polymorphic dispatch — different callers pass actions with different prevState/return types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unlockAction?: (prevState: any, formData: FormData) => Promise<any>;
  electionId?: string;
  canUnlock?: boolean;
}) {
  if (locked) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-gold/20 bg-gold/[0.06] px-4 py-3">
        <div>
          <p className="text-[12px] font-semibold text-gold/90">{lockedText}</p>
          <p className="mt-0.5 text-[10px] text-gold/45">{lockedSub}</p>
        </div>
        {unlockAction && electionId && canUnlock && (
          <form action={async (formData: FormData) => {
            await unlockAction(null, formData);
          }}>
            <input type="hidden" name="electionId" value={electionId} />
            <Button type="submit" variant="adminGhost" size="adminSm">Unlock</Button>
          </form>
        )}
        {unlockAction && electionId && !canUnlock && (
          <Button disabled variant="adminGhost" size="adminSm" className="opacity-30">
            Unlock
          </Button>
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
      accent === "amber" ? "text-gold" :
        accent === "blue" ? "text-blue-400" :
          "text-white/90";

  return (
    <div className="rounded-[8px] border border-white/[0.07] bg-white/[0.03] px-[13px] py-[10px]">
      <p className="mb-[5px] text-[9px] uppercase tracking-[0.12em] text-white/40">{label}</p>
      <p className={`text-[18px] font-bold leading-none ${valColor} ${mono ? "font-mono text-[13px]" : ""}`}>
        {value}
      </p>
      {sub && <p className="mt-[5px] text-[9px] text-white/60">{sub}</p>}
    </div>
  );
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────────

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  confirmVariant,
  isPending,
  onCancel,
  onConfirm,
  icon,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  confirmVariant: AdminButtonVariant;
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
      <div className="w-[90%] max-w-[360px] animate-in zoom-in-95 duration-150 rounded-[14px] border border-white/[0.12] bg-admin-raised p-[22px]">
        {icon && <div className="mb-3 flex h-[38px] w-[38px] items-center justify-center rounded-[9px]">{icon}</div>}
        <p className="mb-[7px] text-[15px] font-bold text-white/90">{title}</p>
        <p className="mb-[18px] text-[12px] leading-relaxed text-white/60">{body}</p>
        <div className="flex justify-end gap-[7px]">
          <Button onClick={onCancel} variant="adminGhost" size="adminMd">Cancel</Button>
          <Button onClick={onConfirm} disabled={isPending} variant={confirmVariant} size="adminMd">
            {isPending ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

export function Toast({ msg, color }: { msg: string; color: "green" | "red" | "amber" | "blue" }) {
  const dotColors = { green: "bg-emerald-400", red: "bg-red-400", amber: "bg-gold", blue: "bg-blue-400" };
  return (
    <div className="fixed bottom-5 right-5 z-[9998] flex animate-in slide-in-from-bottom-4 items-center gap-2 rounded-[10px] border border-white/[0.12] bg-admin-raised px-[14px] py-[10px] text-[12px] text-white/90 shadow-xl duration-200">
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
  const { state, isPending, handleSubmit } = useServerActionForm<FinalizeResult | null>(
    action,
    null,
    { shouldRefresh: (nextState) => Boolean(nextState?.success) },
  );

  return (
    <div className="flex flex-col items-end gap-2">
      {state && !state.success && state.error && (
        <div role="alert" className="flex w-full items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
          <span className="mt-[1px] shrink-0 text-[13px] text-red-400">⚠</span>
          <p className="text-[11px] leading-relaxed text-red-300">{state.error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <input type="hidden" name="electionId" value={electionId} />
        {hint && <p className="text-[11px] text-white/40">{hint}</p>}
        <Button
          type="submit"
          disabled={isPending}
          variant="adminPrimary"
          size="adminMd"
          className="disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving…" : label}
        </Button>
      </form>
    </div>
  );
}
