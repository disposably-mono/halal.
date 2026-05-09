import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ControlClient from "./ControlClient";
import Link from "next/link";
import { StatusPill, ElectionSubNav, SetupStepper } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export default async function ControlPage({ params }: PageProps) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const [election, auditLogs] = await Promise.all([
    prisma.election.findUnique({
      where: { id: params.id },
      select: {
        id: true, name: true, division: true, status: true,
        scheduledOpen: true, scheduledClose: true,
        candidatesFinalized: true, votersFinalized: true,
        _count: { select: { voters: true, votes: true } },
      },
    }),
    prisma.auditLog.findMany({
      where: { electionId: params.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!election) notFound();

  const votedCount = await prisma.voter.count({
    where: { electionId: params.id, hasVoted: true },
  });

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
            <span className="text-[11px] text-white/35">Control</span>
          </div>
          <div className="flex items-center gap-3">
            <SetupStepper
              candidatesFinalized={election.candidatesFinalized}
              votersFinalized={election.votersFinalized}
              status={election.status as "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED"}
            />
            <StatusPill status={election.status as "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED"} />
          </div>
        </div>
        {/* ── Sub-nav tab strip ── */}
        <ElectionSubNav
          electionId={election.id}
          status={election.status as "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED"}
        />
      </nav>

      <ControlClient
        election={{ ...election, votedCount }}
        auditLogs={auditLogs}
      />
    </div>
  );
}
