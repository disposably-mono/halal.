import { describe, expect, test } from "vitest";
import nextConfig from "../next.config.mjs";

describe("next.config allowedDevOrigins", () => {
  test("allows local loopback origins used during development", () => {
    expect(nextConfig.allowedDevOrigins).toEqual(
      expect.arrayContaining(["127.0.0.1", "localhost"]),
    );
  });
});
