import { beforeEach, describe, expect, it, vi } from "vitest";

const { spanMock, startActiveSpanMock } = vi.hoisted(() => {
  const spanMock = {
    setAttribute: vi.fn(),
    setStatus: vi.fn(),
    recordException: vi.fn(),
    end: vi.fn(),
  };
  const startActiveSpanMock = vi.fn(
    async (_name: string, fn: (span: typeof spanMock) => Promise<unknown>) => fn(spanMock),
  );
  return { spanMock, startActiveSpanMock };
});

vi.mock("@opentelemetry/api", async () => {
  const actual = await vi.importActual<typeof import("@opentelemetry/api")>(
    "@opentelemetry/api",
  );
  return {
    ...actual,
    trace: {
      ...actual.trace,
      getTracer: () => ({ startActiveSpan: startActiveSpanMock }),
    },
  };
});

import { assertAllowedSpanAttribute, withSpan } from "@/lib/server/otel";
import { SpanStatusCode } from "@opentelemetry/api";

beforeEach(() => {
  spanMock.setAttribute.mockClear();
  spanMock.setStatus.mockClear();
  spanMock.recordException.mockClear();
  spanMock.end.mockClear();
  startActiveSpanMock.mockClear();
});

describe("assertAllowedSpanAttribute", () => {
  it("allows a known aggregate-only key", () => {
    expect(() => assertAllowedSpanAttribute("election.id")).not.toThrow();
  });

  it("rejects an unlisted key", () => {
    expect(() => assertAllowedSpanAttribute("voterCode")).toThrow(/not in the allowlist/);
  });

  it("rejects PII-shaped keys that must never be added to the allowlist", () => {
    for (const key of [
      "voterCode",
      "studentId",
      "receiptHash",
      "officerKey",
      "password",
      "candidateId",
    ]) {
      expect(() => assertAllowedSpanAttribute(key)).toThrow();
    }
  });
});

describe("withSpan", () => {
  it("sets only allowlisted attributes on the span and marks it OK", async () => {
    const result = await withSpan(
      "test.span",
      { "election.id": "e1", "ballot.total_count": 3 },
      async () => "done",
    );

    expect(result).toBe("done");
    expect(spanMock.setAttribute).toHaveBeenCalledWith("election.id", "e1");
    expect(spanMock.setAttribute).toHaveBeenCalledWith("ballot.total_count", 3);
    expect(spanMock.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK });
    expect(spanMock.end).toHaveBeenCalledTimes(1);
  });

  it("throws before running fn when an attribute is not allowlisted", async () => {
    const fn = vi.fn();

    await expect(
      withSpan("test.span", { voterCode: "2611A001" }, fn),
    ).rejects.toThrow(/not in the allowlist/);

    expect(fn).not.toHaveBeenCalled();
  });

  it("allowlist-checks attributes set mid-flight via the guarded span, not just the up-front ones", async () => {
    await expect(
      withSpan("test.span", {}, async (span) => {
        span.setAttribute("voterCode", "2611A001");
        return "unreachable";
      }),
    ).rejects.toThrow(/not in the allowlist/);
  });

  it("lets fn set additional allowlisted attributes mid-flight through the guarded span", async () => {
    const result = await withSpan("test.span", { "election.id": "e1" }, async (span) => {
      span.setAttribute("turnout.voted", 5);
      return "ok";
    });

    expect(result).toBe("ok");
    expect(spanMock.setAttribute).toHaveBeenCalledWith("election.id", "e1");
    expect(spanMock.setAttribute).toHaveBeenCalledWith("turnout.voted", 5);
  });

  it("records the exception, marks the span ERROR, and rethrows on failure", async () => {
    const boom = new Error("boom");

    await expect(
      withSpan("test.span", {}, async () => {
        throw boom;
      }),
    ).rejects.toThrow(boom);

    expect(spanMock.recordException).toHaveBeenCalledWith(boom);
    expect(spanMock.setStatus).toHaveBeenCalledWith({
      code: SpanStatusCode.ERROR,
      message: "boom",
    });
    expect(spanMock.end).toHaveBeenCalledTimes(1);
  });
});
