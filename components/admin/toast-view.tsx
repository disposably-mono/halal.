"use client";

import { resolveToastOptions, type ActiveToast, type LegacyToastColor, type ToastVariant } from "./toast";

export function Toast({
  toast,
  msg,
  variant,
  color,
  onDismiss,
}: {
  toast?: ActiveToast | null;
  msg?: string;
  variant?: ToastVariant;
  color?: LegacyToastColor;
  onDismiss?: () => void;
}) {
  const resolved = toast ?? (msg ? { id: 0, msg, ...resolveToastOptions({ msg, variant, color }) } : null);
  if (!resolved) return null;

  const styles: Record<ToastVariant, { dot: string; border: string; role: "status" | "alert" }> = {
    success: { dot: "bg-emerald-400", border: "border-emerald-400/25", role: "status" },
    error: { dot: "bg-red-400", border: "border-red-400/25", role: "alert" },
    warning: { dot: "bg-gold", border: "border-gold/25", role: "status" },
    info: { dot: "bg-blue-400", border: "border-blue-400/25", role: "status" },
  };
  const style = styles[resolved.variant];

  return (
    <div role={style.role} className={`fixed bottom-[22px] right-[22px] z-9998 flex max-w-[calc(100vw-2.5rem)] animate-in items-center gap-[9px] rounded-[11px] border ${style.border} bg-admin-raised px-[16px] py-[11px] text-[13px] text-white/90 shadow-xl duration-200 slide-in-from-bottom-4`}>
      <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${style.dot}`} />
      <span className="min-w-[0px]">{resolved.msg}</span>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={onDismiss}
          className="-mr-[9px] flex h-[49px] w-[49px] shrink-0 items-center justify-center rounded-[9px] text-white/55 transition-colors hover:text-white/90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gold/40"
        >
          ×
        </button>
      )}
    </div>
  );
}
