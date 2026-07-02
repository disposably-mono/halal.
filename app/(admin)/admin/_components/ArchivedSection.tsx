"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { restoreElection } from "../actions";
import { DIVISION_LABELS } from "@/lib/ui/division-labels";
import { fmt, type Election } from "./shared";

export function ArchivedSection({
  elections,
  onToast,
  canLifecycle,
}: {
  elections: Election[];
  onToast: (msg: string, ok: boolean) => void;
  canLifecycle: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (elections.length === 0) return null;

  function handleRestore(id: string) {
    startTransition(async () => {
      const res = await restoreElection(id);
      onToast(res.success ? "Election restored" : res.error, res.success);
      if (res.success) router.refresh();
    });
  }

  return (
    <div className="bg-admin-surface border border-white/[0.07] rounded-[12px] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 px-[14px] py-[10px] cursor-pointer border-b border-white/[0.07] bg-transparent w-full hover:bg-white/[0.025] focus-visible:outline-none focus-visible:bg-white/[0.04] transition-colors"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/40 flex-1 text-left">
          Archived
        </span>
        <span className="text-[10px] bg-white/[0.06] text-white/40 rounded-full px-[7px] py-[1px]">
          {elections.length}
        </span>
        <svg
          className={`w-3 h-3 text-white/40 ml-[6px] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open &&
        elections.map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-3 px-[14px] py-[10px] border-b border-white/[0.04] last:border-0"
          >
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-white/70 truncate">{e.name}</div>
              <div className="text-[10px] text-white/30 mt-[1px]">
                {DIVISION_LABELS[e.division] ?? e.division} · archived {fmt(e.archivedAt)}
              </div>
            </div>
            {canLifecycle && (
              <button
                type="button"
                onClick={() => handleRestore(e.id)}
                disabled={isPending}
                className="text-[10px] text-gold bg-gold/[0.08] border border-gold/20 rounded-[5px] px-[9px] py-[4px] hover:bg-gold/[0.15] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 transition-all disabled:opacity-40"
              >
                Restore
              </button>
            )}
          </div>
        ))}
    </div>
  );
}
