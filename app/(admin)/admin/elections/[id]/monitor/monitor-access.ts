export type MonitorAccessStatus = "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED";

export function canAccessMonitor(status: MonitorAccessStatus) {
  return status === "OPEN" || status === "CLOSED";
}

export function getMonitorFallbackHref(electionId: string) {
  return `/admin/elections/${electionId}/control`;
}
