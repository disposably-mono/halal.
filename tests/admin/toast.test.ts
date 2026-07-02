import { describe, expect, test } from "vitest";
import {
  DEFAULT_TOAST_DURATION_MS,
  mapToastColorToVariant,
  resolveToastOptions,
} from "@/components/admin/toast";

describe("admin toast options", () => {
  test("maps legacy colors to Toast v2 variants", () => {
    expect(mapToastColorToVariant("green")).toBe("success");
    expect(mapToastColorToVariant("red")).toBe("error");
    expect(mapToastColorToVariant("amber")).toBe("warning");
    expect(mapToastColorToVariant("blue")).toBe("info");
  });

  test("persists error toasts and auto-dismisses other variants by default", () => {
    expect(resolveToastOptions({ msg: "Saved", variant: "success" })).toEqual({
      durationMs: DEFAULT_TOAST_DURATION_MS,
      variant: "success",
    });
    expect(resolveToastOptions({ msg: "Failed", variant: "error" })).toEqual({
      durationMs: null,
      variant: "error",
    });
  });
});
