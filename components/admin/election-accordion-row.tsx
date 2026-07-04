"use client";

import type { ReactNode } from "react";
import { Disclosure, DisclosureChevron } from "./disclosure";

/**
 * Shared trigger shell for the division -> election accordion rows used by
 * the Voters, Candidates, and Results index pages. Each page keeps full
 * control of its own status indicator and action link (they differ visually
 * across pages) and only hands them in as slots.
 */
export function ElectionAccordionRow({
  defaultOpen,
  statusNode,
  title,
  meta,
  actionNode,
  children,
}: {
  defaultOpen: boolean;
  statusNode: ReactNode;
  title: ReactNode;
  meta: ReactNode;
  actionNode: ReactNode;
  children: ReactNode;
}) {
  return (
    <Disclosure
      defaultOpen={defaultOpen}
      className="overflow-hidden rounded-[11px] border border-white/[0.07] bg-admin-surface"
      trigger={({ open }) => (
        <div className="flex items-center justify-between gap-[13px] border-b border-white/[0.07] px-[18px] py-[13px]">
          <div className="flex min-w-[0px] items-center gap-[13px]">
            {statusNode}
            <span className="truncate text-[13px] font-semibold text-white/80">{title}</span>
          </div>
          <div className="flex shrink-0 items-center gap-[13px] text-[11px] text-white/50">
            <span>{meta}</span>
            <span className="hidden rounded-full border border-white/8 bg-white/3 px-[9px] py-[4px] text-white/40 lg:inline">
              {open ? "Click to collapse" : "Click to expand"}
            </span>
            {actionNode}
            <DisclosureChevron open={open} />
          </div>
        </div>
      )}
    >
      {children}
    </Disclosure>
  );
}
