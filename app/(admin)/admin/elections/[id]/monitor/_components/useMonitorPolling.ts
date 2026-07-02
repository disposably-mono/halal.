"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_SNAPSHOTS, POLL_INTERVAL, type ResultsPayload, type Snapshot } from "./monitor-shared";
import {
  appendLiveSnapshot,
  hydratePersistedSnapshots,
  toPollingErrorMessage,
  type PersistedSnapshotRow,
} from "./monitor-polling";

interface PollingState {
  liveData: ResultsPayload | null;
  snapshots: Snapshot[];
  loading: boolean;
  isFetching: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

export function useMonitorPolling(electionId: string): PollingState {
  const [liveData, setLiveData] = useState<ResultsPayload | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPollTimer = useCallback(() => {
    if (!timerRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const fetchPersistedSnapshots = useCallback(async () => {
    try {
      const res = await fetch(`/api/elections/${electionId}/monitor-snapshots`, { cache: "no-store" });
      if (!res.ok) return;
      const json: { snapshots?: PersistedSnapshotRow[] } = await res.json();
      setSnapshots(hydratePersistedSnapshots(json.snapshots ?? []));
    } catch {
      // Persisted replay is additive. A failed seed should not block live data.
    }
  }, [electionId]);

  const fetchData = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await fetch(`/api/results/${electionId}?admin=1`, { cache: "no-store" });
      if (!res.ok) {
        setError(toPollingErrorMessage(res.status));
        return;
      }

      const json: ResultsPayload = await res.json();
      const now = new Date();
      setLiveData(json);
      setError(null);
      setLastUpdated(now);
      setSnapshots((prev) => appendLiveSnapshot(prev, json, now, MAX_SNAPSHOTS));
    } catch {
      setError(toPollingErrorMessage());
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [electionId]);

  const scheduleNextPoll = useCallback(() => {
    clearPollTimer();
    timerRef.current = setTimeout(() => {
      void fetchData().finally(scheduleNextPoll);
    }, POLL_INTERVAL);
  }, [clearPollTimer, fetchData]);

  const refresh = useCallback(() => {
    clearPollTimer();
    void fetchData().finally(scheduleNextPoll);
  }, [clearPollTimer, fetchData, scheduleNextPoll]);

  useEffect(() => {
    void fetchPersistedSnapshots();
    refresh();
    return clearPollTimer;
  }, [clearPollTimer, fetchPersistedSnapshots, refresh]);

  return { liveData, snapshots, loading, isFetching, error, lastUpdated, refresh };
}
