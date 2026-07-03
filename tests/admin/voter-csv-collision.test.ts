import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

// Mirrors the mocking style of tests/admin/archive-restore-race.test.ts and
// tests/admin/candidates-finalize-race.test.ts, adapted for the (non-locked,
// createMany-based) voter CSV import path in voters/actions.ts.
// `vi.hoisted` is required here (unlike the other two files) because the
// mock factory below is hoisted above this module's own top-level bindings.
const prismaMock = vi.hoisted(() => ({
  election: {
    findUnique: vi.fn(),
  },
  voter: {
    findMany: vi.fn(),
    createMany: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/server/auth", () => ({
  requireCapability: vi.fn(async () => ({
    user: { email: "admin@example.com", role: "COMMISSIONER" },
  })),
}));

vi.mock("@/lib/server/revalidate", () => ({
  revalidateElectionVoters: vi.fn(),
}));

import { addVotersFromCSV } from "@/app/(admin)/admin/elections/[id]/voters/actions";
import { revalidateElectionVoters } from "@/lib/server/revalidate";

const CSV_TEXT = ["studentId,gradeLevel,section", "2026-0001,11,A", "2026-0002,11,A"].join("\n");

function buildFormData() {
  const formData = new FormData();
  formData.set("electionId", "e1");
  formData.set("csvText", CSV_TEXT);
  formData.set("schoolYear", "2026");
  return formData;
}

beforeEach(() => {
  prismaMock.election.findUnique.mockReset();
  prismaMock.voter.findMany.mockReset();
  prismaMock.voter.createMany.mockReset();
  vi.mocked(revalidateElectionVoters).mockClear();

  prismaMock.election.findUnique.mockResolvedValue({
    division: "SHS",
    status: "DRAFT",
    votersFinalized: false,
  });
  // No pre-existing voters/codes, so parseVotersCSV accepts both CSV rows.
  prismaMock.voter.findMany.mockResolvedValue([]);
});

describe("addVotersFromCSV collision handling", () => {
  it("imports every row when createMany succeeds without collisions", async () => {
    prismaMock.voter.createMany.mockResolvedValue({ count: 2 });

    const result = await addVotersFromCSV(null, buildFormData());

    expect(result).toMatchObject({ added: 2, rejected: 0, skippedDuplicates: 0 });
    expect(revalidateElectionVoters).toHaveBeenCalledWith("e1");
  });

  it("degrades to a partial-success result when skipDuplicates drops racing rows", async () => {
    // Simulates a concurrent import claiming one of the two control numbers
    // between our uniqueness scan and this write; skipDuplicates lets the
    // non-colliding row land instead of aborting the whole batch.
    prismaMock.voter.createMany.mockResolvedValue({ count: 1 });

    const result = await addVotersFromCSV(null, buildFormData());

    expect(result?.added).toBe(1);
    expect(result?.reasons.some((r) => /1 of 2 voters imported/.test(r))).toBe(true);
    expect(result?.reasons.some((r) => /collision/i.test(r))).toBe(true);
    expect(revalidateElectionVoters).toHaveBeenCalledWith("e1");
  });

  it("catches a raw P2002 unique-constraint error instead of throwing, degrading to zero imported", async () => {
    // Defensive fallback path: even with skipDuplicates requested, a raw
    // constraint violation must not crash the server action the way an
    // unhandled createMany rejection previously did.
    prismaMock.voter.createMany.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    const result = await addVotersFromCSV(null, buildFormData());

    expect(result?.added).toBe(0);
    expect(result?.reasons.some((r) => /0 of 2 voters imported/.test(r))).toBe(true);
    expect(revalidateElectionVoters).not.toHaveBeenCalled();
  });

  it("rethrows unexpected (non-P2002) errors from createMany", async () => {
    prismaMock.voter.createMany.mockRejectedValue(new Error("connection reset"));

    await expect(addVotersFromCSV(null, buildFormData())).rejects.toThrow("connection reset");
  });
});
