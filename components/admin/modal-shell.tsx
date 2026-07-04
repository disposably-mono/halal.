"use client";

import type { HTMLAttributes, MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared modal chrome: full-screen backdrop, centered box, and
 * close-on-backdrop-click. Callers own their own box sizing/content and any
 * extra behavior (focus trap, Escape key, etc.) — this only extracts the
 * bits that were duplicated verbatim across admin dialogs.
 */
export function ModalShell({
  open,
  onClose,
  backdropClassName,
  boxClassName,
  boxProps,
  children,
}: {
  open: boolean;
  onClose: () => void;
  backdropClassName?: string;
  boxClassName?: string;
  boxProps?: HTMLAttributes<HTMLDivElement>;
  children: ReactNode;
}) {
  if (!open) return null;

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <div
      className={cn(
        "fixed inset-[0px] z-9999 flex items-center justify-center bg-black/70",
        backdropClassName,
      )}
      onClick={handleBackdropClick}
    >
      <div className={boxClassName} {...boxProps}>
        {children}
      </div>
    </div>
  );
}
