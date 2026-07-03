import { beforeEach, describe, expect, it, vi } from "vitest";

// Minimal `tx` stub shared across the mocked `$transaction` calls. Mirrors the
// shape `control/actions.ts` relies on: a row-lock query, then `findUnique`,
// `update`, and `auditLog.create` on the same transaction client.
const txMock = {
  $queryRaw: vi.fn(async () => []),
  election: {
    findUnique: vi.fn(),
    update: vi.fn(async () => ({})),
  },
  auditLog: {
    create: vi.fn(async () => ({})),
  },
};

const transactionMock = vi.fn(async (cb: (tx: typeof txMock) => Promise<void>) => cb(txMock));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (...args: Parameters<typeof transactionMock>) => transactionMock(...args),
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

import { archiveElection, restoreElection } from "@/app/(admin)/admin/actions";

beforeEach(() => {
  txMock.$queryRaw.mockClear();
  txMock.election.findUnique.mockReset();
  txMock.election.update.mockClear();
  txMock.auditLog.create.mockClear();
  transactionMock.mockClear();
});

describe("archiveElection race safety", () => {
  it("takes the row lock before reading the election inside the transaction", async () => {
    txMock.election.findUnique.mockResolvedValue({
      id: "e1",
      status: "CLOSED",
      archivedAt: null,
    });

    await archiveElection("e1");

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(txMock.$queryRaw).toHaveBeenCalledTimes(1);
    const lockOrder = txMock.$queryRaw.mock.invocationCallOrder[0];
    const readOrder = txMock.election.findUnique.mock.invocationCallOrder[0];
    expect(lockOrder).toBeLessThan(readOrder);
  });

  it("rejects archiving when a concurrent transition opened the election before the lock resolved", async () => {
    // Simulates the race from the audit: openElectionNow's `FOR UPDATE` wins
    // the lock first and flips status to OPEN; once archiveElection's own
    // lock resolves, its in-transaction read must see that fresh state and
    // reject the archive rather than acting on stale pre-open data.
    txMock.election.findUnique.mockResolvedValue({
      id: "e1",
      status: "OPEN",
      archivedAt: null,
    });

    const result = await archiveElection("e1");

    expect(result).toEqual({ success: false, error: "Close the election before archiving" });
    expect(txMock.election.update).not.toHaveBeenCalled();
    expect(txMock.auditLog.create).not.toHaveBeenCalled();
  });

  it("archives a CLOSED election when no race occurs", async () => {
    txMock.election.findUnique.mockResolvedValue({
      id: "e1",
      status: "CLOSED",
      archivedAt: null,
    });

    const result = await archiveElection("e1");

    expect(result).toEqual({ success: true });
    expect(txMock.election.update).toHaveBeenCalledWith({
      where: { id: "e1" },
      data: expect.objectContaining({ archivedBy: "admin@example.com" }),
    });
    expect(txMock.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it("reports election-not-found without touching the update path", async () => {
    txMock.election.findUnique.mockResolvedValue(null);

    const result = await archiveElection("missing");

    expect(result).toEqual({ success: false, error: "Election not found" });
    expect(txMock.election.update).not.toHaveBeenCalled();
  });
});

describe("restoreElection race safety", () => {
  it("rejects restoring when the election is no longer archived by the time the lock resolves", async () => {
    txMock.election.findUnique.mockResolvedValue({ id: "e1", archivedAt: null });

    const result = await restoreElection("e1");

    expect(result).toEqual({ success: false, error: "Election is not archived" });
    expect(txMock.election.update).not.toHaveBeenCalled();
    expect(txMock.auditLog.create).not.toHaveBeenCalled();
  });

  it("restores an archived election when no race occurs", async () => {
    txMock.election.findUnique.mockResolvedValue({ id: "e1", archivedAt: new Date() });

    const result = await restoreElection("e1");

    expect(result).toEqual({ success: true });
    expect(txMock.election.update).toHaveBeenCalledWith({
      where: { id: "e1" },
      data: { archivedAt: null, archivedBy: null },
    });
  });
});
