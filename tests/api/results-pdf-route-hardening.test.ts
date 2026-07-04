import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const prismaMock = vi.hoisted(() => ({
  election: {
    findUnique: vi.fn(),
  },
  electionCertification: {
    findUnique: vi.fn(),
  },
  position: {
    findMany: vi.fn(),
  },
  vote: {
    groupBy: vi.fn(),
  },
  voter: {
    groupBy: vi.fn(),
  },
}));

const renderToBufferMock = vi.hoisted(() => ({
  renderToBuffer: vi.fn(),
}));

const tallyMock = vi.hoisted(() => ({
  buildVoteMap: vi.fn(() => new Map()),
  computePositionTally: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/server/auth", () => ({
  requireCapabilityOrJsonError: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@react-pdf/renderer", () => ({
  renderToBuffer: renderToBufferMock.renderToBuffer,
}));

vi.mock("@/lib/pdf/ResultsPDF", () => ({
  ResultsPDF: () => null,
}));

vi.mock("@/lib/domain/tally", () => tallyMock);

import { GET } from "@/app/api/elections/[id]/results-pdf/route";

beforeEach(() => {
  prismaMock.election.findUnique.mockReset();
  prismaMock.electionCertification.findUnique.mockReset();
  prismaMock.position.findMany.mockReset();
  prismaMock.vote.groupBy.mockReset();
  prismaMock.voter.groupBy.mockReset();
  renderToBufferMock.renderToBuffer.mockReset();
  tallyMock.buildVoteMap.mockClear();
  tallyMock.computePositionTally.mockClear();
});

describe("/api/elections/[id]/results-pdf hardening", () => {
  it("returns JSON when PDF rendering throws", async () => {
    prismaMock.election.findUnique.mockResolvedValue({
      id: "e1",
      name: "Sample Election",
      division: "SHS",
      status: "CLOSED",
      updatedAt: new Date("2026-07-01T00:00:00.000Z"),
      _count: { voters: 0 },
      certification: null,
      auditKeyEncrypted: null,
      auditVersion: null,
    });
    prismaMock.position.findMany.mockResolvedValue([]);
    prismaMock.vote.groupBy.mockResolvedValue([]);
    prismaMock.voter.groupBy.mockResolvedValue([]);
    renderToBufferMock.renderToBuffer.mockRejectedValue(new Error("render boom"));

    const response = await GET(new NextRequest("http://localhost/api/elections/e1/results-pdf"), {
      params: Promise.resolve({ id: "e1" }),
    });

    expect(response.status).toBe(500);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({
      error: "Failed to generate PDF.",
    });
  });
});
