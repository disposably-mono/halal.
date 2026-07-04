import { redirect } from "next/navigation";
import Link from "next/link";
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

export default async function VotersPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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
      <nav className="sticky top-0 z-10 border-b border-white/8 bg-admin-surface">
        <div className="mx-auto flex min-h-[52px] max-w-7xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0">
          <div className="flex min-w-0 items-center gap-2">
            <Link href="/admin" className="text-[11px] text-white/40 transition-colors hover:text-white/60">
              ← Dashboard
            </Link>
            <span className="text-white/10">/</span>
            <span className="min-w-0 max-w-[180px] truncate text-[11px] text-white/60 sm:max-w-[200px]">{election.name}</span>
            <span className="text-white/10">/</span>
            <span className="text-[11px] text-white/45">Voters</span>
          </div>
          <StatusPill status={status} />
        </div>
        <ElectionSubNav
          electionId={election.id}
          status={status}
          candidatesFinalized={election.candidatesFinalized}
          votersFinalized={election.votersFinalized}
        />
      </nav>

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
