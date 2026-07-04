import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, test } from "vitest";

type NextConfigWithDistDir = {
  distDir?: string;
};

async function importNextConfig(): Promise<NextConfigWithDistDir> {
  const url = pathToFileURL(path.resolve("next.config.mjs"));
  url.searchParams.set("cacheBust", randomUUID());
  const imported = await import(url.href);
  return imported.default as NextConfigWithDistDir;
}

describe("Next development cache isolation", () => {
  afterEach(() => {
    delete process.env.NEXT_DIST_DIR;
  });

  test("keeps the normal Next cache location by default", async () => {
    delete process.env.NEXT_DIST_DIR;

    const config = await importNextConfig();

    expect(config.distDir).toBe(".next");
  });

  test("allows Playwright to use an isolated cache location", async () => {
    process.env.NEXT_DIST_DIR = ".next-e2e";

    const config = await importNextConfig();

    expect(config.distDir).toBe(".next-e2e");
  });

  test("does not wipe the shared Next cache before E2E", () => {
    const config = readFileSync("playwright.config.ts", "utf8");

    expect(config).toContain("NEXT_DIST_DIR=.next-e2e");
    expect(config).not.toMatch(/\brm -rf \.next(?:\s|&&)/);
  });
});
