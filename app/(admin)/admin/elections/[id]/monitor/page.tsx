import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/auth/permissions";
import MonitorClient from "./MonitorClient";
import Link from "next/link";
import { StatusPill, ElectionSubNav } from "@/components/admin/ui";
import { canAccessMonitor, getMonitorFallbackHref } from "./monitor-access";

export const dynamic = "force-dynamic";

export default async function MonitorPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const election = await prisma.election.findUnique({
    where: { id: params.id },
    select: {
      id: true, name: true, division: true, status: true,
      candidatesFinalized: true, votersFinalized: true,
    },
  });

  if (!election) redirect("/admin");
  if (!canAccessMonitor(election.status)) redirect(getMonitorFallbackHref(election.id));

  return (
    <div className="min-h-screen bg-admin-bg font-sans">
      {/* ── Topbar ── */}
      <nav className="sticky top-0 z-10 border-b border-white/[0.08] bg-admin-surface">
        <div className="mx-auto flex min-h-[52px] max-w-7xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0">
          <div className="flex min-w-0 items-center gap-2">
            <Link href="/admin" className="text-[11px] text-white/40 transition-colors hover:text-white/60">
              ← Dashboard
            </Link>
            <span className="text-white/10">/</span>
            <span className="min-w-0 max-w-[180px] truncate text-[11px] text-white/60 sm:max-w-[200px]">{election.name}</span>
            <span className="text-white/10">/</span>
            <span className="text-[11px] text-white/45">Monitor</span>
          </div>
          <StatusPill status={election.status as "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED"} />
        </div>
        {/* ── Sub-nav tab strip ── */}
        <ElectionSubNav
          electionId={election.id}
          status={election.status as "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED"}
          candidatesFinalized={election.candidatesFinalized}
          votersFinalized={election.votersFinalized}
        />
      </nav>

      <MonitorClient
        electionId={election.id}
        electionName={election.name}
        division={election.division}
        status={election.status}
        canExportResults={can(session.user?.role, "results:export")}
      />
    </div>
  );
}
