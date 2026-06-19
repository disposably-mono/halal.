// prisma/seed.ts
import "dotenv/config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const officerKey = process.env.SEED_ADMIN_OFFICER_KEY;

  if (!email || !password || !officerKey) {
    throw new Error(
      "Missing seed credentials. Set SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, and SEED_ADMIN_OFFICER_KEY in .env",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const officerKeyHash = await bcrypt.hash(officerKey, 12);

  // Bootstrap the COMELEC super-admin. This account manages other admin
  // accounts but cannot run elections itself (separation of duties). It must
  // first create a COMMISSIONER (and a CANVASSER) via the Accounts screen
  // before any election can be operated.
  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      officerKey: officerKeyHash,
      name: "OLPS COMELEC",
      role: "SUPERADMIN",
    },
  });

  console.log("✅ Seed complete — COMELEC super-admin created:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
