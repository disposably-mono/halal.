import { beforeEach, describe, expect, it, vi } from "vitest";

// Mirrors the tx stub in tests/admin/archive-restore-race.test.ts: a row-lock
// query, then whatever reads/writes each lifecycle action needs, all on the
// same mocked transaction client.
const txMock = {
  $queryRaw: vi.fn(async () => []),
  election: {
    findUnique: vi.fn(),
    update: vi.fn(async () => ({})),
  },
  auditLog: {
    create: vi.fn(async () => ({})),
  },
  recount: {
    create: vi.fn(async () => ({})),
  },
};

const transactionMock = vi.fn(async (cb: (tx: typeof txMock) => Promise<void>) => cb(txMock));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (...args: Parameters<typeof transactionMock>) => transactionMock(...args),
    election: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/server/auth", () => ({
  requireCapabilityOrError: vi.fn(async () => ({
    ok: true,
    session: { user: { email: "admin@example.com", role: "COMMISSIONER" } },
  })),
  adminEmailFromSession: () => "admin@example.com",
}));

vi.mock("@/lib/server/revalidate", () => ({
  revalidateAdminDashboard: vi.fn(),
  revalidateElectionControl: vi.fn(),
}));

vi.mock("@/lib/server/monitor-broadcast", () => ({
  scheduleMonitorRefresh: vi.fn(),
}));

vi.mock("@/lib/server/close-election", () => ({
  closeElectionWithCertification: vi.fn(),
}));

vi.mock("@/lib/server/election-audit", () => ({
  loadAuditSnapshot: vi.fn(async () => ({
    snapshot: {
      version: 1,
      ballots: { total: 0, valid: 0, invalid: 0 },
      turnout: { voted: 0, total: 0 },
      positions: [],
    },
    auditKey: Buffer.from("k"),
  })),
}));

vi.mock("@/lib/domain/ballot-audit", () => ({
  hashSnapshot: () => "hash",
  signSnapshot: () => "sig",
  verifySnapshotSignature: () => true,
}));

vi.mock("@/lib/domain/audit-tally", () => ({
  compareAuditSnapshots: () => [],
}));

import {
  advanceToScheduled,
  initiateRecount,
  openElectionNow,
  rescheduleElection,
} from "@/app/(admin)/admin/elections/[id]/control/actions";
import { scheduleMonitorRefresh } from "@/lib/server/monitor-broadcast";
import { revalidateAdminDashboard, revalidateElectionControl } from "@/lib/server/revalidate";

beforeEach(() => {
  txMock.$queryRaw.mockClear();
  txMock.election.findUnique.mockReset();
  txMock.election.update.mockClear();
  txMock.auditLog.create.mockClear();
  txMock.recount.create.mockClear();
  transactionMock.mockClear();
  vi.mocked(scheduleMonitorRefresh).mockClear();
  vi.mocked(revalidateAdminDashboard).mockClear();
  vi.mocked(revalidateElectionControl).mockClear();
});

describe("openElectionNow", () => {
  it("takes the row lock before reading the election", async () => {
    txMock.election.findUnique.mockResolvedValue({
      id: "e1",
      status: "SCHEDULED",
      archivedAt: null,
      auditVersion: 1,
      auditKeyEncrypted: "enc",
    });

    await openElectionNow("e1");

    const lockOrder = txMock.$queryRaw.mock.invocationCallOrder[0];
    const readOrder = txMock.election.findUnique.mock.invocationCallOrder[0];
    expect(lockOrder).toBeLessThan(readOrder);
  });

  it("passes the domain-check reason through verbatim when already open", async () => {
    txMock.election.findUnique.mockResolvedValue({
      id: "e1",
      status: "OPEN",
      archivedAt: null,
      auditVersion: 1,
      auditKeyEncrypted: "enc",
    });

    const result = await openElectionNow("e1");

    expect(result).toEqual({ success: false, error: "Already open" });
    expect(txMock.election.update).not.toHaveBeenCalled();
    expect(txMock.auditLog.create).not.toHaveBeenCalled();
  });

  it("opens a scheduled election and broadcasts + revalidates on success", async () => {
    txMock.election.findUnique.mockResolvedValue({
      id: "e1",
      status: "SCHEDULED",
      archivedAt: null,
      auditVersion: 1,
      auditKeyEncrypted: "enc",
    });

    const result = await openElectionNow("e1");

    expect(result).toEqual({ success: true });
    expect(txMock.election.update).toHaveBeenCalledWith({
      where: { id: "e1" },
      data: { status: "OPEN" },
    });
    expect(txMock.auditLog.create).toHaveBeenCalledTimes(1);
    expect(scheduleMonitorRefresh).toHaveBeenCalledWith("e1");
    expect(revalidateAdminDashboard).toHaveBeenCalled();
    expect(revalidateElectionControl).toHaveBeenCalledWith("e1");
  });

  it("reports election-not-found without touching the update path", async () => {
    txMock.election.findUnique.mockResolvedValue(null);

    const result = await openElectionNow("missing");

    expect(result).toEqual({ success: false, error: "Election not found" });
    expect(txMock.election.update).not.toHaveBeenCalled();
  });
});

