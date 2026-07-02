import { redirect } from "next/navigation";
import { requireCapability } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";
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
import { CSVUploadForm, ManualAddForm } from "./VoterForms";
import { finalizeVoters, unfinalizeVoters } from "./actions";
import { can } from "@/lib/auth/permissions";
import { AssignmentsDialog } from "./AssignmentsDialog";
import { VotersTableClient } from "./VotersTableClient";

export const dynamic = "force-dynamic";

const SCHOOL_YEAR = new Date().getFullYear();

export default async function VotersPage({ params }: { params: { id: string } }) {
  // Control numbers shown below are live voting credentials, so reading requires
  // voters:view (Commissioner + oversight roles). Mutation controls below are
  // separately gated on voters:manage. Other roles are bounced to the dashboard.
  const session = await requireCapability("voters:view");

  const canManageVoters = can(session.user?.role, "voters:manage");

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

  const canUnlock =
    canManageVoters && election.status !== "OPEN" && election.status !== "CLOSED";

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
          title="Voter List"
          breadcrumb={<Breadcrumb items={[{ href: "/admin", label: "Dashboard" }, { label: election.name }, { label: "Voters" }]} />}
          actions={<StatusPill status={status} />}
          meta={<SetupStepper candidatesFinalized={election.candidatesFinalized} votersFinalized={election.votersFinalized} status={status} />}
        />

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

        {election.status === "DRAFT" && election.votersFinalized && election.candidatesFinalized && (
          <SetupNextStep
            href={`/admin/elections/${election.id}/control`}
            title="Election content is ready"
            description="Review the schedule and launch settings before publishing."
            label="Continue to Control"
          />
        )}

        {election.status === "DRAFT" && election.votersFinalized && !election.candidatesFinalized && (
          <SetupNextStep
            href={`/admin/elections/${election.id}/candidates`}
            title="Candidate setup still needs attention"
            description="Lock the candidate list before moving to election control."
            label="Review Candidates"
          />
        )}

        {canManageVoters && !election.votersFinalized && (
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

        <div className="space-y-2">
          <div className="flex justify-end">
            <AssignmentsDialog voters={voters} />
          </div>
          <VotersTableClient
            voters={voters}
            electionId={params.id}
            canRemove={canManageVoters && !election.votersFinalized}
          />
        </div>

        {canManageVoters && !election.votersFinalized && (
          <FinalizeButton
            action={finalizeVoters}
            electionId={election.id}
            label="Lock Voter List"
            hint={`${election._count.voters} voter${election._count.voters !== 1 ? "s" : ""} registered — lock the list when ready`}
          />
        )}
      </PageContainer>
    </>
  );
}
