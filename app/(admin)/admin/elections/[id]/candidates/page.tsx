import { redirect } from "next/navigation";
import { requireCapability } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";
import { DIVISION_POSITIONS, gradesForDivision } from "@/lib/elections/constants";
import { can } from "@/lib/auth/permissions";
import {
  StatusPill,
  FinalizeBanner,
  Card,
  FinalizeButton,
  ElectionSubNav,
  SetupStepper,
  SetupNextStep,
  Breadcrumb,
  PageContainer,
  PageHeader,
} from "@/components/admin/ui";
import { ThemedSelect } from "@/components/admin/ThemedSelect";
import { Button } from "@/components/ui/button";
import { CandidatesListClient } from "./CandidatesListClient";
import {
  seedAllPositions,
  addSinglePosition,
  removePosition,
  finalizeCandidates,
  unfinalizeCandidates,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function CandidatesPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  // Candidate rosters are read here, so viewing requires candidates:view
  // (Commissioner + oversight roles). Mutation controls below are separately
  // gated on candidates:manage. Other roles are bounced to the dashboard.
  const session = await requireCapability("candidates:view");

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

  const status = election.status as "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED";

  return (
    <>
      <ElectionSubNav
        electionId={election.id}
        status={status}
        candidatesFinalized={election.candidatesFinalized}
        votersFinalized={election.votersFinalized}
      />

      <PageContainer className="max-w-5xl space-y-5">
        <PageHeader
          eyebrow={election.name}
          title="Candidates"
          breadcrumb={<Breadcrumb items={[{ href: "/admin", label: "Dashboard" }, { label: election.name }, { label: "Candidates" }]} />}
          actions={<StatusPill status={status} />}
          meta={<SetupStepper candidatesFinalized={election.candidatesFinalized} votersFinalized={election.votersFinalized} status={status} />}
        />

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
                  <button type="submit" className="inline-flex cursor-pointer items-center gap-[6px] rounded-[6px] border border-white/8 bg-white/5 px-[10px] py-[5px] text-[11px] text-white/60 transition-all hover:border-red-400/25 hover:text-red-400">
                    {pos.title}
                    <span className="text-[13px] leading-none text-white/18">×</span>
                  </button>
                </form>
              ))}
            </div>
          </Card>
        )}

        <CandidatesListClient
          positions={positions}
          electionId={election.id}
          fullRange={fullRange}
          isLocked={isLocked}
          canEditCandidates={canEditCandidates}
        />

        {canEditCandidates && positions.length > 0 && (
          <FinalizeButton
            action={finalizeCandidates}
            electionId={election.id}
            label="Lock Candidate List"
            hint={`${positions.length} position${positions.length !== 1 ? "s" : ""} · ${totalCandidates} candidate${totalCandidates !== 1 ? "s" : ""} · lock when ready`}
          />
        )}
      </PageContainer>
    </>
  );
}