describe("advanceToScheduled", () => {
  it("rejects a non-DRAFT election with the domain reason", async () => {
    txMock.election.findUnique.mockResolvedValue({
      id: "e1",
      status: "OPEN",
      scheduledOpen: new Date(),
      archivedAt: null,
    });

    const result = await advanceToScheduled("e1");

    expect(result).toEqual({
      success: false,
      error: "Only DRAFT elections can be advanced to Scheduled",
    });
    expect(txMock.election.update).not.toHaveBeenCalled();
  });

  it("advances a DRAFT election with a scheduled open time and revalidates (no broadcast)", async () => {
    txMock.election.findUnique.mockResolvedValue({
      id: "e1",
      status: "DRAFT",
      scheduledOpen: new Date(),
      archivedAt: null,
    });

    const result = await advanceToScheduled("e1");

    expect(result).toEqual({ success: true });
    expect(txMock.election.update).toHaveBeenCalledWith({
      where: { id: "e1" },
      data: { status: "SCHEDULED" },
    });
    expect(scheduleMonitorRefresh).not.toHaveBeenCalled();
    expect(revalidateAdminDashboard).toHaveBeenCalled();
  });
});

describe("rescheduleElection", () => {
  it("rejects an open time after the close time", async () => {
    txMock.election.findUnique.mockResolvedValue({
      id: "e1",
      status: "DRAFT",
      archivedAt: null,
    });

    const result = await rescheduleElection(
      "e1",
      "2026-08-02T00:00:00.000Z",
      "2026-08-01T00:00:00.000Z",
    );

    expect(result).toEqual({ success: false, error: "Open time must be before close time" });
    expect(txMock.election.update).not.toHaveBeenCalled();
  });

  it("reschedules and keeps an already-OPEN election OPEN", async () => {
    txMock.election.findUnique.mockResolvedValue({
      id: "e1",
      status: "OPEN",
      archivedAt: null,
    });

    const result = await rescheduleElection(
      "e1",
      "2026-08-01T00:00:00.000Z",
      "2026-08-02T00:00:00.000Z",
    );

    expect(result).toEqual({ success: true });
    expect(txMock.election.update).toHaveBeenCalledWith({
      where: { id: "e1" },
      data: expect.objectContaining({ status: "OPEN" }),
    });
  });
});

describe("initiateRecount", () => {
  it("collapses election-not-found to the generic recount-failed message (pre-existing behavior)", async () => {
    txMock.election.findUnique.mockResolvedValue(null);

    const result = await initiateRecount("missing");

    expect(result).toEqual({ success: false, error: "Recount failed" });
    expect(txMock.recount.create).not.toHaveBeenCalled();
  });

  it("creates a recount and audit row, then revalidates without broadcasting", async () => {
    txMock.election.findUnique.mockResolvedValue({
      id: "e1",
      status: "CLOSED",
      auditKeyEncrypted: "enc",
      certification: { snapshot: {}, snapshotHash: "hash", signature: "sig" },
    });

    const result = await initiateRecount("e1");

    expect(result).toEqual({ success: true });
    expect(txMock.recount.create).toHaveBeenCalledTimes(1);
    expect(txMock.auditLog.create).toHaveBeenCalledTimes(1);
    expect(scheduleMonitorRefresh).not.toHaveBeenCalled();
    expect(revalidateAdminDashboard).toHaveBeenCalled();
  });
});
