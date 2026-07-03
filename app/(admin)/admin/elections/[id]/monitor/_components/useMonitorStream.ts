"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_SNAPSHOTS, type ResultsPayload, type Snapshot } from "./monitor-shared";
import {
  appendLiveSnapshot,
  hydratePersistedSnapshots,
  toPollingErrorMessage,
  type PersistedSnapshotRow,
} from "./monitor-polling";

interface StreamState {
  liveData: ResultsPayload | null;
  snapshots: Snapshot[];
  loading: boolean;
  isFetching: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

/** Cheap change signature so reconnect/identical frames don't spam the replay timeline. */
function frameSignature(payload: ResultsPayload): string {
  return JSON.stringify({ t: payload.turnout, p: payload.positions });
}

/**
 * Live monitor via Server-Sent Events. The client loads persisted replay
 * history once, opens a single stream, and receives a frame whenever the server
 * recomputes the tally on an election-state change. No polling: an idle election
 * produces no traffic and no database work, and the tally is computed once on
 * the server and fanned out to every connected admin rather than per browser.
 *
 * Returns the same surface the old polling hook did so `MonitorClient` and the
 * replay controller are unchanged.
 */
export function useMonitorStream(electionId: string): StreamState {
  const [liveData, setLiveData] = useState<ResultsPayload | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const isMountedRef = useRef(true);
  const lastSignatureRef = useRef<string | null>(null);

  const applyFrame = useCallback((json: ResultsPayload) => {
    if (!isMountedRef.current) return;
    const now = new Date();
    setLiveData(json);
    setError(null);
    setLoading(false);
    setIsFetching(false);
    setLastUpdated(now);

    // Only extend the replay timeline when the tally actually changed, so a
    // reconnect (which re-sends the current frame) doesn't create a duplicate
    // replay step.
    const signature = frameSignature(json);
    if (signature !== lastSignatureRef.current) {
      lastSignatureRef.current = signature;
      setSnapshots((prev) => appendLiveSnapshot(prev, json, now, MAX_SNAPSHOTS));
    }
  }, []);

  // One-shot manual refresh: re-read the (now read-only) results endpoint to
  // force an immediate frame without waiting for the next vote. Backs the
  // "Refresh" button.
  const refresh = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await fetch(`/api/results/${electionId}?admin=1`, { cache: "no-store" });
      if (!isMountedRef.current) return;
      if (!res.ok) {
        setError(toPollingErrorMessage(res.status));
        return;
      }
      applyFrame((await res.json()) as ResultsPayload);
    } catch {
      if (isMountedRef.current) setError(toPollingErrorMessage());
    } finally {
      if (isMountedRef.current) setIsFetching(false);
    }
  }, [electionId, applyFrame]);

  useEffect(() => {
    isMountedRef.current = true;

    // Seed the replay timeline from server-owned history once.
    void (async () => {
      try {
        const res = await fetch(`/api/elections/${electionId}/monitor-snapshots`, {
          cache: "no-store",
        });
        if (!res.ok || !isMountedRef.current) return;
        const json: { snapshots?: PersistedSnapshotRow[] } = await res.json();
        const hydrated = hydratePersistedSnapshots(json.snapshots ?? []);
        setSnapshots(hydrated);
        const last = hydrated[hydrated.length - 1];
        if (last) lastSignatureRef.current = frameSignature(last.payload);
      } catch {
        // Persisted replay is additive; a failed seed must not block live data.
      }
    })();

    const source = new EventSource(`/api/elections/${electionId}/monitor/stream`);

    source.onopen = () => {
      if (isMountedRef.current) setIsFetching(false);
    };
    source.onmessage = (event) => {
      try {
        applyFrame(JSON.parse(event.data) as ResultsPayload);
      } catch {
        // Ignore malformed frames; the next one supersedes it.
      }
    };
    source.onerror = () => {
      // EventSource reconnects automatically; surface a transient status.
      if (isMountedRef.current) {
        setIsFetching(true);
        setError((prev) => prev ?? toPollingErrorMessage());
      }
    };

    return () => {
      isMountedRef.current = false;
      source.close();
    };
  }, [electionId, applyFrame]);

  return { liveData, snapshots, loading, isFetching, error, lastUpdated, refresh };
}
