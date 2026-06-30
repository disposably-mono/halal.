import { describe, expect, it } from "vitest";
import { isTestEndpointEnabled } from "@/lib/server/test-endpoints";

describe("isTestEndpointEnabled", () => {
  it("enables guarded test endpoints only outside production with the explicit flag", () => {
    expect(
      isTestEndpointEnabled({
        ENABLE_TEST_ENDPOINTS: "1",
        NODE_ENV: "development",
      }),
    ).toBe(true);
  });

  it("keeps test endpoints disabled in production even when the flag is set", () => {
    expect(
      isTestEndpointEnabled({
        ENABLE_TEST_ENDPOINTS: "1",
        NODE_ENV: "production",
      }),
    ).toBe(false);
  });

  it("keeps test endpoints disabled without the explicit flag", () => {
    expect(
      isTestEndpointEnabled({
        NODE_ENV: "development",
      }),
    ).toBe(false);
  });
});
