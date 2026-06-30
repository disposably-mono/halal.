/**
 * Removes the synthetic elections created by `npm run seed:load` (any election
 * whose name starts with "[LOAD TEST]"). Cascade deletes take their positions,
 * candidates, voters, ballots, and votes with them.
 *
 *   npm run loadtest:clear
 *
 * Scoped by the "[LOAD TEST]" name prefix, so real elections are never touched.
 * Points at DATABASE_URL — intended for the dev/test database.
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  const targets = await prisma.election.findMany({
    where: { name: { startsWith: "[LOAD TEST]" } },
    select: { id: true, name: true },
  });

  if (targets.length === 0) {
    console.log("No [LOAD TEST] elections found — nothing to remove.");
    return;
  }

  const { count } = await prisma.election.deleteMany({
    where: { name: { startsWith: "[LOAD TEST]" } },
  });

  console.log(`Removed ${count} load-test election(s):`);
  for (const t of targets) console.log(`  - ${t.name} (${t.id})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
