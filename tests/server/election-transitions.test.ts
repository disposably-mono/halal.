import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * tests/server/election-transitions.test.ts
 *
 * Covers two resilience fixes in lib/election-transitions.ts:
 *
 *  1. SCHEDULED → OPEN now takes a per-election row lock + status recheck
 *     (mirroring closeElectionWithCertification), so a double-fired cron
 *     can never double-process the same election or write duplicate audit
 *     log entries.
 *  2. The OPEN → CLOSED loop wraps each closeElectionWithCertification call
 *     in its own try/catch, so one election losing its status-recheck race
 *     doesn't abort processing of the other elections in the same batch.
 *
 * Prisma is faked in-memory (no real DB): `election.findMany` filters a
 * shared `store` array by the same where-shapes the real code issues, and
 * `$transaction` simulates Postgres `SELECT ... FOR UPDATE` with a real
 * per-row async lock so concurrent invocations serialize exactly the way
 * they would against a real database — this is what lets the "call it
 * twice concurrently" test actually exercise the recheck logic instead of
 * trivially passing.
 */

type FakeStatus = "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED";

interface FakeElection {
  id: string;
  status: FakeStatus;
  archivedAt: null;
  candidatesFinalized: boolean;
  votersFinalized: boolean;
  auditVersion: string | null;
  scheduledOpen: Date;
  scheduledClose: Date;
}

interface FakeAuditLog {
  electionId: string;
  action: string;
  toStatus: string;
  adminEmail: string;
}

let store: FakeElection[] = [];
let auditLogs: FakeAuditLog[] = [];
const rowLocks = new Map<string, Promise<void>>();

/** FIFO async lock per election id — simulates `SELECT ... FOR UPDATE`. */
function acquireLock(id: string): Promise<() => void> {
  const prior = rowLocks.get(id) ?? Promise.resolve();
  let release!: () => void;
  const mine = new Promise<void>((resolve) => {
    release = resolve;
  });
  rowLocks.set(
    id,
    prior.then(() => mine),
  );
  return prior.then(() => release);
}

/** Distinguishes the three findMany where-shapes applyScheduledTransitions issues. */
function matchesWhere(e: FakeElection, where: Record<string, unknown>): boolean {
  if ("candidatesFinalized" in where) {
    // SCHEDULED → OPEN query
    const scheduledOpen = where.scheduledOpen as { lte: Date };
    const scheduledClose = where.scheduledClose as { gt: Date };
    return (
      e.status === "SCHEDULED" &&
      e.archivedAt === null &&
      e.candidatesFinalized === true &&
      e.votersFinalized === true &&
      e.auditVersion !== null &&
      e.scheduledOpen.getTime() <= scheduledOpen.lte.getTime() &&
      e.scheduledClose.getTime() > scheduledClose.gt.getTime()
    );
  }
  if (where.status === "OPEN") {
    // OPEN → CLOSED query
    const scheduledClose = where.scheduledClose as { lte: Date };
    return (
      e.status === "OPEN" &&
      e.archivedAt === null &&
      e.scheduledClose.getTime() <= scheduledClose.lte.getTime()
    );
  }
  // SCHEDULED → CLOSED (missed window) query
  const scheduledOpen = where.scheduledOpen as { lte: Date };
  const scheduledClose = where.scheduledClose as { lte: Date };
  return (
    e.status === "SCHEDULED" &&
    e.archivedAt === null &&
    e.scheduledOpen.getTime() <= scheduledOpen.lte.getTime() &&
    e.scheduledClose.getTime() <= scheduledClose.lte.getTime()
  );
}

const closeElectionWithCertificationMock = vi.fn(
  async (
    _electionId: string,
    _actor: string,
    _allowedStatuses: string[],
    _auditActionOverride?: string,
  ): Promise<void> => {},
);

