import { describe, expect, test } from "vitest";
import { ERROR_SCREEN_COPY } from "@/app/error-screen-copy";

describe("error screen copy", () => {
  test("offers retry and home actions", () => {
    expect(ERROR_SCREEN_COPY.primaryAction).toBe("Try Again");
    expect(ERROR_SCREEN_COPY.secondaryAction).toBe("Go Home");
    expect(ERROR_SCREEN_COPY.homeHref).toBe("/");
  });
});
