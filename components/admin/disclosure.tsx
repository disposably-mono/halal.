"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AnimatedCollapse } from "./animated-collapse";

/**
 * Shared accordion primitive so every collapsible section in the admin panel
 * (filter groups, voter/candidate division & election groups) animates the
 * same way, instead of each area rolling its own (or, as with native
 * <details>, none at all).
 */
export function Disclosure({
  trigger,
  defaultOpen = false,
  className,
  contentClassName,
  children,
}: {
  trigger: (state: { open: boolean }) => ReactNode;
  defaultOpen?: boolean;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();
  const toggle = () => setOpen((value) => !value);

  // Re-sync when the caller's defaultOpen flips (e.g. isFiltering turning on/off)
  // instead of forcing a remount via `key` — a remount would swap in an
  // already-closed instance for the collapse case, skipping the animation.
  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);

  return (
    <div className={className}>
      {/*
        A plain div (not <button>) because some triggers embed a nested
        interactive Link (e.g. "Manage") — nesting <a> inside <button> is
        invalid HTML and swallows the link's click. The Link stops
        propagation on its own click to opt out of the toggle.
      */}
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle();
          }
        }}
        aria-expanded={open}
        aria-controls={contentId}
        className="w-full cursor-pointer text-left outline-hidden"
      >
        {trigger({ open })}
      </div>
      <AnimatedCollapse id={contentId} open={open}>
        <div className={contentClassName}>{children}</div>
      </AnimatedCollapse>
    </div>
  );
}

export function DisclosureChevron({ open, className }: { open: boolean; className?: string }) {
  return (
    <span className={cn("text-[13px] text-gold transition-transform duration-200", open && "rotate-90", className)}>
      ›
    </span>
  );
}
