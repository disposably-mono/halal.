import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  voter: {
    findMany: vi.fn(),
  },
}));

const guardMock = vi.hoisted(() => ({
  requireCapabilityOrError: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/server/auth", () => ({
  requireCapabilityOrError: guardMock.requireCapabilityOrError,
}));

vi.mock("@/lib/auth/permissions", () => ({
  permissionErrorMessage: vi.fn(() => "Access denied"),
}));

vi.mock("@/lib/domain/csv", () => ({
  rowsToCsv: vi.fn(() => "csv"),
}));

import { GET } from "@/app/api/elections/[id]/voters/export/route";

beforeEach(() => {
  prismaMock.voter.findMany.mockReset();
  guardMock.requireCapabilityOrError.mockReset();
});

describe("/api/elections/[id]/voters/export hardening", () => {
  it("keeps forbidden responses JSON-shaped", async () => {
    guardMock.requireCapabilityOrError.mockResolvedValue({
      ok: false,
      error: "Forbidden",
    });

    const response = await GET(new Request("http://localhost/api/elections/e1/voters/export"), {
      params: { id: "e1" },
    });

    expect(response.status).toBe(403);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({
      error: "Access denied",
    });
  });

  it("returns JSON when voter export throws", async () => {
    guardMock.requireCapabilityOrError.mockResolvedValue({
      ok: true,
    });
    prismaMock.voter.findMany.mockRejectedValue(new Error("database unavailable"));

    const response = await GET(new Request("http://localhost/api/elections/e1/voters/export"), {
      params: { id: "e1" },
    });

    expect(response.status).toBe(500);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({
      error: "Failed to export voters.",
    });
  });
});
