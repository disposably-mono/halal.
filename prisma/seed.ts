// prisma/seed.ts
import "dotenv/config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const officerKey = process.env.SEED_ADMIN_OFFICER_KEY;
  const secondEmail = process.env.SEED_SECOND_ADMIN_EMAIL;
  const secondPassword = process.env.SEED_SECOND_ADMIN_PASSWORD;
  const secondOfficerKey = process.env.SEED_SECOND_ADMIN_OFFICER_KEY;

  if (
    !email ||
    !password ||
    !officerKey ||
    !secondEmail ||
    !secondPassword ||
    !secondOfficerKey
  ) {
    throw new Error(
      "Missing seed credentials. Configure both SEED_ADMIN_* and SEED_SECOND_ADMIN_* values so each account can use the other's officer key.",
    );
  }

  if (email === secondEmail) {
    throw new Error("Seed admin accounts must use different email addresses.");
  }

  if (officerKey === secondOfficerKey) {
    throw new Error("Seed admin accounts must use different officer keys.");
  }

  const [passwordHash, officerKeyHash, secondPasswordHash, secondOfficerKeyHash] =
    await Promise.all([
      bcrypt.hash(password, 12),
      bcrypt.hash(officerKey, 12),
      bcrypt.hash(secondPassword, 12),
      bcrypt.hash(secondOfficerKey, 12),
    ]);

  // Bootstrap a super-admin plus a separate verification officer so either
  // account can satisfy the other's second-person login check immediately.
  // The super-admin can then create the operational roles from Accounts.
  const [admin, secondAdmin] = await prisma.$transaction([
    prisma.adminUser.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash,
        officerKey: officerKeyHash,
        name: "OLPS COMELEC",
        role: "SUPERADMIN",
      },
    }),
    prisma.adminUser.upsert({
      where: { email: secondEmail },
      update: {},
      create: {
        email: secondEmail,
        passwordHash: secondPasswordHash,
        officerKey: secondOfficerKeyHash,
        name: "COMELEC Verification Officer",
        role: "OFFICER",
      },
    }),
  ]);

  console.log(
    "Seed complete — paired COMELEC accounts created:",
    admin.email,
    secondAdmin.email,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
