import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const prismaMock = vi.hoisted(() => ({
  election: {
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/server/auth", () => ({
  requireCapabilityOrError: vi.fn(),
}));

vi.mock("@/lib/server/ttl-cache", () => ({
  cached: vi.fn(),
}));

vi.mock("@/lib/server/results-aggregate", () => ({
  buildLivePositions: vi.fn(),
  computeResultsAggregate: vi.fn(),
}));

vi.mock("@/lib/server/election-audit", () => ({
  verifyStoredCertification: vi.fn(),
}));

vi.mock("@/lib/domain/tally", () => ({
  computePositionTally: vi.fn(),
}));

import { GET } from "@/app/api/results/[id]/route";

beforeEach(() => {
  prismaMock.election.findUnique.mockReset();
});

describe("/api/results/[id] hardening", () => {
  it("returns JSON when the election lookup throws", async () => {
    prismaMock.election.findUnique.mockRejectedValue(new Error("db timeout"));

    const response = await GET(new NextRequest("http://localhost/api/results/e1"), {
      params: Promise.resolve({ id: "e1" }),
    });

    expect(response.status).toBe(500);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({
      error: "Failed to load results.",
    });
  });
});
