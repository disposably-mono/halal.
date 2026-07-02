"use client";

import type { ReactNode } from "react";
import { Button, type buttonVariants } from "@/components/ui/button";
import { useServerActionForm } from "@/lib/client/use-server-action-form";
import type { VariantProps } from "class-variance-authority";

type AdminButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;

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

export function WarnBanner({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-[7px] rounded-[7px] border border-gold/[0.18] bg-gold/[0.06] px-3 py-[9px] text-[11px] leading-relaxed text-gold/80">
      <svg style={{ width: 12, height: 12, flexShrink: 0, marginTop: 1 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      {children}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-[9px] border border-red-400/25 bg-red-400/[0.08] px-4 py-3 text-[12px] text-red-400">
      {message}
    </div>
  );
}

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
  // Polymorphic dispatch: callers pass server actions with different state types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unlockAction?: (prevState: any, formData: FormData) => Promise<any>;
  electionId?: string;
  canUnlock?: boolean;
}) {
  if (!locked) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-3">
        <div>
          <p className="text-[12px] font-semibold text-emerald-400/90">{unlockedText}</p>
          <p className="mt-0.5 text-[10px] text-emerald-400/45">{unlockedSub}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gold/20 bg-gold/[0.06] px-4 py-3">
      <div>
        <p className="text-[12px] font-semibold text-gold/90">{lockedText}</p>
        <p className="mt-0.5 text-[10px] text-gold/45">{lockedSub}</p>
      </div>
      {unlockAction && electionId && canUnlock && (
        <form action={async (formData: FormData) => { await unlockAction(null, formData); }}>
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
        <Button type="submit" disabled={isPending} variant="adminPrimary" size="adminMd" className="disabled:cursor-not-allowed disabled:opacity-50">
          {isPending ? "Saving…" : label}
        </Button>
      </form>
    </div>
  );
}

export type { AdminButtonVariant };
