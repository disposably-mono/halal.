import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CLIENT_REQUEST_TIMEOUT_MESSAGE,
  createTimeoutController,
  withTimeout,
} from "@/lib/client/request-timeout";

describe("request-timeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("resolves before the timeout elapses", async () => {
    await expect(withTimeout(Promise.resolve("ok"), CLIENT_REQUEST_TIMEOUT_MESSAGE, 1_000)).resolves.toBe("ok");
  });

  it("rejects with the timeout message when the promise hangs", async () => {
    const pending = new Promise<string>(() => {});
    const result = withTimeout(pending, "Timed out.", 1_000);
    const assertion = expect(result).rejects.toThrow("Timed out.");

    await vi.advanceTimersByTimeAsync(1_000);

    await assertion;
  });

  it("aborts a timeout controller and clears the pending timer", async () => {
    const { controller, clearTimeout } = createTimeoutController(1_000);

    clearTimeout();
    await vi.advanceTimersByTimeAsync(1_000);

    expect(controller.signal.aborted).toBe(false);
  });
});
