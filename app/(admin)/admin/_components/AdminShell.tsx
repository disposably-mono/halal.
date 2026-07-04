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
        className="sr-only focus:not-sr-only focus:absolute focus:left-[13px] focus:top-[13px] focus:z-9999 focus:rounded-[8px] focus:bg-gold focus:px-[18px] focus:py-[9px] focus:text-[13px] focus:font-semibold focus:text-admin-bg focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:outline-hidden"
      >
        Skip to content
      </a>

      {/* Topbar */}
      <nav className="h-[63px] flex items-center justify-between px-[18px] sm:px-[22px] sticky top-[0px] z-50 shrink-0 border-b border-white/[0.07] bg-admin-surface/95 backdrop-blur-sm transition-colors">
        <div className="flex items-center gap-[9px]">
          <button
            ref={hamburgerRef}
            type="button"
            aria-expanded={drawerOpen}
            aria-controls="admin-drawer"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            onClick={() => setDrawerOpen((open) => !open)}
            className="flex h-[49px] w-[49px] items-center justify-center rounded-[8px] text-white/70 hover:bg-white/6 hover:text-white/90 transition-colors lg:hidden focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:outline-hidden"
          >
            {drawerOpen ? (
              <X aria-hidden="true" className="h-[22px] w-[22px]" />
            ) : (
              <Menu aria-hidden="true" className="h-[22px] w-[22px]" />
            )}
          </button>
          <div className="flex items-baseline gap-[2px] font-display">
            <span className="text-[21px] tracking-[-0.4px] text-white/90">
              halal<span className="text-gold">.</span>
            </span>
            <span className="hidden sm:inline text-[12px] text-white/40 ml-[9px] font-sans font-normal">Admin Panel</span>
          </div>
        </div>
        <div className="flex items-center gap-[13px]">
          <span className="hidden sm:inline text-[12px] text-white/50">
            {new Date().toLocaleDateString("en-PH", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
          <div className="w-[31px] h-[31px] rounded-full flex items-center justify-center text-[11px] font-bold text-gold shrink-0 border border-gold/30 bg-linear-to-br from-gold/30 to-gold/10">
            {adminInitial}
          </div>
          <span className="hidden sm:inline max-w-[157px] truncate text-[12px] text-white/50">{adminName}</span>
          {signOutForm}
        </div>
      </nav>

      {/* Body */}
      <div className="relative flex flex-1 overflow-hidden lg:h-[calc(100vh-3.5rem)]">
        {/* Desktop sidebar (lg+) */}
        <nav
          aria-label="Admin navigation"
          className={cn(
            "hidden shrink-0 flex-col overflow-hidden border-r border-white/[0.07] bg-admin-surface transition-[width] duration-200 lg:sticky lg:top-[63px] lg:flex lg:h-[calc(100vh-3.5rem)]",
            sidebarCollapsed ? "w-[72px]" : "w-[246px]",
          )}
        >
          <div className="min-h-[0px] flex-1 overflow-y-auto py-[18px]">
            {navContent(sidebarCollapsed)}
          </div>
          <div className={cn("flex border-t border-white/[0.07] px-[13px] py-[13px]", sidebarCollapsed ? "justify-center" : "justify-end")}>
            <button
              type="button"
              aria-label={sidebarCollapsed ? "Expand admin panel" : "Collapse admin panel"}
              title={sidebarCollapsed ? "Expand admin panel" : "Collapse admin panel"}
              onClick={() => setSidebarCollapsed((value) => !value)}
              className={cn(
                "inline-flex h-[40px] items-center justify-center rounded-[8px] border border-white/8 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/45 transition-colors hover:bg-white/5 hover:text-white/75 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gold/45",
                sidebarCollapsed ? "w-[40px]" : "px-[13px]",
              )}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen aria-hidden="true" className="h-[18px] w-[18px]" />
              ) : (
                <>
                  <span>Collapse</span>
                  <span className="mx-[9px] h-[18px] w-px bg-white/15" aria-hidden="true" />
                  <PanelLeftClose aria-hidden="true" className="h-[18px] w-[18px]" />
                </>
              )}
            </button>
          </div>
        </nav>

        {/* Off-canvas drawer (below lg) */}
        {drawerOpen && (
          <>
            <div
              className="fixed inset-[0px] z-40 bg-black/60 lg:hidden"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <div
              id="admin-drawer"
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Admin navigation"
              className="fixed inset-y-[0px] left-[0px] z-50 flex w-[291px] max-w-[80vw] flex-col gap-[2px] overflow-y-auto border-r border-white/[0.07] bg-admin-surface py-[18px] shadow-2xl animate-in slide-in-from-left duration-200 lg:hidden"
            >
              {navContent(false)}
            </div>
          </>
        )}

        {/* Page content */}
        <main id="admin-main" className="min-w-[0px] flex-1 overflow-auto scroll-smooth lg:h-[calc(100vh-3.5rem)]">
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
    return <div className="mx-auto my-[13px] h-px w-[31px] bg-white/10" aria-hidden="true" />;
  }

  return (
    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/40 px-[18px] pt-[13px] pb-[4px]">
      {label}
    </div>
  );
}
