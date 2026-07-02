export type AdminStatus = "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED";

export const ADMIN_STATUS_LABELS: Record<AdminStatus, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  OPEN: "Open",
  CLOSED: "Closed",
};
