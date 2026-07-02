import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const SLOW_QUERY_MS = 50;

function logQueryEvent(e: Prisma.QueryEvent) {
  if (process.env.PRISMA_LOG === "full") {
    console.log(`prisma:query ${e.query}`);
    return;
  }

  const op = e.query.match(/^(SELECT|INSERT|UPDATE|DELETE)/i)?.[0];
  if (!op) return;

  const table = e.query.match(/"public"\."(\w+)"/)?.[1] ?? "?";
  const slow = e.duration > SLOW_QUERY_MS ? "  ⚠ slow" : "";
  console.log(`prisma  ${op.toUpperCase().padEnd(6)} ${table.padEnd(12)} ${e.duration}ms${slow}`);
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const client = new PrismaClient({
    adapter,
    log: [
      { emit: "event", level: "query" },
      { emit: "stdout", level: "warn" },
      { emit: "stdout", level: "error" },
    ],
  });

  if (process.env.NODE_ENV !== "production") {
    client.$on("query", logQueryEvent);
  }

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
