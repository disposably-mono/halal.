import { describe, expect, test } from "vitest";
import type { ResultsPayload, Snapshot } from "@/app/(admin)/admin/elections/[id]/monitor/_components/monitor-shared";
import {
  appendLiveSnapshot,
  hydratePersistedSnapshots,
  toPollingErrorMessage,
} from "@/app/(admin)/admin/elections/[id]/monitor/_components/monitor-polling";

const payload = (suffix: string, votes: number): ResultsPayload => ({
  electionId: `election-${suffix}`,
  status: "OPEN",
  turnout: { total: 10, voted: votes, pct: votes * 10 },
  positions: [],
});

describe("monitor polling helpers", () => {
  test("hydrates persisted snapshots without mutating server payloads", () => {
    const serverRows = [
      { timestamp: "2026-07-02T01:00:00.000Z", payload: payload("a", 1) },
      { timestamp: "2026-07-02T01:00:30.000Z", payload: payload("b", 2) },
    ];

    const hydrated = hydratePersistedSnapshots(serverRows);

    expect(hydrated).toHaveLength(2);
    expect(hydrated[0]).toEqual({
      timestamp: new Date("2026-07-02T01:00:00.000Z"),
      label: expect.any(String),
      payload: payload("a", 1),
    });
    expect(hydrated[0]?.timestamp).not.toBe(serverRows[0]?.timestamp);
  });

  test("appends a live snapshot and trims to the configured max", () => {
    const existing: Snapshot[] = [
      { timestamp: new Date("2026-07-02T01:00:00.000Z"), label: "first", payload: payload("a", 1) },
      { timestamp: new Date("2026-07-02T01:00:30.000Z"), label: "second", payload: payload("b", 2) },
    ];
    const now = new Date("2026-07-02T01:01:00.000Z");

    const next = appendLiveSnapshot(existing, payload("c", 3), now, 2);

    expect(next).toHaveLength(2);
    expect(next[0]?.payload.electionId).toBe("election-b");
    expect(next[1]).toEqual({
      timestamp: now,
      label: expect.any(String),
      payload: payload("c", 3),
    });
    expect(existing).toHaveLength(2);
    expect(next).not.toBe(existing);
  });

  test("maps failed poll outcomes to a user-safe retry message", () => {
    expect(toPollingErrorMessage(403)).toBe("Live results are not available for this account.");
    expect(toPollingErrorMessage(500)).toBe("Live monitor connection failed. Retrying shortly.");
  });
});
