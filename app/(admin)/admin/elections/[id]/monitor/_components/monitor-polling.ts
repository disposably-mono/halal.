import type { ResultsPayload, Snapshot } from "./monitor-shared";

export type PersistedSnapshotRow = {
  capturedAt?: string;
  timestamp?: string;
  payload: ResultsPayload;
};

export function formatSnapshotLabel(timestamp: Date): string {
  return timestamp.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function hydratePersistedSnapshots(rows: readonly PersistedSnapshotRow[]): Snapshot[] {
  return rows.map((row) => {
    const timestamp = new Date(row.capturedAt ?? row.timestamp ?? Date.now());
    return {
      timestamp,
      label: formatSnapshotLabel(timestamp),
      payload: row.payload,
    };
  });
}

export function appendLiveSnapshot(
  current: readonly Snapshot[],
  payload: ResultsPayload,
  timestamp: Date,
  maxSnapshots: number,
): Snapshot[] {
  const next = [
    ...current,
    {
      timestamp,
      label: formatSnapshotLabel(timestamp),
      payload,
    },
  ];

  return next.length > maxSnapshots
    ? next.slice(next.length - maxSnapshots)
    : next;
}

export function toPollingErrorMessage(status?: number): string {
  if (status === 401 || status === 403) {
    return "Live results are not available for this account.";
  }
  if (status === 404) return "Election results could not be found.";
  return "Live monitor connection failed. Retrying shortly.";
}
