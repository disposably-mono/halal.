import type { ResultsPayload } from "@/app/(admin)/admin/elections/[id]/monitor/_components/monitor-shared";

export type PersistedMonitorSnapshot = {
  capturedAt: string;
  payload: ResultsPayload;
};

export type SnapshotResponse = {
  snapshots: PersistedMonitorSnapshot[];
};

export type TurnoutTrendPoint = {
  label: string;
  pct: number;
  voted: number;
  total: number;
};
