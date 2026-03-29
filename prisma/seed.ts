// prisma/seed.ts
import "dotenv/config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const passwordHash = await bcrypt.hash("comelec2026", 12);
  const officerKeyHash = await bcrypt.hash("***REMOVED***", 12);

  const admin = await prisma.adminUser.upsert({
    where: { email: "comelec@olps.edu.ph" },
    update: {},
    create: {
      email: "comelec@olps.edu.ph",
      passwordHash,
      officerKey: officerKeyHash,
      name: "OLPS COMELEC",
      role: "COMMISSIONER",
    },
  });

  console.log("✅ Seed complete — admin created:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
