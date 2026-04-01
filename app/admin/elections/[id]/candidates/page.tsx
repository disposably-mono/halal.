import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  seedAllPositions,
  addSinglePosition,
  removePosition,
  addCandidate,
  removeCandidate,
} from "./actions";
import { DIVISION_POSITIONS } from "../../lib/constants";

// ─── Constants ────────────────────────────────────────────────────────────────

const DIVISION_LABELS: Record<string, string> = {
  GS: "Grade School",
  JHS: "Junior High School",
  SHS: "Senior High School",
  HC: "House Council",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Candidate = {
  id: string;
  fullName: string;
  gradeLevel: number;
};

type Position = {
  id: string;
  title: string;
  candidateGrade: number;
  eligibleGrades: number[];
  candidates: Candidate[];
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function LockedBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-yellow-400/20 bg-yellow-400/[0.12] px-2.5 py-1.5 text-[12px] font-medium text-yellow-300">
      <svg
        className="size-3"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      Locked — election is {status}
    </span>
  );
}

function CandidateRow({
  candidate,
  positionId,
  electionId,
  isLocked,
}: {
  candidate: Candidate;
  positionId: string;
  electionId: string;
  isLocked: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 transition-colors hover:bg-white/[0.06]">
      <div>
        <p className="text-[13px] font-medium text-white/90">
          {candidate.fullName}
        </p>
        <p className="mt-0.5 text-[11px] text-white/30">
          Grade {candidate.gradeLevel}
        </p>
      </div>
      {!isLocked && (
        <form action={removeCandidate}>
          <input type="hidden" name="candidateId" value={candidate.id} />
          <input type="hidden" name="electionId" value={electionId} />
          <button
            type="submit"
            className="rounded-md px-2.5 py-1 text-[12px] text-white/20 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            Remove
          </button>
        </form>
      )}
    </div>
  );
}

