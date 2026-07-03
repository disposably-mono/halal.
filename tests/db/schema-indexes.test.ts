import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const SCHEMA = readFileSync("prisma/schema.prisma", "utf8");

describe("database performance indexes", () => {
  it("indexes active homepage elections by archive status and scheduled open time", () => {
    expect(SCHEMA).toContain("@@index([archivedAt, scheduledOpen])");
  });

  it("indexes position candidate lists by name for admin candidate pages", () => {
    expect(SCHEMA).toContain("@@index([positionId, fullName])");
  });

  it("indexes vote tallies by position for results groupBy queries", () => {
    expect(SCHEMA).toMatch(/model Vote \{[\s\S]*?@@index\(\[positionId\]\)/);
  });
});
