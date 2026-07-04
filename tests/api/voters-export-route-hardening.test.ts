import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const prismaMock = vi.hoisted(() => ({
  voter: {
    findMany: vi.fn(),
  },
}));

const guardMock = vi.hoisted(() => ({
  requireCapabilityOrJsonError: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/server/auth", () => ({
  requireCapabilityOrJsonError: guardMock.requireCapabilityOrJsonError,
}));

vi.mock("@/lib/domain/csv", () => ({
  rowsToCsv: vi.fn(() => "csv"),
}));

import { GET } from "@/app/api/elections/[id]/voters/export/route";

beforeEach(() => {
  prismaMock.voter.findMany.mockReset();
  guardMock.requireCapabilityOrJsonError.mockReset();
});

describe("/api/elections/[id]/voters/export hardening", () => {
  it("keeps forbidden responses JSON-shaped", async () => {
    guardMock.requireCapabilityOrJsonError.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "Access denied" }, { status: 403 }),
    });

    const response = await GET(new Request("http://localhost/api/elections/e1/voters/export"), {
      params: Promise.resolve({ id: "e1" }),
    });

    expect(response.status).toBe(403);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({
      error: "Access denied",
    });
  });

  it("returns JSON when voter export throws", async () => {
    guardMock.requireCapabilityOrJsonError.mockResolvedValue({
      ok: true,
    });
    prismaMock.voter.findMany.mockRejectedValue(new Error("database unavailable"));

    const response = await GET(new Request("http://localhost/api/elections/e1/voters/export"), {
      params: Promise.resolve({ id: "e1" }),
    });

    expect(response.status).toBe(500);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({
      error: "Failed to export voters.",
    });
  });
});
