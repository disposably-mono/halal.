"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CLIENT_REQUEST_TIMEOUT_MS,
  CLIENT_REQUEST_TIMEOUT_MESSAGE,
  createTimeoutController,
} from "@/lib/client/request-timeout";
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

const STREAM_RETRY_LIMIT = 5;
const STREAM_RETRY_BASE_MS = 1_000;
const STREAM_RETRY_MAX_MS = 8_000;
const STREAM_TERMINAL_ERROR = "Live updates unavailable. Refresh the page.";

function getRetryDelay(retryCount: number): number {
  return Math.min(STREAM_RETRY_BASE_MS * 2 ** retryCount, STREAM_RETRY_MAX_MS);
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
  const sessionIdRef = useRef(0);

  const applyFrame = useCallback((json: ResultsPayload, sessionId: number) => {
    if (!isMountedRef.current || sessionId !== sessionIdRef.current) return;
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
    const sessionId = sessionIdRef.current;
    const { controller, clearTimeout } = createTimeoutController(CLIENT_REQUEST_TIMEOUT_MS);
    setIsFetching(true);
    try {
      const res = await fetch(`/api/results/${electionId}?admin=1`, {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!isMountedRef.current || sessionId !== sessionIdRef.current) return;
      if (!res.ok) {
        setError(toPollingErrorMessage(res.status));
        return;
      }
      applyFrame((await res.json()) as ResultsPayload, sessionId);
    } catch {
      if (isMountedRef.current && sessionId === sessionIdRef.current) {
        setError(controller.signal.aborted ? CLIENT_REQUEST_TIMEOUT_MESSAGE : toPollingErrorMessage());
      }
    } finally {
      clearTimeout();
      if (isMountedRef.current && sessionId === sessionIdRef.current) setIsFetching(false);
    }
  }, [electionId, applyFrame]);

  useEffect(() => {
    isMountedRef.current = true;
    const sessionId = ++sessionIdRef.current;

    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;

    const clearReconnectTimer = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const closeSource = () => {
      source?.close();
      source = null;
    };

    const stopWithTerminalError = () => {
      if (!isMountedRef.current || sessionId !== sessionIdRef.current) return;
      clearReconnectTimer();
      closeSource();
      setError(STREAM_TERMINAL_ERROR);
      setIsFetching(false);
      setLoading(false);
    };

    const connect = () => {
      if (!isMountedRef.current || sessionId !== sessionIdRef.current) return;
      closeSource();
      const nextSource = new EventSource(`/api/elections/${electionId}/monitor/stream`);
      source = nextSource;

      nextSource.onopen = () => {
        if (!isMountedRef.current || sessionId !== sessionIdRef.current) return;
        retryCount = 0;
        clearReconnectTimer();
        setIsFetching(false);
        setError(null);
      };

      nextSource.onmessage = (event) => {
        try {
          applyFrame(JSON.parse(event.data) as ResultsPayload, sessionId);
        } catch {
          // Ignore malformed frames; the next one supersedes it.
        }
      };

      nextSource.onerror = () => {
        if (!isMountedRef.current || sessionId !== sessionIdRef.current) return;
        closeSource();
        if (retryCount >= STREAM_RETRY_LIMIT) {
          stopWithTerminalError();
          return;
        }

        const delay = getRetryDelay(retryCount);
        retryCount += 1;
        setIsFetching(true);
        setError((prev) => prev ?? toPollingErrorMessage());
        clearReconnectTimer();
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    // Seed the replay timeline from server-owned history once.
    void (async () => {
      const { controller, clearTimeout } = createTimeoutController(CLIENT_REQUEST_TIMEOUT_MS);
      try {
        const res = await fetch(`/api/elections/${electionId}/monitor-snapshots`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok || !isMountedRef.current || sessionId !== sessionIdRef.current) return;
        const json: { snapshots?: PersistedSnapshotRow[] } = await res.json();
        const hydrated = hydratePersistedSnapshots(json.snapshots ?? []);
        setSnapshots(hydrated);
        const last = hydrated[hydrated.length - 1];
        if (last) lastSignatureRef.current = frameSignature(last.payload);
      } catch {
        // Persisted replay is additive; a failed seed must not block live data.
      } finally {
        clearTimeout();
      }
    })();

    connect();

    return () => {
      isMountedRef.current = false;
      clearReconnectTimer();
      source?.close();
    };
  }, [electionId, applyFrame]);

  return { liveData, snapshots, loading, isFetching, error, lastUpdated, refresh };
}
