"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AdminCardTitle } from "./card";
import { Disclosure, DisclosureChevron } from "./disclosure";

export function AccordionCard({
  title,
  meta,
  children,
  defaultOpen = false,
  open,
  onOpenChange,
  noPad,
  className,
  contentClassName,
}: {
  title: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  noPad?: boolean;
  className?: string;
  contentClassName?: string;
}) {
  const resolvedContentClassName = contentClassName ?? (noPad ? "border-t border-white/6" : "border-t border-white/6 p-[18px]");

  return (
    <Disclosure
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      className={cn("overflow-hidden rounded-[13px] border border-white/[0.07] bg-admin-surface/70", className)}
      contentClassName={resolvedContentClassName}
      trigger={({ open }) => (
        <div className="flex items-center gap-[13px] px-[18px] py-[13px] transition-colors hover:bg-white/2.5 focus-visible:bg-white/4">
          <AdminCardTitle className="text-white/45">{title}</AdminCardTitle>
          <span className="h-px flex-1 bg-white/5" />
          {meta && (
            <span className="min-w-[0px] text-[11px] text-white/55">
              {meta}
            </span>
          )}
          <span className="hidden rounded-full border border-white/8 bg-white/3 px-[9px] py-[4px] text-[11px] text-white/40 sm:inline">
            {open ? "Click to collapse" : "Click to expand"}
          </span>
          <DisclosureChevron open={open} />
        </div>
      )}
    >
      {children}
    </Disclosure>
  );
}
