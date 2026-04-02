import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────────

const DIVISION_LABELS: Record<string, string> = {
  GS: "Grade School",
  JHS: "Junior High School",
  SHS: "Senior High School",
  HC: "House Council",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Election = {
  id: string;
  name: string;
  division: string;
  status: string;
  scheduledOpen: Date | null;
  _count: { voters: number; positions: number };
  votedCount: number; // voters where hasVoted = true
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function turnoutPct(e: Election) {
  return e._count.voters > 0
    ? Math.round((e.votedCount / e._count.voters) * 100)
    : 0;
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, { pill: string; dot: string; label: string }> = {
    DRAFT: { pill: "bg-white/[0.06] text-white/30", dot: "bg-white/20", label: "Draft" },
    SCHEDULED: { pill: "bg-blue-500/[0.12] text-blue-400", dot: "bg-blue-400", label: "Scheduled" },
    OPEN: { pill: "bg-emerald-500/[0.12] text-emerald-400", dot: "bg-emerald-400", label: "Open" },
    CLOSED: { pill: "bg-white/[0.05] text-white/25", dot: "bg-white/15", label: "Closed" },
  };
  const m = styles[status] ?? styles.DRAFT;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${m.pill}`}>
      <span className={`size-[4px] rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

// ── Open election attention card ──
function OpenCard({ election }: { election: Election }) {
  const pct = turnoutPct(election);
  return (
    <div className="relative flex flex-1 flex-col gap-3 overflow-hidden rounded-xl border border-white/[0.08] bg-[#1a2540] p-4 transition-colors hover:border-white/[0.14]">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-emerald-400" />
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[12px] font-semibold text-white/90">
            {DIVISION_LABELS[election.division] ?? election.division}
          </p>
          <p className="mt-0.5 text-[11px] text-white/30">Active election</p>
        </div>
        <StatusPill status="OPEN" />
      </div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-[26px] font-semibold leading-none tracking-tight text-white/90">
            {election.votedCount}
          </span>
          <span className="text-[14px] text-white/25">/</span>
          <span className="font-mono text-[14px] text-white/40">
            {election._count.voters}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-white/30">voters who have voted</p>
      </div>
      <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-emerald-400">{pct}% turnout</span>
        <span className="text-[11px] text-white/30">
          {election._count.voters - election.votedCount} remaining
        </span>
      </div>
      <div className="flex gap-1.5 border-t border-white/[0.06] pt-2">
        <Link
          href={`/admin/elections/${election.id}/candidates`}
          className="flex-1 rounded-lg border border-white/[0.08] py-1.5 text-center text-[11px] text-white/40 transition-colors hover:border-white/[0.16] hover:text-white/70"
        >
          Candidates
        </Link>
        <Link
          href={`/admin/elections/${election.id}/voters`}
          className="flex-1 rounded-lg border border-white/[0.08] py-1.5 text-center text-[11px] text-white/40 transition-colors hover:border-white/[0.16] hover:text-white/70"
        >
          Voters
        </Link>
      </div>
    </div>
  );
}

// ── Draft election attention card ──
function DraftCard({ election }: { election: Election }) {
  const hasVoters = election._count.voters > 0;
  const hasCandidates = election._count.positions > 0;

  return (
    <div className="relative flex flex-1 flex-col gap-3 overflow-hidden rounded-xl border border-white/[0.08] bg-[#1a2540] p-4 transition-colors hover:border-white/[0.14]">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-white/15" />
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[12px] font-semibold text-white/90">
            {DIVISION_LABELS[election.division] ?? election.division}
          </p>
          <p className="mt-0.5 text-[11px] text-white/30">Not yet published</p>
        </div>
        <StatusPill status="DRAFT" />
      </div>
      <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-yellow-400/[0.13] px-2 py-1 text-[10px] font-medium text-yellow-300">
        <svg className="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        Needs setup
      </span>
      <div className="flex flex-col gap-1.5">
        {[
          { done: hasVoters, label: hasVoters ? `${election._count.voters} voters added` : "Add voters" },
          { done: hasCandidates, label: hasCandidates ? "Candidates set" : "Add candidates" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${item.done ? "border-emerald-500/40 bg-emerald-500/[0.12] text-emerald-400" : "border-white/[0.14] text-white/25"}`}>
              {item.done ? (
                <svg className="size-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg className="size-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              )}
            </div>
            <span className={`text-[12px] ${item.done ? "text-white/50" : "text-white/30"}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 border-t border-white/[0.06] pt-2">
        <Link
          href={`/admin/elections/${election.id}/voters`}
          className="flex-1 rounded-lg border border-white/[0.08] py-1.5 text-center text-[11px] text-white/40 transition-colors hover:border-white/[0.16] hover:text-white/70"
        >
          Add voters
        </Link>
        <Link
          href={`/admin/elections/${election.id}/candidates`}
          className="flex-1 rounded-lg border border-white/[0.08] py-1.5 text-center text-[11px] text-white/40 transition-colors hover:border-white/[0.16] hover:text-white/70"
        >
          Candidates
        </Link>
      </div>
    </div>
  );
}

// ── Scheduled election attention card ──
function ScheduledCard({ election }: { election: Election }) {
  return (
    <div className="relative flex flex-1 flex-col gap-3 overflow-hidden rounded-xl border border-white/[0.08] bg-[#1a2540] p-4 transition-colors hover:border-white/[0.14]">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-blue-400" />
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[12px] font-semibold text-white/90">
            {DIVISION_LABELS[election.division] ?? election.division}
          </p>
          <p className="mt-0.5 text-[11px] text-white/30">Upcoming</p>
        </div>
        <StatusPill status="SCHEDULED" />
      </div>
      <div>
        <p className="font-mono text-[18px] font-semibold tracking-tight text-white/90">
          {election.scheduledOpen ? fmtDate(election.scheduledOpen) : "—"}
        </p>
        <p className="mt-0.5 text-[11px] text-white/30">scheduled open</p>
      </div>
      <p className="text-[11px] text-white/30">
        {election._count.voters} voters registered
      </p>
      <div className="flex gap-1.5 border-t border-white/[0.06] pt-2">
        <Link
          href={`/admin/elections/${election.id}/candidates`}
          className="flex-1 rounded-lg border border-white/[0.08] py-1.5 text-center text-[11px] text-white/40 transition-colors hover:border-white/[0.16] hover:text-white/70"
        >
          Candidates
        </Link>
        <Link
          href={`/admin/elections/${election.id}/voters`}
          className="flex-1 rounded-lg border border-white/[0.08] py-1.5 text-center text-[11px] text-white/40 transition-colors hover:border-white/[0.16] hover:text-white/70"
        >
          Voters
        </Link>
      </div>
    </div>
  );
}

// ── Closed election attention card ──
function ClosedCard({ election }: { election: Election }) {
  const pct = turnoutPct(election);
  return (
    <div className="relative flex flex-1 flex-col gap-3 overflow-hidden rounded-xl border border-white/[0.08] bg-[#1a2540] p-4 transition-colors hover:border-white/[0.14]">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-white/[0.08]" />
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[12px] font-semibold text-white/90">
            {DIVISION_LABELS[election.division] ?? election.division}
          </p>
          <p className="mt-0.5 text-[11px] text-white/30">Election ended</p>
        </div>
        <StatusPill status="CLOSED" />
      </div>
      <div>
        <p className="font-mono text-[26px] font-semibold leading-none tracking-tight text-white/90">
          {pct}%
        </p>
        <p className="mt-1 text-[11px] text-white/30">
          final turnout — {election.votedCount} of {election._count.voters} voted
        </p>
      </div>
      <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-white/20" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-1.5 border-t border-white/[0.06] pt-2">
        <Link
          href={`/admin/elections/${election.id}/monitor`}
          className="flex-1 rounded-lg border border-white/[0.08] py-1.5 text-center text-[11px] text-white/40 transition-colors hover:border-white/[0.16] hover:text-white/70"
        >
          View results
        </Link>
      </div>
    </div>
  );
}

function AttentionCard({ election }: { election: Election }) {
  if (election.status === "OPEN") return <OpenCard election={election} />;
  if (election.status === "DRAFT") return <DraftCard election={election} />;
  if (election.status === "SCHEDULED") return <ScheduledCard election={election} />;
  return <ClosedCard election={election} />;
}

// ── Collapsible all-elections list ──
function AllElectionsSection({ elections }: { elections: Election[] }) {
  return (
    <details className="group overflow-hidden rounded-xl border border-white/[0.08] bg-[#1a2540]">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 transition-colors hover:bg-white/[0.025]">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-medium uppercase tracking-[0.07em] text-white/40">
            All Elections
          </span>
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/25">
            {elections.length}
          </span>
        </div>
        <svg
          className="size-3.5 text-white/25 transition-transform duration-200 group-open:rotate-180"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </summary>

      <div className="border-t border-white/[0.06]">
        {elections.map((election) => {
          const pct = turnoutPct(election);
          const showProg = election.status === "OPEN" || election.status === "CLOSED";

          const pillStyles: Record<string, { pill: string; dot: string; label: string }> = {
            OPEN: { pill: "bg-emerald-500/[0.12] text-emerald-400", dot: "bg-emerald-400", label: "Open" },
            DRAFT: { pill: "bg-white/[0.06] text-white/30", dot: "bg-white/20", label: "Draft" },
            SCHEDULED: { pill: "bg-blue-500/[0.12] text-blue-400", dot: "bg-blue-400", label: "Scheduled" },
            CLOSED: { pill: "bg-white/[0.05] text-white/25", dot: "bg-white/15", label: "Closed" },
          };
          const m = pillStyles[election.status] ?? pillStyles.DRAFT;

          return (
            <div
              key={election.id}
              className="flex items-center justify-between gap-3 border-b border-white/[0.04] px-5 py-3 last:border-b-0 hover:bg-white/[0.025]"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${m.pill}`}>
                  <span className={`size-[4px] rounded-full ${m.dot}`} />
                  {m.label}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-white/90">
                    {election.name}
                  </p>
                  <p className="text-[11px] text-white/30">
                    {DIVISION_LABELS[election.division] ?? election.division}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="text-[12px] text-white/30">
                  {election._count.voters > 0
                    ? `${election._count.voters.toLocaleString()} voters`
                    : "No voters"}
                </span>
                {showProg && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-[3px] w-10 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] text-white/30">{pct}%</span>
                  </div>
                )}
                {election.scheduledOpen && election.status === "SCHEDULED" && (
                  <span className="text-[12px] text-white/30">
                    {fmtDate(election.scheduledOpen)}
                  </span>
                )}
              </div>

              <div className="flex shrink-0 gap-1.5">
                <Link href={`/admin/elections/${election.id}/candidates`}>
                  <button className="rounded-md border border-white/[0.08] px-2.5 py-1 text-[11px] text-white/35 transition-colors hover:border-white/[0.16] hover:text-white/65">
                    Candidates
                  </button>
                </Link>
                <Link href={`/admin/elections/${election.id}/voters`}>
                  <button className="rounded-md border border-white/[0.08] px-2.5 py-1 text-[11px] text-white/35 transition-colors hover:border-white/[0.16] hover:text-white/65">
                    Voters
                  </button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </details>
  );
}

// ─── Sign out action ──────────────────────────────────────────────────────────

async function handleSignOut() {
  "use server";
  await signOut({ redirectTo: "/admin/login" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboard() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  // Fetch elections with position/voter counts
  const rawElections = await prisma.election.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { voters: true, positions: true } },
    },
  });

  // For each election, count voters where hasVoted = true
  // This is the correct turnout numerator — not Vote row count
  const votedCounts = await Promise.all(
    rawElections.map((e) =>
      prisma.voter.count({
        where: { electionId: e.id, hasVoted: true },
      })
    )
  );

  const elections: Election[] = rawElections.map((e, i) => ({
    ...e,
    votedCount: votedCounts[i],
  }));

  return (
    <div className="min-h-screen bg-[#0b1220] font-sans">

      {/* ── Topbar ── */}
      <nav className="sticky top-0 z-10 border-b border-white/[0.08] bg-[#131c2e]">
        <div className="mx-auto flex h-[52px] max-w-6xl items-center justify-between px-6">
          <div className="flex items-baseline gap-2.5">
            <span className="text-[18px] font-semibold tracking-[-0.5px] text-white/90">
              halal.
            </span>
            <span className="text-[12px] text-white/25">Admin Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-white/30">{session.user?.name}</span>
            <form action={handleSignOut}>
              <button
                type="submit"
                className="text-[12px] text-white/25 transition-colors hover:text-white/50"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl space-y-5 px-6 py-10">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-white/90">
              Elections
            </h1>
            <p className="mt-1 text-[13px] text-white/30">
              {elections.length === 0
                ? "No elections yet."
                : `${elections.length} election${elections.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Link href="/admin/elections/new">
            <button className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2 text-[13px] font-semibold text-[#0b1220] transition-opacity hover:opacity-90 active:scale-[0.97]">
              <svg
                className="size-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Election
            </button>
          </Link>
        </div>

        {elections.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-white/[0.08] bg-[#1a2540] px-6 py-16 text-center">
            <div className="flex size-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
              <svg
                className="size-5 text-white/20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-[14px] font-medium text-white/40">No elections yet</p>
            <p className="text-[12px] text-white/25">
              Create your first election to get started.
            </p>
            <Link href="/admin/elections/new">
              <button className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2 text-[13px] font-semibold text-[#0b1220] transition-opacity hover:opacity-90">
                + New Election
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* ── Attention strip ── */}
            <div className="flex gap-3">
              {elections.map((election) => (
                <AttentionCard key={election.id} election={election} />
              ))}
            </div>

            {/* ── All elections collapsible ── */}
            <AllElectionsSection elections={elections} />
          </>
        )}

      </main>
    </div>
  );
}
