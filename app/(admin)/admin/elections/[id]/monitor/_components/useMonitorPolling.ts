"use client";

import { useCallback, useEffect, useState } from "react";
import { MAX_SNAPSHOTS, POLL_INTERVAL, type ResultsPayload, type Snapshot } from "./monitor-shared";

interface PollingState {
  liveData: ResultsPayload | null;
  snapshots: Snapshot[];
  loading: boolean;
  lastUpdated: Date | null;
}

export function useMonitorPolling(electionId: string): PollingState {
  const [liveData, setLiveData] = useState<ResultsPayload | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/results/${electionId}?admin=1`, { cache: "no-store" });
      if (res.ok) {
        const json: ResultsPayload = await res.json();
        setLiveData(json);
        const now = new Date();
        setLastUpdated(now);
        setSnapshots((prev) => {
          const label = now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
          const next: Snapshot[] = [...prev, { timestamp: now, label, payload: json }];
          return next.length > MAX_SNAPSHOTS ? next.slice(next.length - MAX_SNAPSHOTS) : next;
        });
      }
    } catch {
      // Retain last data on network error
    } finally {
      setLoading(false);
    }
  }, [electionId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { liveData, snapshots, loading, lastUpdated };
}
