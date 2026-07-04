"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Button, type buttonVariants } from "@/components/ui/button";
import { ModalShell } from "./modal-shell";
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

  return (
    <ModalShell
      open={open}
      onClose={onCancel}
      boxClassName="w-[90%] max-w-[403px] animate-in rounded-[16px] border border-white/12 bg-admin-raised p-[25px] duration-150 zoom-in-95"
      boxProps={{
        role: "dialog",
        "aria-modal": true,
        "aria-labelledby": "admin-confirm-title",
        "aria-describedby": "admin-confirm-body",
      }}
    >
      {icon && <div className="mb-[13px] flex h-[43px] w-[43px] items-center justify-center rounded-[10px]">{icon}</div>}
      <p id="admin-confirm-title" className="mb-[8px] text-[17px] font-bold text-white/90">{title}</p>
      <p id="admin-confirm-body" className="mb-[20px] text-[13px] leading-relaxed text-white/60">{body}</p>
      <div className="flex justify-end gap-[8px]">
        <Button ref={cancelRef} onClick={onCancel} variant="adminGhost" size="adminMd">Cancel</Button>
        <Button onClick={onConfirm} disabled={isPending} variant={confirmVariant} size="adminMd">
          {isPending ? "Working…" : confirmLabel}
        </Button>
      </div>
    </ModalShell>
  );
}