vi.mock("@/lib/server/close-election", () => ({
  closeElectionWithCertification: (
    electionId: string,
    actor: string,
    allowedStatuses: string[],
    auditActionOverride?: string,
  ) => closeElectionWithCertificationMock(electionId, actor, allowedStatuses, auditActionOverride),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    election: {
      findMany: vi.fn(async (args: { where: Record<string, unknown> }) => {
        return store.filter((e) => matchesWhere(e, args.where)).map((e) => ({ id: e.id }));
      }),
    },
    $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
      let release: (() => void) | undefined;
      const tx = {
        $queryRaw: async (_strings: TemplateStringsArray, ...values: unknown[]) => {
          const id = values[0] as string;
          release = await acquireLock(id);
          return [];
        },
        election: {
          findUnique: async (args: { where: { id: string } }) => {
            const found = store.find((e) => e.id === args.where.id);
            return found ? { status: found.status } : null;
          },
          update: async (args: { where: { id: string }; data: Partial<FakeElection> }) => {
            store = store.map((e) => (e.id === args.where.id ? { ...e, ...args.data } : e));
            return {};
          },
        },
        auditLog: {
          create: async (args: { data: FakeAuditLog }) => {
            auditLogs.push(args.data);
            return {};
          },
        },
      };
      try {
        return await callback(tx);
      } finally {
        if (release) {
          release();
        }
      }
    }),
  },
}));

import { applyScheduledTransitions } from "@/lib/election-transitions";

function makeElection(overrides: Partial<FakeElection> = {}): FakeElection {
  const now = Date.now();
  return {
    id: "e1",
    status: "SCHEDULED",
    archivedAt: null,
    candidatesFinalized: true,
    votersFinalized: true,
    auditVersion: "v1",
    scheduledOpen: new Date(now - 60_000),
    scheduledClose: new Date(now + 60_000),
    ...overrides,
  };
}

beforeEach(() => {
  store = [];
  auditLogs = [];
  rowLocks.clear();
  closeElectionWithCertificationMock.mockReset();
  closeElectionWithCertificationMock.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("applyScheduledTransitions — SCHEDULED → OPEN concurrency guard", () => {
  it("calling the OPEN transition twice concurrently opens the election exactly once and writes a single audit log", async () => {
    store = [makeElection({ id: "e1" })];

    const [r1, r2] = await Promise.all([applyScheduledTransitions(), applyScheduledTransitions()]);

    const openAudits = auditLogs.filter(
      (a) => a.action === "Automatically opened election (scheduled)",
    );
    expect(openAudits).toHaveLength(1);
    expect(store.find((e) => e.id === "e1")?.status).toBe("OPEN");
    // Exactly one of the two concurrent calls should report having opened it.
    expect([...r1.opened, ...r2.opened]).toEqual(["e1"]);
  });

  it("calling the OPEN transition twice sequentially opens the election exactly once and writes a single audit log", async () => {
    store = [makeElection({ id: "e1" })];

    const r1 = await applyScheduledTransitions();
    const r2 = await applyScheduledTransitions();

    const openAudits = auditLogs.filter(
      (a) => a.action === "Automatically opened election (scheduled)",
    );
    expect(openAudits).toHaveLength(1);
    expect(r1.opened).toEqual(["e1"]);
    expect(r2.opened).toEqual([]);
  });
});

describe("applyScheduledTransitions — OPEN → CLOSED batch isolation", () => {
  it("does not let one election's close failure abort processing of the other elections in the same batch", async () => {
    const scheduledClose = new Date(Date.now() - 1_000);
    store = [
      makeElection({ id: "bad", status: "OPEN", scheduledClose }),
      makeElection({ id: "good", status: "OPEN", scheduledClose }),
    ];

    closeElectionWithCertificationMock.mockImplementation(async (electionId: string) => {
      if (electionId === "bad") {
        throw new Error("Only an active election can be closed");
      }
    });

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await applyScheduledTransitions();

    expect(closeElectionWithCertificationMock).toHaveBeenCalledTimes(2);
    expect(result.closed).toEqual(["good"]);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("bad"), expect.any(Error));
  });
});
