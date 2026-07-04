import { describe, expect, test } from "vitest";
import {
  LARGE_SCALE_FACTOR,
  SMALL_SCALE_FACTOR,
  SMALL_SIZE_THRESHOLD_PX,
  scalePublicArbitraryToken,
  scalePublicFileContents,
  scalePublicSemanticTextToken,
  scalePublicSemanticToken,
} from "../../scripts/lib/scale-public-page-class.mjs";

describe("public page scaling factors", () => {
  test("uses the small-size tier up to 16px", () => {
    expect(SMALL_SCALE_FACTOR).toBe(1.2);
    expect(SMALL_SIZE_THRESHOLD_PX).toBe(16);
    expect(scalePublicArbitraryToken("text", "10")).toBe("text-[12px]");
    expect(scalePublicArbitraryToken("text", "16")).toBe("text-[19px]");
  });

  test("uses the medium-large tier above 16px", () => {
    expect(LARGE_SCALE_FACTOR).toBe(1.13);
    expect(scalePublicArbitraryToken("text", "18")).toBe("text-[20px]");
    expect(scalePublicArbitraryToken("text", "48")).toBe("text-[54px]");
  });
});

describe("public semantic token scaling", () => {
  test("scales spacing tokens by their resolved pixel size", () => {
    expect(scalePublicSemanticToken("px", "2")).toBe("px-[10px]");
    expect(scalePublicSemanticToken("px", "6")).toBe("px-[27px]");
  });

  test("scales Tailwind text size tokens into arbitrary pixel values", () => {
    expect(scalePublicSemanticTextToken("xs")).toBe("text-[14px]");
    expect(scalePublicSemanticTextToken("sm")).toBe("text-[17px]");
    expect(scalePublicSemanticTextToken("5xl")).toBe("text-[54px]");
  });
});

describe("scalePublicFileContents", () => {
  test("scales semantic and arbitrary public page classes in one pass", () => {
    const input =
      `<div className="text-xs sm:text-5xl px-2 py-1.5 gap-4 text-[10px]">Vote</div>`;

    expect(scalePublicFileContents(input)).toBe(
      `<div className="text-[14px] sm:text-[54px] px-[10px] py-[7px] gap-[19px] text-[12px]">Vote</div>`,
    );
  });

  test("scales shared public nav svg width and height attributes", () => {
    const input = `<svg width="14" height="14" viewBox="0 0 14 14"></svg>`;

    expect(scalePublicFileContents(input)).toBe(
      `<svg width="17" height="17" viewBox="0 0 14 14"></svg>`,
    );
  });

  test("does not touch colors or named non-size tokens", () => {
    const input =
      `<div className="text-white/70 bg-navy rounded-sm border-white/10 shadow-lg">Safe</div>`;

    expect(scalePublicFileContents(input)).toBe(input);
  });
});
