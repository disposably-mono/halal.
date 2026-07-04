import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  election: {
    findUnique: vi.fn(),
  },
}));

const loadSnapshotsMock = vi.hoisted(() => ({
  loadSnapshots: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/server/auth", () => ({
  requireCapabilityOrJsonError: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/lib/server/monitor-snapshots", () => ({
  loadSnapshots: loadSnapshotsMock.loadSnapshots,
}));

import { GET } from "@/app/api/elections/[id]/monitor-snapshots/route";

beforeEach(() => {
  prismaMock.election.findUnique.mockReset();
  loadSnapshotsMock.loadSnapshots.mockReset();
});

describe("/api/elections/[id]/monitor-snapshots hardening", () => {
  it("returns JSON when snapshot loading throws", async () => {
    prismaMock.election.findUnique.mockResolvedValue({ id: "e1" });
    loadSnapshotsMock.loadSnapshots.mockRejectedValue(new Error("cache miss"));

    const response = await GET(new Request("http://localhost/api/elections/e1/monitor-snapshots"), {
      params: Promise.resolve({ id: "e1" }),
    });

    expect(response.status).toBe(500);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({
      error: "Failed to load snapshots.",
    });
  });
});
