import { describe, expect, it, vi } from "vitest";
import {
  subscribe,
  publish,
  getLatest,
  subscriberCount,
} from "@/lib/server/monitor-hub";
import type { ResultsPayload } from "@/app/(admin)/admin/elections/[id]/monitor/_components/monitor-shared";

// The hub is a process-global singleton; use a fresh electionId per test so
// state from one case can never bleed into another.
let seq = 0;
const freshId = () => `hub-test-${seq++}`;

function frame(voted: number): ResultsPayload {
  return {
    electionId: "x",
    status: "OPEN",
    positions: [],
    turnout: { voted, total: 100, pct: voted },
  } as ResultsPayload;
}

describe("monitor-hub", () => {
  it("delivers published frames to a subscriber and caches the latest", () => {
    const id = freshId();
    const received: ResultsPayload[] = [];
    const unsubscribe = subscribe(id, (p) => received.push(p));

    publish(id, frame(1));
    publish(id, frame(2));

    expect(received.map((f) => f.turnout!.voted)).toEqual([1, 2]);
    expect(getLatest(id)?.turnout?.voted).toBe(2);
    unsubscribe();
  });

  it("fans a single publish out to every subscriber (compute once, broadcast to N)", () => {
    const id = freshId();
    const a = vi.fn();
    const b = vi.fn();
    const unsubA = subscribe(id, a);
    const unsubB = subscribe(id, b);

    expect(subscriberCount(id)).toBe(2);
    const f = frame(5);
    publish(id, f);

    expect(a).toHaveBeenCalledExactlyOnceWith(f);
    expect(b).toHaveBeenCalledExactlyOnceWith(f);
    unsubA();
    unsubB();
  });

  it("stops delivery after unsubscribe and cleans up the empty election entry", () => {
    const id = freshId();
    const cb = vi.fn();
    const unsubscribe = subscribe(id, cb);
    unsubscribe();

    expect(subscriberCount(id)).toBe(0);
    publish(id, frame(1));
    expect(cb).not.toHaveBeenCalled();
  });

  it("isolates a throwing subscriber so siblings still receive the frame", () => {
    const id = freshId();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const good = vi.fn();
    const unsubBad = subscribe(id, () => {
      throw new Error("boom");
    });
    const unsubGood = subscribe(id, good);

    expect(() => publish(id, frame(9))).not.toThrow();
    expect(good).toHaveBeenCalledTimes(1);

    spy.mockRestore();
    unsubBad();
    unsubGood();
  });

  it("late subscribers do not receive frames published before they joined", () => {
    const id = freshId();
    publish(id, frame(3)); // no subscribers yet — only caches latest
    const cb = vi.fn();
    const unsubscribe = subscribe(id, cb);

    expect(cb).not.toHaveBeenCalled();
    expect(getLatest(id)?.turnout?.voted).toBe(3); // but latest is available for replay
    unsubscribe();
  });
});
