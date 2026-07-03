import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const JOSE_FILES = [
  "middleware.ts",
  "lib/voter-session.ts",
  "lib/ballot-confirmation.ts",
];

describe("jose imports", () => {
  it("imports JWT helpers from narrow subpaths to keep edge bundles lean", () => {
    const imports = JOSE_FILES.map((filePath) => readFileSync(filePath, "utf8"));

    expect(imports.join("\n")).not.toMatch(/from ["']jose["']/);
  });

  it("keeps the edge middleware off the broad NextAuth server entrypoint", () => {
    const middleware = readFileSync("middleware.ts", "utf8");

    expect(middleware).not.toMatch(/from ["']next-auth["']/);
  });
});
