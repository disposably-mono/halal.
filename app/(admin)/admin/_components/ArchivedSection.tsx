"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { restoreElection } from "../actions";
import { DIVISION_LABELS } from "@/lib/ui/division-labels";
import { AccordionCard, EmptyState, highlightMatch, type ToastVariant } from "@/components/admin/ui";
import { fmt, type Election } from "./shared";

export function ArchivedSection({
  elections,
  totalCount = elections.length,
  query = "",
  defaultOpen = false,
  onToast,
  canLifecycle,
}: {
  elections: Election[];
  totalCount?: number;
  query?: string;
  defaultOpen?: boolean;
  onToast: (msg: string, variant: ToastVariant) => void;
  canLifecycle: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);

  function handleRestore(id: string) {
    startTransition(async () => {
      const res = await restoreElection(id);
      onToast(res.success ? "Election restored" : res.error, res.success ? "success" : "error");
      if (res.success) router.refresh();
    });
  }

  return (
    <AccordionCard
      title="Archived"
      meta={
        <span>
          {elections.length} of {totalCount} shown
        </span>
      }
      open={open}
      onOpenChange={setOpen}
      noPad
    >
      {elections.length === 0 ? (
        <div className="p-[13px]">
          <EmptyState title="No archived elections match" hint="Try a different search or status filter." />
        </div>
      ) : (
        elections.map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-[13px] px-[16px] py-[11px] border-b border-white/4 last:border-0"
          >
            <div className="flex-1 min-w-[0px]">
              <div className="text-[13px] font-medium text-white/70 truncate">{highlightMatch(e.name, query)}</div>
              <div className="text-[11px] text-white/30 mt-px">
                {highlightMatch(DIVISION_LABELS[e.division] ?? e.division, query)} · archived{" "}
                {e.archivedAt ? fmt(e.archivedAt) : "—"}
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
        ))
      )}
    </AccordionCard>
  );
}
