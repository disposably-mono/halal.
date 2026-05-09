import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  StatusPill,
  FinalizeBanner,
  Card,
  FinalizeButton,
  ElectionSubNav,
  SetupStepper,
} from "@/components/admin/ui";
import { CSVUploadForm, ManualAddForm } from "./VoterForms";
import { finalizeVoters, unfinalizeVoters, removeVoterById } from "./actions";

export const dynamic = "force-dynamic";

const SCHOOL_YEAR = new Date().getFullYear();

export default async function VotersPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const election = await prisma.election.findUnique({
    where: { id: params.id },
    select: {
      id: true, name: true, division: true, status: true,
      votersFinalized: true, candidatesFinalized: true,
      _count: { select: { voters: true } },
    },
  });
  if (!election) redirect("/admin");

  const voters = await prisma.voter.findMany({
    where: { electionId: params.id },
    orderBy: [{ gradeLevel: "asc" }, { section: "asc" }, { studentId: "asc" }],
    select: {
      id: true, voterCode: true, studentId: true,
      gradeLevel: true, section: true, hasVoted: true,
    },
  });

  const canUnlock = election.status !== "OPEN" && election.status !== "CLOSED";

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
            <span className="text-[11px] text-white/35">Voters</span>
          </div>
          <StatusPill status={election.status as "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED"} />
        </div>
        <ElectionSubNav
          electionId={election.id}
          status={election.status as "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED"}
        />
      </nav>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-white/30">{election.name}</p>
            <h1 className="text-[22px] font-semibold tracking-tight text-white/90">Voter List</h1>
          </div>
          <SetupStepper
            candidatesFinalized={election.candidatesFinalized}
            votersFinalized={election.votersFinalized}
            status={election.status as "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED"}
          />
        </div>

        <FinalizeBanner
          locked={election.votersFinalized}
          lockedText="Voter list is locked"
          lockedSub={
            canUnlock
              ? "Voters cannot be added or removed while locked."
              : "Cannot be unlocked while election is Open or Closed."
          }
          unlockedText="Voter list is editable"
          unlockedSub="Finalize to lock the list before opening the election."
          unlockAction={election.votersFinalized ? unfinalizeVoters : undefined}
          electionId={election.id}
          canUnlock={canUnlock}
        />

        {!election.votersFinalized && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="CSV Import">
              <CSVUploadForm
                electionId={election.id}
                schoolYear={SCHOOL_YEAR}
                isFinalized={election.votersFinalized}
              />
            </Card>
            <Card title="Manual Add">
              <ManualAddForm
                electionId={election.id}
                schoolYear={SCHOOL_YEAR}
                isFinalized={election.votersFinalized}
              />
            </Card>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#1a2540]">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40">Registered Voters</span>
            <span className="text-[10px] text-white/25">{election._count.voters} total</span>
          </div>
          <div className="flex items-center gap-3 border-b border-white/[0.05] bg-white/[0.02] px-4 py-2">
            <span className="w-[100px] shrink-0 text-[9px] font-semibold uppercase tracking-[0.08em] text-white/25">Voter Code</span>
            <span className="flex-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-white/25">Student ID</span>
            <span className="w-[60px] shrink-0 text-[9px] font-semibold uppercase tracking-[0.08em] text-white/25">Grade</span>
            <span className="w-[70px] shrink-0 text-[9px] font-semibold uppercase tracking-[0.08em] text-white/25">Section</span>
            <span className="w-[60px] shrink-0 text-[9px] font-semibold uppercase tracking-[0.08em] text-white/25">Voted</span>
            <span className="w-6 shrink-0" />
          </div>
          {voters.length === 0 ? (
            <p className="py-10 text-center text-[12px] text-white/30">No voters registered yet.</p>
          ) : (
            <div className="max-h-[420px] overflow-y-auto divide-y divide-white/[0.04]">
              {voters.map((voter) => (
                <div key={voter.id} className="flex items-center gap-3 px-4 py-[7px] text-[11px]">
                  <span className="w-[100px] shrink-0 font-mono text-[10px] text-amber-400/80">{voter.voterCode}</span>
                  <span className="flex-1 font-mono text-white/70">{voter.studentId}</span>
                  <span className="w-[60px] shrink-0 text-white/40">Gr. {voter.gradeLevel}</span>
                  <span className="w-[70px] shrink-0 text-white/40">{voter.section}</span>
                  <span className="w-[60px] shrink-0">
                    {voter.hasVoted
                      ? <span className="text-[10px] font-semibold text-emerald-400">✓ Voted</span>
                      : <span className="text-[10px] text-white/20">—</span>}
                  </span>
                  {!election.votersFinalized ? (
                    <form action={removeVoterById.bind(null, voter.id, params.id)}>
                      <button type="submit" className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-white/[0.14] transition-colors hover:text-red-400" title="Remove voter" aria-label={`Remove voter ${voter.studentId}`}>
                        ×
                      </button>
                    </form>
                  ) : (
                    <span className="w-6 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {!election.votersFinalized && (
          <FinalizeButton
            action={finalizeVoters}
            electionId={election.id}
            label="Lock Voter List"
            hint={`${election._count.voters} voter${election._count.voters !== 1 ? "s" : ""} registered — lock the list when ready`}
          />
        )}
      </main>
    </div>
  );
}
