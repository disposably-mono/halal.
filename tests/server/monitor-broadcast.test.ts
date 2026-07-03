import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ResultsPayload } from "@/app/(admin)/admin/elections/[id]/monitor/_components/monitor-shared";

// Controllable compute: each invocation parks on a fresh deferred we release
// from the test, letting us drive the coalescing state machine deterministically.
const computeGates: Array<() => void> = [];
const computeMock = vi.fn(async (): Promise<ResultsPayload> => {
  await new Promise<void>((resolve) => computeGates.push(resolve));
  return { electionId: "e", status: "OPEN", positions: [], turnout: null } as ResultsPayload;
});
const recordMock = vi.fn(async (..._args: unknown[]) => {});
const publishMock = vi.fn((..._args: unknown[]) => {});

vi.mock("@/lib/server/results-aggregate", () => ({
  computeAdminMonitorPayload: () => computeMock(),
}));
vi.mock("@/lib/server/monitor-snapshots", () => ({
  recordSnapshot: (...args: unknown[]) => recordMock(...args),
}));
vi.mock("@/lib/server/monitor-hub", () => ({
  publish: (...args: unknown[]) => publishMock(...args),
}));

import { scheduleMonitorRefresh } from "@/lib/server/monitor-broadcast";

/** Flush pending microtasks + timers so awaited continuations run. */
const flush = () => new Promise((r) => setTimeout(r, 0));

let seq = 0;
const freshId = () => `bc-test-${seq++}`;

beforeEach(() => {
  computeGates.length = 0;
  computeMock.mockClear();
  recordMock.mockClear();
  publishMock.mockClear();
});

afterEach(() => {
  // Release any parked computes so a failed assertion can't hang the run.
  computeGates.forEach((release) => release());
  computeGates.length = 0;
});

describe("scheduleMonitorRefresh coalescing", () => {
  it("collapses a burst of triggers into a single trailing recompute", async () => {
    const id = freshId();

    const done = scheduleMonitorRefresh(id); // starts compute #1
    await flush();
    expect(computeMock).toHaveBeenCalledTimes(1);

    // Three more triggers while compute #1 is still in flight — all fold into
    // one pending recompute rather than starting three scans.
    void scheduleMonitorRefresh(id);
    void scheduleMonitorRefresh(id);
    void scheduleMonitorRefresh(id);
    await flush();
    expect(computeMock).toHaveBeenCalledTimes(1);

    computeGates[0](); // finish compute #1 → publishes, then trailing recompute
    await flush();
    expect(computeMock).toHaveBeenCalledTimes(2);
    expect(publishMock).toHaveBeenCalledTimes(1);

    computeGates[1](); // finish compute #2 → no pending left
    await done;
    expect(computeMock).toHaveBeenCalledTimes(2);
    expect(publishMock).toHaveBeenCalledTimes(2);
    // Persist-then-broadcast ordering, once per completed compute.
    expect(recordMock).toHaveBeenCalledTimes(2);
  });

  it("persists a snapshot before broadcasting each frame", async () => {
    const id = freshId();
    const order: string[] = [];
    recordMock.mockImplementationOnce(async () => {
      order.push("record");
    });
    publishMock.mockImplementationOnce(() => {
      order.push("publish");
    });

    const done = scheduleMonitorRefresh(id);
    await flush();
    computeGates[0]();
    await done;

    expect(order).toEqual(["record", "publish"]);
  });

  it("never rejects even when the compute throws", async () => {
    const id = freshId();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    computeMock.mockImplementationOnce(async () => {
      throw new Error("db down");
    });

    await expect(scheduleMonitorRefresh(id)).resolves.toBeUndefined();
    expect(publishMock).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
