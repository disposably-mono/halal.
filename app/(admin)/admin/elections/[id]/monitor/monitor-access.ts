import type { ElectionStatus } from "@prisma/client";

// Canonical status union: Prisma's ElectionStatus enum already has exactly
// these 4 values, so alias it instead of redeclaring the union.
export type MonitorAccessStatus = ElectionStatus;

export function canAccessMonitor(status: MonitorAccessStatus) {
  return status === "OPEN" || status === "CLOSED";
}

export function getMonitorFallbackHref(electionId: string) {
  return `/admin/elections/${electionId}/control`;
}
