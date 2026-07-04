import { notFound } from "next/navigation";
import { requireCapability } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/auth/permissions";
import ControlClient from "./ControlClient";
import Link from "next/link";
import { StatusPill, ElectionSubNav, SetupStepper } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ControlPage(props: PageProps) {
  const params = await props.params;
  // Election status, schedule, and audit/recount internals are read here, so
  // viewing requires elections:view. Mutation controls below are separately
  // gated on election:lifecycle / election:close / recounts:run.
  const session = await requireCapability("elections:view");

  const canLifecycle = can(session.user?.role, "election:lifecycle");
  const canClose = can(session.user?.role, "election:close");
  const canRecount = can(session.user?.role, "recounts:run");

  const [election, auditLogs] = await Promise.all([
    prisma.election.findUnique({
      where: { id: params.id },
      select: {
        id: true, name: true, division: true, status: true,
        scheduledOpen: true, scheduledClose: true,
        candidatesFinalized: true, votersFinalized: true,
        archivedAt: true, archivedBy: true,
        auditFingerprint: true, auditVersion: true,
        certification: { select: { snapshotHash: true, createdAt: true, createdBy: true } },
        recounts: {
          orderBy: { createdAt: "desc" },
          select: { id: true, createdAt: true, initiatedBy: true, matchesOfficial: true, ballotCount: true, validBallots: true, invalidBallots: true, discrepancies: true },
        },
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
    <div className="min-h-screen bg-admin-bg font-sans">
      {/* ── Topbar ── */}
      <nav className="sticky top-[0px] z-10 border-b border-white/8 bg-admin-surface">
        <div className="mx-auto flex min-h-[58px] max-w-7xl flex-col gap-[9px] px-[18px] py-[13px] md:flex-row md:items-center md:justify-between md:px-[27px] md:py-[0px]">
          <div className="flex min-w-[0px] items-center gap-[9px]">
            <Link href="/admin" className="text-[12px] text-white/40 transition-colors hover:text-white/60">
              ← Dashboard
            </Link>
            <span className="text-white/10">/</span>
            <span className="min-w-[0px] max-w-[202px] truncate text-[12px] text-white/60 sm:max-w-[269px]">{election.name}</span>
            <span className="text-white/10">/</span>
            <span className="text-[12px] text-white/45">Control</span>
          </div>
          <div className="flex items-center gap-[13px] md:justify-end">
            <div className="hidden md:block">
              <SetupStepper
                candidatesFinalized={election.candidatesFinalized}
                votersFinalized={election.votersFinalized}
                status={election.status as "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED"}
              />
            </div>
            <StatusPill status={election.status as "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED"} />
          </div>
        </div>
        {/* ── Sub-nav tab strip ── */}
        <ElectionSubNav
          electionId={election.id}
          status={election.status as "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED"}
          candidatesFinalized={election.candidatesFinalized}
          votersFinalized={election.votersFinalized}
        />
      </nav>

      <ControlClient
        election={{ ...election, votedCount }}
        auditLogs={auditLogs}
        canLifecycle={canLifecycle}
        canClose={canClose}
        canRecount={canRecount}
      />
    </div>
  );
}
