import { describe, expect, test } from "vitest";
import { DEFAULT_SEARCH_DEBOUNCE_MS } from "@/components/admin/search-input";

describe("admin search input", () => {
  test("waits around two seconds after typing stops before applying search", () => {
    expect(DEFAULT_SEARCH_DEBOUNCE_MS).toBe(2_000);
  });
});
