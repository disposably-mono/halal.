import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const JOSE_FILES = [
  "proxy.ts",
  "lib/voter-session.ts",
  "lib/ballot-confirmation.ts",
];

describe("jose imports", () => {
  it("imports JWT helpers from narrow subpaths to keep edge bundles lean", () => {
    const imports = JOSE_FILES.map((filePath) => readFileSync(filePath, "utf8"));

    expect(imports.join("\n")).not.toMatch(/from ["']jose["']/);
  });

  it("keeps the edge proxy off the broad NextAuth server entrypoint", () => {
    const proxy = readFileSync("proxy.ts", "utf8");

    expect(proxy).not.toMatch(/from ["']next-auth["']/);
  });
});
