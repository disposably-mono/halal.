import type { ReactNode } from "react";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { ActiveNavItem } from "./ActiveNavItem";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const adminName = session.user?.name ?? "Admin";
  const adminInitial = adminName[0]?.toUpperCase() ?? "A";

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/admin/login" });
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0b1220" }}>
      {/* ── Topbar ── */}
      <nav
        className="h-[52px] flex items-center justify-between px-5 sticky top-0 z-50 flex-shrink-0"
        style={{ background: "#131c2e", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-baseline gap-[2px]">
          <span className="text-[17px] font-bold tracking-[-0.6px] text-white/90">
            halal<span className="text-amber-400">.</span>
          </span>
          <span className="text-[11px] text-white/30 ml-2 font-normal">Admin Panel</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-white/40">
            {new Date().toLocaleDateString("en-PH", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-amber-400 flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(251,191,36,0.3), rgba(251,191,36,0.1))",
              border: "1px solid rgba(251,191,36,0.3)",
            }}
          >
            {adminInitial}
          </div>
          <span className="text-[11px] text-white/40">{adminName}</span>
          <form action={handleSignOut}>
            <button
              type="submit"
              aria-label="Sign out"
              className="text-[11px] text-white/40 hover:text-white/70 transition-colors cursor-pointer bg-transparent border-0 rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
            >
              Sign out
            </button>
          </form>
        </div>
      </nav>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <nav
          className="w-[200px] flex-shrink-0 flex flex-col gap-[2px] py-4 overflow-y-auto"
          style={{ background: "#131c2e", borderRight: "1px solid rgba(255,255,255,0.07)" }}
        >
          <NavSection label="Overview" />
          <ActiveNavItem exact href="/admin" label="Dashboard" icon={
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
          } />

          <NavSection label="Elections" />
          <ActiveNavItem href="/admin/elections/new" label="New Election" icon={
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          } />

          <NavSection label="Reports" />
          <ActiveNavItem href="/admin/results" label="Results" icon={
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          } />
          <ActiveNavItem href="/admin/voters" label="Voters" icon={
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          } />
          <ActiveNavItem href="/admin/candidates" label="Candidates" icon={
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          } />
        </nav>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavSection({ label }: { label: string }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/[0.14] px-4 pt-3 pb-1">
      {label}
    </div>
  );
}
