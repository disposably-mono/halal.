"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { archiveElection } from "../actions";
import { canArchive } from "@/lib/domain/election-state";
import type { ToastVariant } from "@/components/admin/ui";
import type { Election } from "./shared";

const MENU_WIDTH = 150;

export function RowActions({
  e,
  onToast,
  canLifecycle,
}: {
  e: Election;
  onToast: (msg: string, variant: ToastVariant) => void;
  canLifecycle: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [isPending, startTransition] = useTransition();
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Position the portalled menu beneath the trigger, right-aligned, in viewport space.
  const place = useCallback(() => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({
      top: rect.bottom + 4,
      left: Math.max(8, rect.right - MENU_WIDTH),
    });
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    function onPointer(ev: MouseEvent) {
      const target = ev.target as Node;
      if (btnRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") setOpen(false);
    }
    function onReflow() {
      setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    // A portalled menu uses fixed coords; close it rather than let it drift on scroll/resize.
    window.addEventListener("scroll", onReflow, true);
    window.addEventListener("resize", onReflow);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onReflow, true);
      window.removeEventListener("resize", onReflow);
    };
  }, [open]);

  const archiveCheck = canArchive(e.status, e.archivedAt);
  const itemCls =
    "block w-full text-left px-3 py-[7px] text-[11px] text-white/70 hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:outline-none no-underline";

  function handleArchive() {
    setOpen(false);
    startTransition(async () => {
      const res = await archiveElection(e.id);
      onToast(res.success ? "Election archived" : res.error, res.success ? "success" : "error");
      if (res.success) router.refresh();
    });
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label="Election actions"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={isPending}
        onClick={() => setOpen((v) => !v)}
        className="rounded-[5px] border border-white/[0.07] px-[7px] py-[4px] text-white/40 hover:text-white/70 hover:border-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 transition-all disabled:opacity-40"
      >
        <svg style={{ width: 12, height: 12 }} viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>
      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: "fixed", top: coords.top, left: coords.left, width: MENU_WIDTH }}
            className="z-50 origin-top-right animate-dropdown-in overflow-hidden rounded-[8px] border border-white/[0.10] bg-admin-surface py-1 shadow-xl"
          >
            <Link role="menuitem" href={`/admin/elections/${e.id}/candidates`} className={itemCls}>
              Candidates
            </Link>
            <Link role="menuitem" href={`/admin/elections/${e.id}/voters`} className={itemCls}>
              Voters
            </Link>
            {(e.status === "OPEN" || e.status === "CLOSED") && (
              <Link role="menuitem" href={`/admin/elections/${e.id}/monitor`} className={itemCls}>
                Monitor
              </Link>
            )}
            <Link role="menuitem" href="/admin/results" className={itemCls}>
              Results
            </Link>
            {canLifecycle && (
              <>
                <div className="my-1 border-t border-white/[0.06]" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleArchive}
                  disabled={!archiveCheck.ok || isPending}
                  title={archiveCheck.ok ? undefined : archiveCheck.reason}
                  className={`${itemCls} disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  Archive
                </button>
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
