export type ElectionStatus = "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED";

export type Election = {
  id: string;
  name: string;
  division: string;
  status: ElectionStatus;
  createdAt: Date;
  scheduledOpen: Date | null;
  scheduledClose: Date | null;
  archivedAt: Date | null;
  archivedBy: string | null;
  _count: { voters: number; votes: number; positions: number; candidates: number };
  votedCount: number;
};

export { DIVISION_LABELS } from "@/lib/ui/division-labels";

export const STATUS_LABELS: Record<ElectionStatus, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  OPEN: "Open",
  CLOSED: "Closed",
};

export function pct(voted: number, total: number): number {
  return total > 0 ? Math.round((voted / total) * 100) : 0;
}

export function fmt(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
