/**
 * Concurrency-correctness harness for the ballot path.
 *
 * Proves the two election-critical invariants by exercising the real
 * `castVerifiedBallot` transaction (the same code the voter UI runs):
 *
 *   1. RACE: firing N concurrent casts for ONE voter records exactly one ballot
 *      and flips hasVoted exactly once (no double vote).
 *   2. RECONCILIATION: across the election, ballot count == voters who voted,
 *      and every Vote row points at a position in the election.
 *
 * Exits non-zero on any violation, so it can gate CI.
 *
 * Prereqs: `npm run seed:load` first (writes voters.json), and
 * ELECTION_AUDIT_MASTER_KEY + DATABASE_URL set. Points at DATABASE_URL — use a
 * throwaway database.
 *
 *   npm run test:correctness
 *   CONCURRENCY=24 npm run test:correctness
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { castVerifiedBallot, type BallotSelection } from "@/lib/server/cast-ballot";

const DATA_FILE = path.resolve(process.cwd(), "scripts/load/.data/voters.json");

interface LoadData {
  electionId: string;
  positions: { id: string; eligibleGrades: number[]; candidateIds: string[] }[];
}

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  if (ok) {
    console.log(`  ✓ ${label}`);
  } else {
    failures++;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function buildSelections(data: LoadData, gradeLevel: number): BallotSelection {
  const selections: BallotSelection = {};
  for (const pos of data.positions) {
    if (pos.eligibleGrades.includes(gradeLevel) && pos.candidateIds.length > 0) {
      selections[pos.id] = pos.candidateIds[0];
    }
  }
  return selections;
}

async function main() {
  const data: LoadData = JSON.parse(readFileSync(DATA_FILE, "utf8"));
  const { electionId } = data;
  const concurrency = Math.max(2, parseInt(process.env.CONCURRENCY ?? "12", 10));

  console.log(`Election ${electionId} — concurrency ${concurrency}\n`);

  // ── 1. RACE ────────────────────────────────────────────────────────────────
  console.log("Race: N concurrent casts for one voter");
  const voter = await prisma.voter.findFirst({
    where: { electionId, hasVoted: false },
    select: { id: true, gradeLevel: true },
  });
  if (!voter) {
    console.error(
      "No un-voted voter left in this election. Re-run `npm run seed:load`.",
    );
    process.exit(1);
  }

  const selections = buildSelections(data, voter.gradeLevel);
  const ballotsBefore = await prisma.ballot.count({ where: { electionId } });

  const results = await Promise.all(
    Array.from({ length: concurrency }, () =>
      castVerifiedBallot({ voterId: voter.id, selections }),
    ),
  );

  const ballotsAfter = await prisma.ballot.count({ where: { electionId } });
  const freshBallots = results.filter(
    (r) => r.success && "receiptCode" in r && r.receiptCode,
  ).length;
  const allResolvedSuccess = results.every((r) => r.success);
  const claimed = await prisma.voter.findUnique({
    where: { id: voter.id },
    select: { hasVoted: true },
  });

  check(
    "exactly one fresh ballot created",
    ballotsAfter - ballotsBefore === 1,
    `delta=${ballotsAfter - ballotsBefore}`,
  );
  check("exactly one attempt produced a receipt", freshBallots === 1, `receipts=${freshBallots}`);
  check("no attempt returned a hard error", allResolvedSuccess);
  check("voter is marked hasVoted", claimed?.hasVoted === true);

  // ── 2. RECONCILIATION ───────────────────────────────────────────────────────
  console.log("\nReconciliation across the election");
  const [ballotCount, votedCount, orphanVotes] = await Promise.all([
    prisma.ballot.count({ where: { electionId } }),
    prisma.voter.count({ where: { electionId, hasVoted: true } }),
    prisma.vote.count({
      where: { electionId, position: { electionId: { not: electionId } } },
    }),
  ]);

  check(
    "ballot count equals voters who voted",
    ballotCount === votedCount,
    `ballots=${ballotCount} voted=${votedCount}`,
  );
  check("no votes reference a foreign election's position", orphanVotes === 0, `orphans=${orphanVotes}`);

  console.log(
    failures === 0
      ? "\nAll correctness checks passed."
      : `\n${failures} correctness check(s) FAILED.`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
