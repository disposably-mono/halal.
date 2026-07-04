"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, type buttonVariants } from "@/components/ui/button";
import { useServerActionForm } from "@/lib/client/use-server-action-form";
import type { VariantProps } from "class-variance-authority";

type AdminButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;

export function AdminBadge() {
  return (
    <span className="rounded-[3px] border border-gold/20 bg-gold/10 px-[7px] py-px text-[10px] font-semibold text-gold">
      Admin only
    </span>
  );
}

export function AutoBadge() {
  return (
    <span className="rounded-[3px] border border-gold/20 bg-gold/10 px-[6px] py-px text-[10px] font-semibold text-gold">
      auto
    </span>
  );
}

export function WarnBanner({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-[8px] rounded-[8px] border border-gold/18 bg-gold/6 px-[13px] py-[10px] text-[12px] leading-relaxed text-gold/80">
      <AlertTriangle aria-hidden="true" size={13} strokeWidth={2.5} className="mt-px shrink-0" />
      {children}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-[10px] border border-red-400/25 bg-red-400/8 px-[18px] py-[13px] text-[13px] text-red-400">
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
      <div className="flex items-center justify-between gap-[13px] rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-[18px] py-[13px]">
        <div>
          <p className="text-[13px] font-semibold text-emerald-400/90">{unlockedText}</p>
          <p className="mt-[2px] text-[11px] text-emerald-400/45">{unlockedSub}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-[13px] rounded-xl border border-gold/20 bg-gold/6 px-[18px] py-[13px]">
      <div>
        <p className="text-[13px] font-semibold text-gold/90">{lockedText}</p>
        <p className="mt-[2px] text-[11px] text-gold/45">{lockedSub}</p>
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
    <div className="flex flex-col items-end gap-[9px]">
      {state && !state.success && state.error && (
        <div role="alert" className="flex w-full items-start gap-[9px] rounded-lg border border-red-500/20 bg-red-500/10 px-[18px] py-[13px]">
          <span className="mt-px shrink-0 text-[15px] text-red-400">⚠</span>
          <p className="text-[12px] leading-relaxed text-red-300">{state.error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-[13px]">
        <input type="hidden" name="electionId" value={electionId} />
        {hint && <p className="text-[12px] text-white/40">{hint}</p>}
        <Button type="submit" disabled={isPending} variant="adminPrimary" size="adminMd" className="disabled:cursor-not-allowed disabled:opacity-50">
          {isPending ? "Saving…" : label}
        </Button>
      </form>
    </div>
  );
}

export type { AdminButtonVariant };
