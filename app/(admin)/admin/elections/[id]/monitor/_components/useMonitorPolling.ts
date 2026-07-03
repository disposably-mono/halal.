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
  // Guards against the in-flight-fetch-outlives-unmount race: a fetch started
  // before unmount can still resolve after, and its `.finally` reschedules a
  // new timer that `clearPollTimer` never sees. Every setState and reschedule
  // below checks this ref first so no timer survives unmount.
  const isMountedRef = useRef(true);

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
      if (!isMountedRef.current) return;
      if (!res.ok) {
        setError(toPollingErrorMessage(res.status));
        return;
      }

      const json: ResultsPayload = await res.json();
      if (!isMountedRef.current) return;
      const now = new Date();
      setLiveData(json);
      setError(null);
      setLastUpdated(now);
      setSnapshots((prev) => appendLiveSnapshot(prev, json, now, MAX_SNAPSHOTS));
    } catch {
      if (isMountedRef.current) setError(toPollingErrorMessage());
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsFetching(false);
      }
    }
  }, [electionId]);

  const scheduleNextPoll = useCallback(() => {
    clearPollTimer();
    if (!isMountedRef.current) return;
    timerRef.current = setTimeout(() => {
      void fetchData().finally(() => {
        if (isMountedRef.current) scheduleNextPoll();
      });
    }, POLL_INTERVAL);
  }, [clearPollTimer, fetchData]);

  const refresh = useCallback(() => {
    clearPollTimer();
    void fetchData().finally(() => {
      if (isMountedRef.current) scheduleNextPoll();
    });
  }, [clearPollTimer, fetchData, scheduleNextPoll]);

  useEffect(() => {
    isMountedRef.current = true;
    void fetchPersistedSnapshots();
    refresh();
    return () => {
      isMountedRef.current = false;
      clearPollTimer();
    };
  }, [clearPollTimer, fetchPersistedSnapshots, refresh]);

  return { liveData, snapshots, loading, isFetching, error, lastUpdated, refresh };
}
