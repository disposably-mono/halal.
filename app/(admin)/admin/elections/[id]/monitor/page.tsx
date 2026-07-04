import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/auth/permissions";
import MonitorClient from "./MonitorClient";
import Link from "next/link";
import { StatusPill, ElectionSubNav } from "@/components/admin/ui";
import { canAccessMonitor, getMonitorFallbackHref } from "./monitor-access";

export const dynamic = "force-dynamic";

export default async function MonitorPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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
      <nav className="sticky top-[0px] z-10 border-b border-white/8 bg-admin-surface">
        <div className="mx-auto flex min-h-[58px] max-w-7xl flex-col gap-[9px] px-[18px] py-[13px] sm:flex-row sm:items-center sm:justify-between sm:px-[27px] sm:py-[0px]">
          <div className="flex min-w-[0px] items-center gap-[9px]">
            <Link href="/admin" className="text-[12px] text-white/40 transition-colors hover:text-white/60">
              ← Dashboard
            </Link>
            <span className="text-white/10">/</span>
            <span className="min-w-[0px] max-w-[202px] truncate text-[12px] text-white/60 sm:max-w-[224px]">{election.name}</span>
            <span className="text-white/10">/</span>
            <span className="text-[12px] text-white/45">Monitor</span>
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
