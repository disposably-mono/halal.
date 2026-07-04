import { describe, expect, test } from "vitest";
import { DEFAULT_SEARCH_DEBOUNCE_MS } from "@/components/admin/search-input";

describe("admin search input", () => {
  test("waits around 0.8 seconds after typing stops before applying search", () => {
    expect(DEFAULT_SEARCH_DEBOUNCE_MS).toBe(800);
  });
});
