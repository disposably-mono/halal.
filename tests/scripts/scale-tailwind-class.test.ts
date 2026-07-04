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

import { scaleFileContents } from "../../scripts/lib/scale-tailwind-class.mjs";

describe("scaleFileContents", () => {
  test("scales arbitrary bracket classes", () => {
    const input = `<p className="text-[11px] text-white/45">Hi</p>`;
    const output = scaleFileContents(input);
    expect(output).toBe(`<p className="text-[12px] text-white/45">Hi</p>`);
  });

  test("scales semantic scale classes to arbitrary pixel equivalents", () => {
    const input = `<div className="flex h-4 w-4 gap-2 px-4">`;
    const output = scaleFileContents(input);
    expect(output).toBe(`<div className="flex h-[18px] w-[18px] gap-[9px] px-[18px]">`);
  });

  test("does not touch colors, opacity, or unrelated numeric utilities", () => {
    const input = `<div className="bg-white/6 text-gold/70 opacity-40 z-10 grid-cols-2 border-2">`;
    expect(scaleFileContents(input)).toBe(input);
  });

  test("does not touch arbitrary values in units other than px", () => {
    const input = `<div className="max-w-[90%] text-[1.5rem]">`;
    expect(scaleFileContents(input)).toBe(input);
  });

  test("handles compound prefixes (gap-x, gap-y, translate-y, inset-x)", () => {
    const input = `<div className="gap-x-2 gap-y-4 -translate-y-1 inset-x-0">`;
    // gap-x-2=8px->9px, gap-y-4=16px->18px, -translate-y-1=-4px*1.12=-4.48->-4 (no visible change), inset-x-0=0px->0px
    expect(scaleFileContents(input)).toBe(
      `<div className="gap-x-[9px] gap-y-[18px] -translate-y-[4px] inset-x-[0px]">`,
    );
  });

  test("scales rounded arbitrary values but leaves named rounded tokens alone", () => {
    const input = `<div className="rounded-[8px] rounded-full rounded-lg">`;
    expect(scaleFileContents(input)).toBe(
      `<div className="rounded-[9px] rounded-full rounded-lg">`,
    );
  });

  test("scales inline SVG icon width/height pairs", () => {
    const input = `<svg style={{ width: 12, height: 12 }} viewBox="0 0 24 24">`;
    expect(scaleFileContents(input)).toBe(
      `<svg style={{ width: 13, height: 13 }} viewBox="0 0 24 24">`,
    );
  });

  test("does not touch percentage or variable-based inline widths", () => {
    const input = `<div style={{ width: \`\${p}%\` }} /><div style={{ height: H }} />`;
    expect(scaleFileContents(input)).toBe(input);
  });
});
