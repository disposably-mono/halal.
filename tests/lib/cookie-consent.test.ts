import { afterEach, describe, expect, it, vi } from "vitest";
import { acknowledge, hasAcknowledged } from "@/lib/cookie-consent";

function makeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => store.clear(),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cookie-consent", () => {
  it("returns false when nothing is stored", () => {
    vi.stubGlobal("window", { localStorage: makeStorage() });
    expect(hasAcknowledged()).toBe(false);
  });

  it("returns true after acknowledge()", () => {
    vi.stubGlobal("window", { localStorage: makeStorage() });
    acknowledge();
    expect(hasAcknowledged()).toBe(true);
  });

  it("does not throw and returns false when window is undefined (SSR)", () => {
    expect(hasAcknowledged()).toBe(false);
    expect(() => acknowledge()).not.toThrow();
  });

  it("does not throw when localStorage access throws", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new Error("blocked");
        },
        setItem: () => {
          throw new Error("blocked");
        },
      },
    });
    expect(hasAcknowledged()).toBe(false);
    expect(() => acknowledge()).not.toThrow();
  });
});
