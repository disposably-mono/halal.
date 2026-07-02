import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { parseGrades, formatGradeList } from "@/lib/domain/grade-format";
import { DIVISION_POSITIONS, gradesForDivision } from "@/lib/elections/constants";
import { can } from "@/lib/auth/permissions";
import {
  StatusPill,
  FinalizeBanner,
  Card,
  AdminCardTitle,
  AdminInput,
  FinalizeButton,
  ElectionSubNav,
  SetupStepper,
  SetupNextStep,
} from "@/components/admin/ui";
import { ThemedSelect } from "@/components/admin/ThemedSelect";
import { Button } from "@/components/ui/button";
import {
  seedAllPositions,
  addSinglePosition,
  removePosition,
  addCandidate,
  removeCandidate,
  finalizeCandidates,
  unfinalizeCandidates,
} from "./actions";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return name.trim().split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

export default async function CandidatesPage({ params }: { params: { id: string } }) {
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

  const positions = await prisma.position.findMany({
    where: { electionId: params.id, isActive: true },
    orderBy: { order: "asc" },
    include: { candidates: { orderBy: { fullName: "asc" } } },
  });
  const fullRange = gradesForDivision(election.division);

  const allPositionDefs = DIVISION_POSITIONS[election.division] ?? [];
  const existingTitles = new Set(positions.map((p) => p.title));
  const availablePositions = allPositionDefs.filter((p) => !existingTitles.has(p.title));

  const canManageCandidates = can(session.user?.role, "candidates:manage");
  const canUnlock =
    canManageCandidates &&
    election.status !== "OPEN" &&
    election.status !== "CLOSED";
  const isLocked = election.candidatesFinalized;
  const canEditCandidates = canManageCandidates && !isLocked;
  const totalCandidates = positions.reduce((sum, p) => sum + p.candidates.length, 0);
  const emptyPositions = positions.filter((p) => p.candidates.length === 0);

  return (
    <div className="min-h-screen bg-admin-bg font-sans">
      {/* ── Topbar ── */}
      <nav className="sticky top-0 z-10 border-b border-white/[0.08] bg-admin-surface">
        <div className="mx-auto flex h-[52px] max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-[11px] text-white/40 transition-colors hover:text-white/60">
              ← Dashboard
            </Link>
            <span className="text-white/10">/</span>
            <span className="max-w-[200px] truncate text-[11px] text-white/60">{election.name}</span>
            <span className="text-white/10">/</span>
            <span className="text-[11px] text-white/45">Candidates</span>
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

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">

        {/* ── Page header + stepper ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-white/40">{election.name}</p>
            <h1 className="text-[22px] font-semibold tracking-tight text-white/90">Candidates</h1>
          </div>
          <SetupStepper
            candidatesFinalized={election.candidatesFinalized}
            votersFinalized={election.votersFinalized}
            status={election.status as "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED"}
          />
        </div>

        {/* ── Finalize banner — FIXED: uses unlockAction + electionId props ── */}
        <FinalizeBanner
          locked={isLocked}
          lockedText="Candidate list is locked"
          lockedSub={
            canUnlock
              ? "Candidates cannot be added or removed while locked."
              : "Cannot be unlocked while election is Open or Closed."
          }
          unlockedText="Candidate list is editable"
          unlockedSub="Lock the list once all candidates are confirmed."
          unlockAction={isLocked ? unfinalizeCandidates : undefined}
          electionId={election.id}
          canUnlock={canUnlock}
        />

        {isLocked && election.status === "DRAFT" && !election.votersFinalized && (
          <SetupNextStep
            href={`/admin/elections/${election.id}/voters`}
            title="Candidate setup is complete"
            description="Next, register voters and lock the voter list."
            label="Continue to Voters"
          />
        )}

        {isLocked && election.status === "DRAFT" && election.votersFinalized && (
          <SetupNextStep
            href={`/admin/elections/${election.id}/control`}
            title="Election content is ready"
            description="Review the schedule and launch settings before publishing."
            label="Continue to Control"
          />
        )}

        {/* ── Position management (hidden when locked or read-only role) ── */}
        {canEditCandidates && (
          <Card title="Manage Positions">
            <div className="flex flex-wrap items-center gap-2">
              {positions.length === 0 && (
                <form action={seedAllPositions}>
                  <input type="hidden" name="electionId" value={election.id} />
                  <input type="hidden" name="division" value={election.division} />
                  <Button type="submit" variant="adminPrimary" size="adminMd">Seed All Positions</Button>
                </form>
              )}
              {availablePositions.length > 0 && (
                <form action={addSinglePosition} className="flex items-center gap-2">
                  <input type="hidden" name="electionId" value={election.id} />
                  <input type="hidden" name="division" value={election.division} />
                  <ThemedSelect
                    name="title"
                    defaultValue={availablePositions[0]?.title}
                    options={availablePositions.map((p) => ({ value: p.title, label: p.title }))}
                    className="w-auto"
                  />
                  <Button type="submit" variant="adminGhost" size="adminSm">+ Add Position</Button>
                </form>
              )}
              {positions.map((pos) => (
                <form key={pos.id} action={removePosition}>
                  <input type="hidden" name="positionId" value={pos.id} />
                  <input type="hidden" name="electionId" value={election.id} />
                  <button type="submit" className="inline-flex cursor-pointer items-center gap-[6px] rounded-[6px] border border-white/[0.08] bg-white/[0.05] px-[10px] py-[5px] text-[11px] text-white/60 transition-all hover:border-red-400/25 hover:text-red-400">
                    {pos.title}
                    <span className="text-[13px] leading-none text-white/[0.18]">×</span>
                  </button>
                </form>
              ))}
            </div>
          </Card>
        )}

        {/* ── Positions + candidates ── */}
        {positions.length === 0 ? (
          <div className="rounded-xl border border-white/[0.08] bg-admin-surface px-6 py-14 text-center">
            <p className="text-[13px] text-white/40">
              No positions yet. Use &quot;Seed All Positions&quot; or add them one at a time above.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-admin-surface">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/50">
                Positions &amp; Candidates
              </span>
              <div className="flex items-center gap-3">
                {emptyPositions.length > 0 && !isLocked && (
                  <span className="text-[10px] text-gold/70">
                    {emptyPositions.length} position{emptyPositions.length !== 1 ? "s" : ""} need candidates
                  </span>
                )}
                <span className="text-[10px] text-white/60">
                  {positions.length} position{positions.length !== 1 ? "s" : ""} · {totalCandidates} candidate{totalCandidates !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {positions.map((pos) => {
                const isEmpty = pos.candidates.length === 0;
                return (
                  <details key={pos.id} open className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 select-none transition-colors hover:bg-white/[0.02]">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center text-white/35 transition-transform duration-200 group-open:rotate-90">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M2 1L6 4L2 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <div className="flex flex-1 items-center gap-2 min-w-0">
                        <AdminCardTitle>{pos.title}</AdminCardTitle>
                        <span className="text-[9px] text-white/60">
                          Votes: {formatGradeList(pos.eligibleGrades, fullRange)} · Runs: {formatGradeList(parseGrades(pos.candidateGrade), fullRange)}
                        </span>
                      </div>
                      {isEmpty && !isLocked ? (
                        <span className="shrink-0 rounded-full border border-gold/20 bg-gold/[0.07] px-[7px] py-[2px] text-[9px] font-semibold text-gold/80">
                          No candidates
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] text-white/60">
                          {pos.candidates.length} candidate{pos.candidates.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </summary>
                    <div className="border-t border-white/[0.04]">
                      {pos.candidates.length === 0 ? (
                        <p className="py-4 pl-[52px] pr-4 text-[11px] italic text-white/60">No candidates added yet</p>
                      ) : (
                        <div className="divide-y divide-white/[0.04]">
                          {pos.candidates.map((cand) => (
                            <div key={cand.id} className="flex items-center gap-3 py-[7px] pl-[52px] pr-4">
                              <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-blue-400/[0.12] text-[10px] font-semibold text-blue-400">
                                {initials(cand.fullName)}
                              </div>
                              <span className="flex-1 text-[12px] text-white/80">{cand.fullName}</span>
                              <span className="text-[10px] text-white/40">Gr. {cand.gradeLevel}</span>
                              {canEditCandidates && (
                                <form action={removeCandidate}>
                                  <input type="hidden" name="candidateId" value={cand.id} />
                                  <input type="hidden" name="electionId" value={election.id} />
                                  <button type="submit" className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-white/[0.14] transition-colors hover:text-red-400" title="Remove candidate" aria-label={`Remove ${cand.fullName}`}>
                                    ×
                                  </button>
                                </form>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {canEditCandidates && (
                        <form action={addCandidate} className="flex items-end gap-2 border-t border-white/[0.04] py-3 pl-[52px] pr-4">
                          <input type="hidden" name="positionId" value={pos.id} />
                          <input type="hidden" name="electionId" value={election.id} />
                          <div className="flex flex-1 flex-col gap-[5px]">
                            <label className="text-[10px] text-white/45">Full name</label>
                            <AdminInput name="fullName" placeholder="e.g. Maria Santos" required />
                          </div>
                          <Button type="submit" variant="adminGhost" size="adminSm" className="shrink-0">+ Add</Button>
                        </form>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        )}

        {canEditCandidates && positions.length > 0 && (
          <FinalizeButton
            action={finalizeCandidates}
            electionId={election.id}
            label="Lock Candidate List"
            hint={`${positions.length} position${positions.length !== 1 ? "s" : ""} · ${totalCandidates} candidate${totalCandidates !== 1 ? "s" : ""} · lock when ready`}
          />
        )}
      </main>
    </div>
  );
}
