"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Button, type buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

type AdminButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;

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
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70" onClick={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title" aria-describedby="admin-confirm-body" className="w-[90%] max-w-[360px] animate-in rounded-[14px] border border-white/[0.12] bg-admin-raised p-[22px] duration-150 zoom-in-95">
        {icon && <div className="mb-3 flex h-[38px] w-[38px] items-center justify-center rounded-[9px]">{icon}</div>}
        <p id="admin-confirm-title" className="mb-[7px] text-[15px] font-bold text-white/90">{title}</p>
        <p id="admin-confirm-body" className="mb-[18px] text-[12px] leading-relaxed text-white/60">{body}</p>
        <div className="flex justify-end gap-[7px]">
          <Button ref={cancelRef} onClick={onCancel} variant="adminGhost" size="adminMd">Cancel</Button>
          <Button onClick={onConfirm} disabled={isPending} variant={confirmVariant} size="adminMd">
            {isPending ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
