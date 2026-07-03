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

// Parses a positive-integer env var, falling back to `fallback` if it is
// unset, empty, or not a positive number. Keeps pool sizing/timeouts
// overridable per-environment without risking a NaN/0 reaching `pg.Pool`.
function positiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    // Concurrent-voting bursts must fail fast instead of queueing forever.
    // Keep this pool size below the Postgres instance's shared max_connections:
    // every app replica gets its own pool, so total connections scale with
    // replica count. Lower DB_POOL_MAX in deployment config if needed.
    max: positiveIntEnv("DB_POOL_MAX", 40),
    idleTimeoutMillis: positiveIntEnv("DB_POOL_IDLE_TIMEOUT_MS", 30_000),
    connectionTimeoutMillis: positiveIntEnv("DB_POOL_CONNECTION_TIMEOUT_MS", 10_000),
    statement_timeout: positiveIntEnv("DB_STATEMENT_TIMEOUT_MS", 15_000),
  });
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
