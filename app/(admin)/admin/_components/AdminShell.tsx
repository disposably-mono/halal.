"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { ActiveNavItem } from "../ActiveNavItem";
import { NavIcon } from "./NavIcon";
import type { NavSectionModel } from "./nav-model";
import { cn } from "@/lib/utils";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function AdminShell({
  sections,
  adminName,
  adminInitial,
  signOutForm,
  children,
}: {
  sections: NavSectionModel[];
  adminName: string;
  adminInitial: string;
  signOutForm: ReactNode;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on route change.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Body scroll lock while the drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  // Escape closes the drawer; focus trap keeps Tab cycling inside it while open.
  useEffect(() => {
    if (!drawerOpen) return;

    const drawerNode = drawerRef.current;
    const focusables = drawerNode
      ? Array.from(drawerNode.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      : [];
    focusables[0]?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        return;
      }
      if (e.key !== "Tab" || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  // Return focus to the hamburger whenever the drawer closes.
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (!drawerOpen && wasOpenRef.current) {
      hamburgerRef.current?.focus();
    }
    wasOpenRef.current = drawerOpen;
  }, [drawerOpen]);

  const navContent = (collapsed = false) => (
    <>
      {sections.map((section) => (
        <div key={section.label}>
          <NavSectionLabel label={section.label} collapsed={collapsed} />
          {section.items.map((item) => (
            <ActiveNavItem
              key={item.href}
              href={item.href}
              label={item.label}
              exact={item.exact}
              icon={<NavIcon iconKey={item.iconKey} />}
              collapsed={collapsed}
            />
          ))}
        </div>
      ))}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-admin-bg">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-9999 focus:rounded-[7px] focus:bg-gold focus:px-4 focus:py-2 focus:text-[12px] focus:font-semibold focus:text-admin-bg focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:outline-hidden"
      >
        Skip to content
      </a>

      {/* Topbar */}
      <nav className="h-14 flex items-center justify-between px-4 sm:px-5 sticky top-0 z-50 shrink-0 border-b border-white/[0.07] bg-admin-surface/95 backdrop-blur-sm transition-colors">
        <div className="flex items-center gap-2">
          <button
            ref={hamburgerRef}
            type="button"
            aria-expanded={drawerOpen}
            aria-controls="admin-drawer"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            onClick={() => setDrawerOpen((open) => !open)}
            className="flex h-11 w-11 items-center justify-center rounded-[7px] text-white/70 hover:bg-white/6 hover:text-white/90 transition-colors lg:hidden focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:outline-hidden"
          >
            {drawerOpen ? (
              <X aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Menu aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
          <div className="flex items-baseline gap-[2px] font-display">
            <span className="text-[19px] tracking-[-0.4px] text-white/90">
              halal<span className="text-gold">.</span>
            </span>
            <span className="hidden sm:inline text-[11px] text-white/40 ml-2 font-sans font-normal">Admin Panel</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[11px] text-white/50">
            {new Date().toLocaleDateString("en-PH", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-gold shrink-0 border border-gold/30 bg-linear-to-br from-gold/30 to-gold/10">
            {adminInitial}
          </div>
          <span className="hidden sm:inline max-w-[140px] truncate text-[11px] text-white/50">{adminName}</span>
          {signOutForm}
        </div>
      </nav>

      {/* Body */}
      <div className="relative flex flex-1 overflow-hidden lg:h-[calc(100vh-3.5rem)]">
        {/* Desktop sidebar (lg+) */}
        <nav
          aria-label="Admin navigation"
          className={cn(
            "hidden shrink-0 flex-col overflow-hidden border-r border-white/[0.07] bg-admin-surface transition-[width] duration-200 lg:sticky lg:top-14 lg:flex lg:h-[calc(100vh-3.5rem)]",
            sidebarCollapsed ? "w-[64px]" : "w-[220px]",
          )}
        >
          <div className="min-h-0 flex-1 overflow-y-auto py-4">
            {navContent(sidebarCollapsed)}
          </div>
          <div className={cn("flex border-t border-white/[0.07] px-3 py-3", sidebarCollapsed ? "justify-center" : "justify-end")}>
            <button
              type="button"
              aria-label={sidebarCollapsed ? "Expand admin panel" : "Collapse admin panel"}
              title={sidebarCollapsed ? "Expand admin panel" : "Collapse admin panel"}
              onClick={() => setSidebarCollapsed((value) => !value)}
              className={cn(
                "inline-flex h-9 items-center justify-center rounded-[7px] border border-white/8 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45 transition-colors hover:bg-white/5 hover:text-white/75 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gold/45",
                sidebarCollapsed ? "w-9" : "px-3",
              )}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen aria-hidden="true" className="h-4 w-4" />
              ) : (
                <>
                  <span>Collapse</span>
                  <span className="mx-2 h-4 w-px bg-white/15" aria-hidden="true" />
                  <PanelLeftClose aria-hidden="true" className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </nav>

        {/* Off-canvas drawer (below lg) */}
        {drawerOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <div
              id="admin-drawer"
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Admin navigation"
              className="fixed inset-y-0 left-0 z-50 flex w-[260px] max-w-[80vw] flex-col gap-[2px] overflow-y-auto border-r border-white/[0.07] bg-admin-surface py-4 shadow-2xl animate-in slide-in-from-left duration-200 lg:hidden"
            >
              {navContent(false)}
            </div>
          </>
        )}

        {/* Page content */}
        <main id="admin-main" className="min-w-0 flex-1 overflow-auto scroll-smooth lg:h-[calc(100vh-3.5rem)]">
          <div key={pathname} className="min-h-full animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavSectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) {
    return <div className="mx-auto my-3 h-px w-7 bg-white/10" aria-hidden="true" />;
  }

  return (
    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40 px-4 pt-3 pb-1">
      {label}
    </div>
  );
}
