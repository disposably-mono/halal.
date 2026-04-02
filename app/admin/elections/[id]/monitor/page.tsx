import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MonitorClient from "./MonitorClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MonitorPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const election = await prisma.election.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      division: true,
      status: true,
      _count: { select: { voters: true } },
    },
  });

  if (!election) redirect("/admin");

  return (
    <div className="min-h-screen bg-[#0b1220] font-sans">
      {/* Topbar */}
      <nav className="sticky top-0 z-10 border-b border-white/[0.08] bg-[#131c2e]">
        <div className="mx-auto flex h-[52px] max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-white/30 hover:text-white/60 transition-colors text-[12px]"
            >
              ← Dashboard
            </Link>
            <span className="text-white/10">/</span>
            <span className="text-[12px] text-white/60 truncate max-w-[200px]">
              {election.name}
            </span>
            <span className="text-white/10">/</span>
            <span className="text-[12px] text-white/40">Monitor</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase border px-2 py-1 rounded-full
              ${election.status === "OPEN"
                ? "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-400"
                : election.status === "CLOSED"
                  ? "border-white/10 text-white/30"
                  : "border-blue-400/30 text-blue-400"
              }`}
            >
              {election.status === "OPEN" && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
              {election.status}
            </span>
          </div>
        </div>
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
