// prisma/seed.ts
import "dotenv/config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD!, 12);
  const officerKeyHash = await bcrypt.hash(process.env.SEED_ADMIN_OFFICER_KEY!, 12);

  const admin = await prisma.adminUser.upsert({
    where: { email: "comelec.club@olps.edu.ph" },
    update: {},
    create: {
      email: "comelec.club@olps.edu.ph",
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
