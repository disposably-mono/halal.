import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

describe("COMELEC logo assets", () => {
  test("public logo svg preserves the official artwork with a tighter viewBox", () => {
    const source = readFileSync(resolve("public/comelec-bird.svg"), "utf8");

    expect(source).toContain(`viewBox="113 69 449 448"`);
    expect(source).toContain(`scale(0.100000,-0.100000)`);
    expect(source).toContain(`M2655 5237`);
  });

  test("app icon svg reuses the official logo crop inside the badge", () => {
    const source = readFileSync(resolve("app/icon.svg"), "utf8");

    expect(source).toContain(`viewBox="113 69 449 448"`);
    expect(source).toContain(`scale(0.100000,-0.100000)`);
    expect(source).toContain(`M2655 5237`);
  });

  test("shared nav bird icon renders the official svg asset at a readable size", () => {
    const source = readFileSync(resolve("app/_components/PublicPageDecor.tsx"), "utf8");

    expect(source).toContain(`src="/comelec-bird.svg"`);
    expect(source).toContain(`className="w-[24px] h-[24px] object-contain"`);
  });
});
