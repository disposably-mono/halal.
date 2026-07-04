import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

describe("officers page images", () => {
  test("sets sizes on fill images to avoid Next image warnings", () => {
    const pageSource = readFileSync("app/officers/page.tsx", "utf8");

    expect(pageSource).toContain("export const OFFICER_PHOTO_SIZES");
    expect(pageSource).toContain("fill sizes={OFFICER_PHOTO_SIZES}");
  });
});
