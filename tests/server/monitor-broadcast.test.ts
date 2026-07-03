import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ResultsPayload } from "@/app/(admin)/admin/elections/[id]/monitor/_components/monitor-shared";

// Controllable compute: each invocation parks on a fresh deferred we release
// from the test, letting us drive the coalescing state machine deterministically.
const computeGates: Array<() => void> = [];
const computeMock = vi.fn(async (): Promise<ResultsPayload> => {
  await new Promise<void>((resolve) => computeGates.push(resolve));
  return { electionId: "e", status: "OPEN", positions: [], turnout: null } as ResultsPayload;
});
const monitorMocks = vi.hoisted(() => ({
  recordMock: vi.fn(async () => {}),
  publishMock: vi.fn(() => {}),
}));

vi.mock("@/lib/server/results-aggregate", () => ({
  computeAdminMonitorPayload: () => computeMock(),
}));
vi.mock("@/lib/server/monitor-snapshots", () => ({
  recordSnapshot: monitorMocks.recordMock,
}));
vi.mock("@/lib/server/monitor-hub", () => ({
  publish: monitorMocks.publishMock,
}));

import { scheduleMonitorRefresh } from "@/lib/server/monitor-broadcast";

/** Flush pending microtasks + timers so awaited continuations run. */
const flush = () => new Promise((r) => setTimeout(r, 0));

let seq = 0;
const freshId = () => `bc-test-${seq++}`;

beforeEach(() => {
  computeGates.length = 0;
  computeMock.mockClear();
  monitorMocks.recordMock.mockClear();
  monitorMocks.publishMock.mockClear();
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
    expect(monitorMocks.publishMock).toHaveBeenCalledTimes(1);

    computeGates[1](); // finish compute #2 → no pending left
    await done;
    expect(computeMock).toHaveBeenCalledTimes(2);
    expect(monitorMocks.publishMock).toHaveBeenCalledTimes(2);
    // Persist-then-broadcast ordering, once per completed compute.
    expect(monitorMocks.recordMock).toHaveBeenCalledTimes(2);
  });

  it("persists a snapshot before broadcasting each frame", async () => {
    const id = freshId();
    const order: string[] = [];
    monitorMocks.recordMock.mockImplementationOnce(async () => {
      order.push("record");
    });
    monitorMocks.publishMock.mockImplementationOnce(() => {
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
    expect(monitorMocks.publishMock).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("monitor-broadcast: refresh failed"),
      expect.any(Error),
    );
    spy.mockRestore();
  });

  it("keeps publishing when snapshot persistence fails", async () => {
    const id = freshId();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    monitorMocks.recordMock.mockRejectedValueOnce(new Error("snapshot write failed"));

    const done = scheduleMonitorRefresh(id);
    await flush();
    computeGates[0]();
    await expect(done).resolves.toBeUndefined();

    expect(monitorMocks.recordMock).toHaveBeenCalledTimes(1);
    expect(monitorMocks.publishMock).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("monitor-broadcast: snapshot failed"),
      expect.any(Error),
    );
    spy.mockRestore();
  });
});