function PositionCard({
  position,
  electionId,
  isLocked,
}: {
  position: Position;
  electionId: string;
  isLocked: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#1a2540] transition-colors hover:border-white/[0.14]">
      {/* Card header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[14px] font-semibold text-white/90">
            {position.title}
          </h3>
          <span className="inline-flex items-center rounded-full bg-white/[0.07] px-2 py-0.5 font-mono text-[11px] text-white/30">
            Grade {position.candidateGrade}
          </span>
          {position.eligibleGrades.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-blue-500/[0.12] px-2 py-0.5 text-[11px] font-medium text-blue-400">
              Grade {position.eligibleGrades.join(", ")} voters
            </span>
          )}
        </div>
        {!isLocked && (
          <form action={removePosition}>
            <input type="hidden" name="positionId" value={position.id} />
            <input type="hidden" name="electionId" value={electionId} />
            <button
              type="submit"
              className="shrink-0 rounded-md px-2.5 py-1 text-[12px] text-white/20 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              Delete position
            </button>
          </form>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-2.5 px-5 py-4">
        {/* Candidate list */}
        {position.candidates.length > 0 ? (
          position.candidates.map((c) => (
            <CandidateRow
              key={c.id}
              candidate={c}
              positionId={position.id}
              electionId={electionId}
              isLocked={isLocked}
            />
          ))
        ) : (
          !isLocked && (
            <p className="text-[12px] text-white/25">
              No candidates yet — add one below.
            </p>
          )
        )}

        {/* Add candidate form */}
        {!isLocked && (
          <form
            action={addCandidate}
            className="flex gap-2 pt-1"
          >
            <input type="hidden" name="positionId" value={position.id} />
            <input type="hidden" name="electionId" value={electionId} />
            <input
              type="hidden"
              name="gradeLevel"
              value={position.candidateGrade}
            />
            <input
              name="fullName"
              placeholder="Full name"
              required
              className="h-9 flex-1 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-[13px] text-white/90 placeholder:text-white/25 outline-none transition-colors focus:border-amber-400/50 focus:bg-amber-400/[0.04]"
            />
            <button
              type="submit"
              className="h-9 shrink-0 rounded-lg bg-amber-400 px-4 text-[12px] font-semibold text-[#0b1220] transition-opacity hover:opacity-90 active:scale-[0.97]"
            >
              + Add
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CandidatesPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const election = await prisma.election.findUnique({
    where: { id: params.id },
    include: {
      positions: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        include: {
          candidates: { orderBy: { fullName: "asc" } },
        },
      },
    },
  });

  if (!election) notFound();

  const isLocked = election.status === "OPEN" || election.status === "CLOSED";
  const allDivisionPositions = DIVISION_POSITIONS[election.division] ?? [];
  const totalPositionCount = allDivisionPositions.length;
  const activeTitles = new Set(election.positions.map((p) => p.title));
  const availableToAdd = allDivisionPositions.filter(
    (p) => !activeTitles.has(p.title)
  );
  const activeCount = election.positions.length;
  const remainingCount = availableToAdd.length;
  const divisionLabel = DIVISION_LABELS[election.division];

  return (
    <div className="min-h-screen bg-[#0b1220] font-sans">

      {/* ── Topbar ── */}
      <nav className="sticky top-0 z-10 border-b border-white/[0.08] bg-[#131c2e]">
        <div className="mx-auto flex h-[52px] max-w-4xl items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="text-[13px] text-white/30 transition-colors hover:text-white/60"
            >
              ← Elections
            </Link>
            <span className="text-[13px] text-white/20">/</span>
            <span className="max-w-[200px] truncate text-[13px] text-white/50">
              {election.name}
            </span>
            <span className="text-[13px] text-white/20">/</span>
            <span className="text-[13px] text-white/50">Candidates</span>
          </div>
          <Link
            href={`/admin/elections/${election.id}/voters`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.12] px-3 py-1.5 text-[12px] text-white/50 transition-colors hover:border-white/[0.2] hover:bg-white/[0.04] hover:text-white/80"
          >
            Voters
            <svg
              className="size-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl space-y-7 px-6 py-10">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-white/90">
              {election.name}
            </h1>
            <p className="mt-1 text-[13px] text-white/30">
              {divisionLabel}&nbsp;&middot;&nbsp;Candidate Encoder
            </p>
          </div>
          {isLocked && <LockedBadge status={election.status} />}
        </div>

        {/* ── Seed banner (shown only when no positions yet) ── */}
        {activeCount === 0 && !isLocked && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] px-5 py-5">
            <div>
              <p className="text-[14px] font-medium text-white/90">
                No positions yet.
              </p>
              <p className="mt-0.5 text-[12px] text-white/30">
                Load the confirmed {divisionLabel} ballot positions from the PRD.
              </p>
            </div>
            <form action={seedAllPositions}>
              <input type="hidden" name="electionId" value={election.id} />
              <input type="hidden" name="division" value={election.division} />
              <button
                type="submit"
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-[13px] font-semibold text-[#0b1220] transition-opacity hover:opacity-90 active:scale-[0.97]"
              >
                <svg
                  className="size-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
                Load {totalPositionCount} Positions
              </button>
            </form>
          </div>
        )}

        {/* ── Position list ── */}
        {activeCount > 0 && (
          <div className="flex flex-col gap-3.5">

            {election.positions.map((position) => (
              <PositionCard
                key={position.id}
                position={position}
                electionId={election.id}
                isLocked={isLocked}
              />
            ))}

            {/* ── Add single position dropdown ── */}
            {!isLocked && availableToAdd.length > 0 && (
              <div className="rounded-xl border border-dashed border-white/[0.12] bg-transparent">
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <form
                    action={addSinglePosition}
                    className="flex w-full items-center gap-3"
                  >
                    <input type="hidden" name="electionId" value={election.id} />
                    <input type="hidden" name="division" value={election.division} />
                    <select
                      name="title"
                      defaultValue=""
                      required
                      className="h-9 flex-1 rounded-lg border border-white/[0.08] bg-[#131c2e] px-3 text-[13px] text-white/70 outline-none transition-colors focus:border-amber-400/50 [&>option]:bg-[#0b1220]"
                    >
                      <option value="" disabled>
                        Add position ({remainingCount} remaining)…
                      </option>
                      {availableToAdd.map((p) => (
                        <option key={p.title} value={p.title}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="h-9 shrink-0 rounded-lg border border-white/[0.12] px-4 text-[13px] text-white/60 transition-colors hover:border-white/[0.2] hover:bg-white/[0.05] hover:text-white/80"
                    >
                      + Add Position
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* All positions active */}
            {!isLocked && availableToAdd.length === 0 && (
              <p className="py-2 text-center text-[12px] text-white/20">
                All {totalPositionCount} positions are active.
              </p>
            )}

            {/* ── Continue footer ── */}
            <div className="flex justify-end pt-2">
              <Link href={`/admin/elections/${election.id}/voters`}>
                <button className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 text-[13px] font-semibold text-[#0b1220] transition-opacity hover:opacity-90 active:scale-[0.97]">
                  Continue to Voters
                  <svg
                    className="size-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </Link>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
