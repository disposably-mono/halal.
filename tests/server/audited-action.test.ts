import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const transactionMock = vi.fn(async (cb: (tx: unknown) => Promise<void>) => cb({}));
const requireCapabilityOrErrorMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (...args: Parameters<typeof transactionMock>) => transactionMock(...args),
  },
}));

vi.mock("@/lib/server/auth", () => ({
  requireCapabilityOrError: (...args: unknown[]) => requireCapabilityOrErrorMock(...args),
}));

import {
  auditedAction,
  TransitionValidationError,
} from "@/lib/server/audited-action";

const SESSION = { user: { email: "admin@example.com", role: "COMMISSIONER" } };

beforeEach(() => {
  transactionMock.mockClear();
  requireCapabilityOrErrorMock.mockReset();
  requireCapabilityOrErrorMock.mockResolvedValue({ ok: true, session: SESSION });
});

describe("auditedAction", () => {
  it("denies the call before opening a transaction when the capability guard fails", async () => {
    requireCapabilityOrErrorMock.mockResolvedValue({ ok: false, error: "Forbidden" });
    const run = vi.fn();
    const action = auditedAction({
      name: "testAction",
      capability: "election:lifecycle",
      errorMessage: "Failed",
      run,
    });

    const result = await action();

    expect(result.success).toBe(false);
    expect(transactionMock).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });

  it("runs the callback inside the transaction and reports success", async () => {
    const run = vi.fn(async () => {});
    const action = auditedAction<[id: string]>({
      name: "testAction",
      capability: "election:lifecycle",
      errorMessage: "Failed",
      run,
    });

    const result = await action("e1");

    expect(result).toEqual({ success: true });
    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith({}, SESSION, "e1");
  });

  it("passes through a TransitionValidationError message verbatim", async () => {
    const action = auditedAction<[id: string]>({
      name: "testAction",
      capability: "election:lifecycle",
      errorMessage: "Failed",
      run: async () => {
        throw new TransitionValidationError("Election not found");
      },
    });

    const result = await action("e1");

    expect(result).toEqual({ success: false, error: "Election not found" });
  });

  it("falls back to the generic error message for an unrecognized error", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const action = auditedAction<[id: string]>({
      name: "testAction",
      capability: "election:lifecycle",
      errorMessage: "Failed to do the thing",
      run: async () => {
        throw new Error("boom");
      },
    });

    const result = await action("e1");

    expect(result).toEqual({ success: false, error: "Failed to do the thing" });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[testAction] transition failed:",
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });

  it("uses mapError to translate a recognized error before falling back to the generic message", async () => {
    class SpecialError extends Error {}
    const action = auditedAction<[id: string]>({
      name: "testAction",
      capability: "election:lifecycle",
      errorMessage: "Failed to do the thing",
      mapError: (error) =>
        error instanceof SpecialError ? "That key is already assigned to another account." : null,
      run: async () => {
        throw new SpecialError("dup");
      },
    });

    const result = await action("e1");

    expect(result).toEqual({
      success: false,
      error: "That key is already assigned to another account.",
    });
  });

  it("forwards the isolation level to the transaction call", async () => {
    const action = auditedAction<[id: string]>({
      name: "testAction",
      capability: "election:lifecycle",
      errorMessage: "Failed",
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      run: async () => {},
    });

    await action("e1");

    expect(transactionMock).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  });
});
