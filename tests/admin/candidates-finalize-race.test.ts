import { beforeEach, describe, expect, it, vi } from "vitest";

// Minimal `tx` stub shared across the mocked `$transaction` calls. Mirrors the
// shape `control/actions.ts` (and `tests/admin/archive-restore-race.test.ts`)
// rely on: a row-lock query on the Election row, then reads/writes scoped to
// that same transaction client.
const txMock = {
  $queryRaw: vi.fn(async () => []),
  election: {
    findUnique: vi.fn(),
    update: vi.fn(async () => ({})),
  },
  position: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(async () => ({})),
  },
  candidate: {
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
  requireCapability: vi.fn(async () => ({
    user: { email: "admin@example.com", role: "COMMISSIONER" },
  })),
}));

vi.mock("@/lib/server/revalidate", () => ({
  revalidateElectionCandidates: vi.fn(),
}));

import {
  addCandidate,
  finalizeCandidates,
  removePosition,
} from "@/app/(admin)/admin/elections/[id]/candidates/actions";
import { revalidateElectionCandidates } from "@/lib/server/revalidate";

beforeEach(() => {
  txMock.$queryRaw.mockClear();
  txMock.election.findUnique.mockReset();
  txMock.election.update.mockClear();
  txMock.position.findMany.mockReset();
  txMock.position.findUnique.mockReset();
  txMock.position.update.mockClear();
  txMock.candidate.create.mockClear();
  transactionMock.mockClear();
  vi.mocked(revalidateElectionCandidates).mockClear();
});

describe("finalizeCandidates race safety", () => {
  it("takes the row lock before reading the election inside the transaction", async () => {
    txMock.election.findUnique.mockResolvedValue({
      status: "DRAFT",
      candidatesFinalized: false,
    });
    txMock.position.findMany.mockResolvedValue([
      { title: "President", _count: { candidates: 2 } },
    ]);

    const formData = new FormData();
    formData.set("electionId", "e1");

    await finalizeCandidates(null, formData);

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(txMock.$queryRaw).toHaveBeenCalledTimes(1);
    const lockOrder = txMock.$queryRaw.mock.invocationCallOrder[0];
    const readOrder = txMock.election.findUnique.mock.invocationCallOrder[0];
    expect(lockOrder).toBeLessThan(readOrder);
  });

  it("rejects finalizing when a concurrent addCandidate/removePosition already finalized it before the lock resolved", async () => {
    // Simulates the audited race: two admins call finalizeCandidates and
    // addCandidate concurrently. Once this call's lock resolves, its
    // in-transaction read must see the fresh "already finalized" state and
    // refuse, rather than acting on stale pre-lock data.
    txMock.election.findUnique.mockResolvedValue({
      status: "DRAFT",
      candidatesFinalized: true,
    });

    const formData = new FormData();
    formData.set("electionId", "e1");

    const result = await finalizeCandidates(null, formData);

    expect(result).toEqual({
      success: false,
      error: "Candidate list is finalized and cannot be modified.",
    });
    expect(txMock.election.update).not.toHaveBeenCalled();
  });

  it("finalizes when every active position has at least one candidate", async () => {
    txMock.election.findUnique.mockResolvedValue({
      status: "SCHEDULED",
      candidatesFinalized: false,
    });
    txMock.position.findMany.mockResolvedValue([
      { title: "President", _count: { candidates: 1 } },
      { title: "Secretary", _count: { candidates: 1 } },
    ]);

    const formData = new FormData();
    formData.set("electionId", "e1");

    const result = await finalizeCandidates(null, formData);

    expect(result).toEqual({ success: true });
    expect(txMock.election.update).toHaveBeenCalledWith({
      where: { id: "e1" },
      data: { candidatesFinalized: true },
    });
  });
});

describe("addCandidate race safety", () => {
  it("locks the election row before creating the candidate", async () => {
    txMock.position.findUnique.mockResolvedValue({
      candidateGrade: "11",
      electionId: "e1",
      election: { status: "DRAFT", candidatesFinalized: false },
    });

    const formData = new FormData();
    formData.set("positionId", "p1");
    formData.set("electionId", "e1");
    formData.set("fullName", "Jane Doe");

    await addCandidate(formData);

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(txMock.$queryRaw).toHaveBeenCalledTimes(1);
    const lockOrder = txMock.$queryRaw.mock.invocationCallOrder[0];
    const readOrder = txMock.position.findUnique.mock.invocationCallOrder[0];
    expect(lockOrder).toBeLessThan(readOrder);
    expect(txMock.candidate.create).toHaveBeenCalledTimes(1);
  });

  it("no-ops when a concurrent finalizeCandidates locked in first", async () => {
    txMock.position.findUnique.mockResolvedValue({
      candidateGrade: "11",
      electionId: "e1",
      election: { status: "DRAFT", candidatesFinalized: true },
    });

    const formData = new FormData();
    formData.set("positionId", "p1");
    formData.set("electionId", "e1");
    formData.set("fullName", "Jane Doe");

    await addCandidate(formData);

    expect(txMock.candidate.create).not.toHaveBeenCalled();
  });
});

describe("removePosition race safety", () => {
  it("no-ops when a concurrent finalizeCandidates locked in first", async () => {
    txMock.position.findUnique.mockResolvedValue({
      electionId: "e1",
      election: { status: "DRAFT", candidatesFinalized: true },
    });

    const formData = new FormData();
    formData.set("positionId", "p1");
    formData.set("electionId", "e1");

    await removePosition(formData);

    expect(txMock.position.update).not.toHaveBeenCalled();
  });

  it("deactivates the position when the roster is still editable", async () => {
    txMock.position.findUnique.mockResolvedValue({
      electionId: "e1",
      election: { status: "DRAFT", candidatesFinalized: false },
    });

    const formData = new FormData();
    formData.set("positionId", "p1");
    formData.set("electionId", "e1");

    await removePosition(formData);

    expect(txMock.position.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { isActive: false },
    });
  });
});
