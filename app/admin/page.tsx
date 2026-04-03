import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const [elections, globalVoterCount] = await Promise.all([
    prisma.election.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        division: true,
        status: true,
        scheduledOpen: true,
        scheduledClose: true,
        _count: {
          select: {
            voters: true,
            votes: true,
            positions: true,
            candidates: true,  // requires Candidate relation on Election in schema
          },
        },
      },
    }),
    // Global unique control number count across all elections
    prisma.voter.count(),
  ]);

  // Per-election voted counts (hasVoted=true rows, not vote row count)
  const votedCounts = await Promise.all(
    elections.map((e) =>
      prisma.voter.count({ where: { electionId: e.id, hasVoted: true } })
    )
  );

  const electionsWithVoted = elections.map((e, i) => ({
    ...e,
    votedCount: votedCounts[i],
  }));

  const adminName = session.user?.name ?? "Admin";
  const adminInitial = adminName[0]?.toUpperCase() ?? "A";

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/admin/login" });
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0b1220" }}>
      {/* Topbar */}
      <nav
        className="h-[52px] flex items-center justify-between px-5 sticky top-0 z-50"
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
            {new Date().toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" })}
          </span>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-amber-400"
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
              className="text-[11px] text-white/[0.14] hover:text-white/60 transition-colors cursor-pointer bg-transparent border-0"
            >
              Sign out
            </button>
          </form>
        </div>
      </nav>

      {/* Body */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <nav
          className="w-[200px] flex-shrink-0 flex flex-col gap-[2px] py-4"
          style={{ background: "#131c2e", borderRight: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/[0.14] px-4 pt-3 pb-1">Overview</div>
          <SidebarItem href="/admin" label="Dashboard" active icon={
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
          } />

          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/[0.14] px-4 pt-3 pb-1">Elections</div>
          <SidebarItem href="/admin/elections/new" label="New Election" icon={
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          } />

          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/[0.14] px-4 pt-3 pb-1">Reports</div>
          <SidebarItem href="/admin/results" label="Results" icon={
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          } />
          <SidebarItem href="/admin/voters" label="Voters" icon={
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          } />
          <SidebarItem href="/admin/candidates" label="Candidates" icon={
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          } />
        </nav>

        {/* Main */}
        <main className="flex-1 overflow-auto p-6 flex flex-col gap-[18px] min-w-0">
          <DashboardClient
            elections={electionsWithVoted}
            globalVoterCount={globalVoterCount}
          />
        </main>
      </div>
    </div>
  );
}

function SidebarItem({
  href, label, icon, active = false,
}: {
  href: string; label: string; icon: React.ReactNode; active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-4 py-[7px] text-[12px] transition-all relative no-underline
        ${active ? "text-white/90 bg-white/[0.05]" : "text-white/30 hover:text-white/60 hover:bg-white/[0.03]"}`}
    >
      {active && <span className="absolute left-0 top-1/4 bottom-1/4 w-[2px] bg-amber-400 rounded-r-[2px]" />}
      <span className={active ? "opacity-100" : "opacity-70"}>{icon}</span>
      {label}
    </Link>
  );
}
