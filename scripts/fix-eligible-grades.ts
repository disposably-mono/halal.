/**
 * scripts/fix-eligible-grades.ts
 *
 * Backfills eligibleGrades on all existing Position records.
 * Run once after updating constants.ts:
 *
 *   npx tsx scripts/fix-eligible-grades.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DIVISION_POSITIONS } from "../app/admin/elections/lib/constants";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Build a lookup: division → title → eligibleGrades
  const lookup = new Map<string, number[]>();
  for (const [division, positions] of Object.entries(DIVISION_POSITIONS)) {
    for (const pos of positions) {
      lookup.set(`${division}::${pos.title}`, pos.eligibleGrades);
    }
  }

  // Fetch all positions with their election's division
  const positions = await prisma.position.findMany({
    select: {
      id: true,
      title: true,
      eligibleGrades: true,
      election: { select: { division: true } },
    },
  });

  console.log(`Found ${positions.length} positions to check.`);

  let updated = 0;
  let skipped = 0;

  for (const pos of positions) {
    const division = pos.election.division;
    const key = `${division}::${pos.title}`;
    const correctGrades = lookup.get(key);

    if (correctGrades === undefined) {
      console.warn(`  ⚠ No constant found for: ${key} — skipping`);
      skipped++;
      continue;
    }

    // Only update if different
    const same =
      pos.eligibleGrades.length === correctGrades.length &&
      pos.eligibleGrades.every((g, i) => g === correctGrades[i]);

    if (same) {
      skipped++;
      continue;
    }

    await prisma.position.update({
      where: { id: pos.id },
      data: { eligibleGrades: correctGrades },
    });

    console.log(
      `  ✓ ${division} / ${pos.title}: [] → [${correctGrades.join(", ")}]`
    );
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, Skipped/unchanged: ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
