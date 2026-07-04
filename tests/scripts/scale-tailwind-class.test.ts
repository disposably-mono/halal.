import { describe, expect, test } from "vitest";
import {
  SCALE_FACTOR,
  SPACING_UNIT_PX,
  scaleArbitraryToken,
  scaleSemanticToken,
} from "../../scripts/lib/scale-tailwind-class.mjs";

describe("scaleArbitraryToken", () => {
  test("scales an arbitrary px value and rounds to nearest integer", () => {
    // 11 * 1.12 = 12.32 -> 12
    expect(scaleArbitraryToken("text", "11")).toBe("text-[12px]");
  });

  test("rounds .5 and above up", () => {
    // 9 * 1.12 = 10.08 -> 10
    expect(scaleArbitraryToken("text", "9")).toBe("text-[10px]");
  });

  test("supports a custom factor", () => {
    expect(scaleArbitraryToken("text", "10", 1.2)).toBe("text-[12px]");
  });
});

describe("scaleSemanticToken", () => {
  test("resolves Tailwind's spacing scale (n * 4px) before scaling", () => {
    // px-4 = 16px; 16 * 1.12 = 17.92 -> 18
    expect(scaleSemanticToken("px", "4")).toBe("px-[18px]");
  });

  test("supports fractional spacing steps", () => {
    // gap-1.5 = 6px; 6 * 1.12 = 6.72 -> 7
    expect(scaleSemanticToken("gap", "1.5")).toBe("gap-[7px]");
  });
});

describe("constants", () => {
  test("SCALE_FACTOR is 1.12", () => {
    expect(SCALE_FACTOR).toBe(1.12);
  });

  test("SPACING_UNIT_PX is 4", () => {
    expect(SPACING_UNIT_PX).toBe(4);
  });
});
