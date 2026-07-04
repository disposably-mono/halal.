"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { restoreElection } from "../actions";
import { DIVISION_LABELS } from "@/lib/ui/division-labels";
import type { ToastVariant } from "@/components/admin/ui";
import { fmt, type Election } from "./shared";

export function ArchivedSection({
  elections,
  onToast,
  canLifecycle,
}: {
  elections: Election[];
  onToast: (msg: string, variant: ToastVariant) => void;
  canLifecycle: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (elections.length === 0) return null;

  function handleRestore(id: string) {
    startTransition(async () => {
      const res = await restoreElection(id);
      onToast(res.success ? "Election restored" : res.error, res.success ? "success" : "error");
      if (res.success) router.refresh();
    });
  }

  return (
    <div className="bg-admin-surface border border-white/[0.07] rounded-[13px] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-[9px] px-[16px] py-[11px] cursor-pointer border-b border-white/[0.07] bg-transparent w-full hover:bg-white/2.5 focus-visible:outline-hidden focus-visible:bg-white/4 transition-colors"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-white/40 flex-1 text-left">
          Archived
        </span>
        <span className="text-[11px] bg-white/6 text-white/40 rounded-full px-[8px] py-px">
          {elections.length}
        </span>
        <svg
          className={`w-[13px] h-[13px] text-white/40 ml-[7px] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open &&
        elections.map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-[13px] px-[16px] py-[11px] border-b border-white/4 last:border-0"
          >
            <div className="flex-1 min-w-[0px]">
              <div className="text-[13px] font-medium text-white/70 truncate">{e.name}</div>
              <div className="text-[11px] text-white/30 mt-px">
                {DIVISION_LABELS[e.division] ?? e.division} · archived {fmt(e.archivedAt)}
              </div>
            </div>
            {canLifecycle && (
              <button
                type="button"
                onClick={() => handleRestore(e.id)}
                disabled={isPending}
                className="text-[11px] text-gold bg-gold/8 border border-gold/20 rounded-[6px] px-[10px] py-[4px] hover:bg-gold/15 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gold/40 transition-all disabled:opacity-40"
              >
                Restore
              </button>
            )}
          </div>
        ))}
    </div>
  );
}
