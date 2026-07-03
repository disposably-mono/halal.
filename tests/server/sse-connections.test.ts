import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetSseConnections,
  activeConnections,
  MAX_SSE_CONNECTIONS,
  release,
  tryAcquire,
} from "@/lib/server/sse-connections";

beforeEach(() => {
  __resetSseConnections();
});

describe("sse-connections", () => {
  it("acquires slots up to the cap, then refuses further acquires", () => {
    for (let i = 0; i < MAX_SSE_CONNECTIONS; i++) {
      expect(tryAcquire()).toBe(true);
    }
    expect(activeConnections()).toBe(MAX_SSE_CONNECTIONS);

    expect(tryAcquire()).toBe(false);
    expect(activeConnections()).toBe(MAX_SSE_CONNECTIONS);
  });

  it("releasing a slot frees capacity for a new acquire", () => {
    for (let i = 0; i < MAX_SSE_CONNECTIONS; i++) {
      tryAcquire();
    }
    expect(tryAcquire()).toBe(false);

    release();
    expect(activeConnections()).toBe(MAX_SSE_CONNECTIONS - 1);
    expect(tryAcquire()).toBe(true);
    expect(activeConnections()).toBe(MAX_SSE_CONNECTIONS);
  });

  it("never goes negative when released more times than acquired", () => {
    expect(activeConnections()).toBe(0);
    release();
    release();
    expect(activeConnections()).toBe(0);

    // Capacity is still fully available afterward.
    expect(tryAcquire()).toBe(true);
    expect(activeConnections()).toBe(1);
  });

  it("resets the counter for test isolation", () => {
    tryAcquire();
    tryAcquire();
    expect(activeConnections()).toBe(2);

    __resetSseConnections();
    expect(activeConnections()).toBe(0);
  });
});
