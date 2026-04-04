import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MonitorClient from "./MonitorClient";
import Link from "next/link";
import { StatusPill, ElectionSubNav } from "@/app/admin/ui";

export const dynamic = "force-dynamic";

export default async function MonitorPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const election = await prisma.election.findUnique({
    where: { id: params.id },
    select: {
      id: true, name: true, division: true, status: true,
      _count: { select: { voters: true } },
    },
  });

  if (!election) redirect("/admin");

  return (
    <div className="min-h-screen bg-[#0b1220] font-sans">
      {/* ── Topbar ── */}
      <nav className="sticky top-0 z-10 border-b border-white/[0.08] bg-[#131c2e]">
        <div className="mx-auto flex h-[52px] max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-[11px] text-white/30 transition-colors hover:text-white/60">
              ← Dashboard
            </Link>
            <span className="text-white/10">/</span>
            <span className="max-w-[200px] truncate text-[11px] text-white/60">{election.name}</span>
            <span className="text-white/10">/</span>
            <span className="text-[11px] text-white/35">Monitor</span>
          </div>
          <StatusPill status={election.status as "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED"} />
        </div>
        {/* ── Sub-nav tab strip ── */}
        <ElectionSubNav
          electionId={election.id}
          status={election.status as "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED"}
        />
      </nav>

      <MonitorClient
        electionId={election.id}
        electionName={election.name}
        division={election.division}
        status={election.status}
        totalVoters={election._count.voters}
      />
    </div>
  );
}
