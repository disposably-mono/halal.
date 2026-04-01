import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { removeVoter } from "./actions";
import { CSVUploadForm, ManualAddForm } from "./VoterForms";

// ─── Types ────────────────────────────────────────────────────────────────────
type Voter = {
  id: string;
  voterCode: string;
  studentId: string;
  gradeLevel: number;
  section: string;
  hasVoted: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const DIVISION_LABELS: Record<string, string> = {
  GS: "Grade School",
  JHS: "Junior High School",
  SHS: "Senior High School",
  HC: "House Council",
};

function currentSchoolYear(): number {
  const now = new Date();
  return now.getMonth() >= 5 ? now.getFullYear() + 1 : now.getFullYear();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
  progress,
}: {
  label: string;
  value: string | number;
  sub: string;
  accent: "gold" | "green" | "blue";
  progress?: number;
}) {
  const accentMap = {
    gold: {
      bar: "bg-amber-400",
      value: "text-amber-400",
      top: "bg-amber-400",
    },
    green: {
      bar: "bg-emerald-500",
      value: "text-emerald-400",
      top: "bg-emerald-500",
    },
    blue: {
      bar: "bg-blue-400",
      value: "text-blue-400",
      top: "bg-blue-400",
    },
  };

  const c = accentMap[accent];

  return (
    <div className="relative rounded-xl border border-white/[0.08] bg-[#1a2540] overflow-hidden transition-colors hover:border-white/[0.14]">
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${c.top}`} />
      <div className="px-5 pt-5 pb-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-white/30 mb-2">
          {label}
        </p>
        <p className={`text-[28px] font-semibold leading-none tracking-tight ${c.value}`}>
          {value}
        </p>
        <p className="mt-1.5 text-[12px] text-white/30">{sub}</p>
        {progress !== undefined && (
          <div className="mt-3 h-[3px] rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full ${c.bar} transition-[width] duration-1000`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function VoterStatusBadge({ voted }: { voted: boolean }) {
  if (voted) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
        <span className="size-[5px] rounded-full bg-emerald-400" />
        Voted
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-white/30">
      <span className="size-[5px] rounded-full bg-white/20" />
      Pending
    </span>
  );
}

function LockedBadge() {
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
      Locked
    </span>
  );
}

function VoterRow({
  voter,
  isLocked,
  electionId,
}: {
  voter: Voter;
  isLocked: boolean;
  electionId: string;
}) {
  return (
    <tr className="group border-b border-white/[0.04] transition-colors last:border-b-0 hover:bg-white/[0.025]">
      <td className="px-5 py-3">
        <span className="font-mono text-[12px] font-semibold tracking-wide text-amber-400">
          {voter.voterCode}
        </span>
      </td>
      <td className="px-5 py-3 text-[13px] text-white/80">{voter.studentId}</td>
      <td className="px-5 py-3 text-[13px] text-white/50">
        {voter.gradeLevel}–{voter.section}
      </td>
      <td className="px-5 py-3">
        <VoterStatusBadge voted={voter.hasVoted} />
      </td>
      {!isLocked && (
        <td className="px-5 py-3 text-right">
          <form action={removeVoter}>
            <input type="hidden" name="voterId" value={voter.id} />
            <input type="hidden" name="electionId" value={electionId} />
            <button
              type="submit"
              className="rounded-md px-2.5 py-1 text-[12px] text-white/20 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              Remove
            </button>
          </form>
        </td>
      )}
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function VotersPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const electionId = params.id;

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    include: {
      voters: {
        orderBy: [
          { gradeLevel: "asc" },
          { section: "asc" },
          { voterCode: "asc" },
        ],
      },
    },
  });

  if (!election) notFound();

  const isLocked =
    election.status === "OPEN" || election.status === "CLOSED";
  const schoolYear = currentSchoolYear();
  const totalVoters = election.voters.length;
  const votedCount = election.voters.filter((v) => v.hasVoted).length;
  const pendingCount = totalVoters - votedCount;
  const turnoutPct =
    totalVoters > 0
      ? parseFloat(((votedCount / totalVoters) * 100).toFixed(1))
      : 0;

  return (
    <div className="min-h-screen bg-[#0b1220] font-sans">

      {/* ── Topbar ── */}
      <nav className="sticky top-0 z-10 border-b border-white/[0.08] bg-[#131c2e]">
        <div className="mx-auto flex h-[52px] max-w-5xl items-center gap-2 px-6">
          <Link
            href="/admin"
            className="text-[13px] text-white/30 transition-colors hover:text-white/60"
          >
            ← Elections
          </Link>
          <span className="text-[13px] text-white/20">/</span>
          <span className="text-[13px] text-white/50">{election.name}</span>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl space-y-7 px-6 py-10">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-white/90">
              {election.name}
            </h1>
            <p className="mt-1 text-[13px] text-white/30">
              {DIVISION_LABELS[election.division]}&nbsp;&middot;&nbsp;Voter
              Management
            </p>
          </div>
          {isLocked && <LockedBadge />}
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3.5 sm:grid-cols-3">
          <StatCard
            label="Total Voters"
            value={totalVoters}
            sub="Registered this election"
            accent="gold"
          />
          <StatCard
            label="Votes Cast"
            value={votedCount}
            sub={`${turnoutPct}% turnout`}
            accent="green"
            progress={turnoutPct}
          />
          <StatCard
            label="Pending"
            value={pendingCount}
            sub="Yet to vote"
            accent="blue"
          />
        </div>

        {/* ── Forms (hidden when locked) ── */}
        {!isLocked && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* CSV Upload */}
            <div className="rounded-xl border border-white/[0.08] bg-[#1a2540] p-5">
              <h2 className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-white/80">
                <svg
                  className="size-3.5 opacity-50"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload CSV
              </h2>
              <CSVUploadForm electionId={election.id} schoolYear={schoolYear} />
            </div>

            {/* Manual Add */}
            <div className="rounded-xl border border-white/[0.08] bg-[#1a2540] p-5">
              <h2 className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-white/80">
                <svg
                  className="size-3.5 opacity-50"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Voter Manually
              </h2>
              <ManualAddForm electionId={election.id} schoolYear={schoolYear} />
            </div>
          </div>
        )}

        {/* ── Voter table ── */}
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#1a2540]">
          {/* Table header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
            <h2 className="text-[14px] font-semibold text-white/80">
              Registered Voters{" "}
              <span className="font-normal text-white/30">({totalVoters})</span>
            </h2>
          </div>

          {/* Table */}
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-5 pb-2.5 pt-3 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-white/30">
                  Control No.
                </th>
                <th className="px-5 pb-2.5 pt-3 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-white/30">
                  Student ID
                </th>
                <th className="px-5 pb-2.5 pt-3 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-white/30">
                  Grade &amp; Section
                </th>
                <th className="px-5 pb-2.5 pt-3 text-left text-[11px] font-medium uppercase tracking-[0.06em] text-white/30">
                  Status
                </th>
                {!isLocked && <th className="px-5 pb-2.5 pt-3" />}
              </tr>
            </thead>
            <tbody>
              {election.voters.length === 0 ? (
                <tr>
                  <td
                    colSpan={isLocked ? 4 : 5}
                    className="px-5 py-10 text-center text-[13px] text-white/25"
                  >
                    No voters registered yet.
                  </td>
                </tr>
              ) : (
                election.voters.map((voter) => (
                  <VoterRow
                    key={voter.id}
                    voter={voter}
                    isLocked={isLocked}
                    electionId={election.id}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
