"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export const DEFAULT_TOAST_DURATION_MS = 5000;

export type ToastVariant = "success" | "error" | "warning" | "info";
export type LegacyToastColor = "green" | "red" | "amber" | "blue";
export type ToastInput = {
  msg: string;
  variant?: ToastVariant;
  color?: LegacyToastColor;
  durationMs?: number | null;
};
export type ActiveToast = {
  id: number;
  msg: string;
  variant: ToastVariant;
  durationMs: number | null;
};

export function mapToastColorToVariant(color: LegacyToastColor): ToastVariant {
  const variants: Record<LegacyToastColor, ToastVariant> = {
    green: "success",
    red: "error",
    amber: "warning",
    blue: "info",
  };
  return variants[color];
}

export function resolveToastOptions(input: ToastInput): Pick<ActiveToast, "durationMs" | "variant"> {
  const variant = input.variant ?? (input.color ? mapToastColorToVariant(input.color) : "info");
  const durationMs = input.durationMs !== undefined
    ? input.durationMs
    : variant === "error"
      ? null
      : DEFAULT_TOAST_DURATION_MS;

  return { durationMs, variant };
}

export function useToast() {
  const [toast, setToast] = useState<ActiveToast | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);
  const showToast = useCallback((input: ToastInput) => {
    const options = resolveToastOptions(input);
    setToast({
      id: Date.now(),
      msg: input.msg,
      ...options,
    });
  }, []);

  useEffect(() => {
    if (!toast || toast.durationMs === null) return;
    const timeout = window.setTimeout(dismissToast, toast.durationMs);
    return () => window.clearTimeout(timeout);
  }, [dismissToast, toast]);

  return useMemo(() => ({ toast, showToast, dismissToast }), [dismissToast, showToast, toast]);
}
