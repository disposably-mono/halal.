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
import { calcTurnoutPercent } from "@/lib/domain/tally";

export const STATUS_LABELS: Record<ElectionStatus, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  OPEN: "Open",
  CLOSED: "Closed",
};

/** Thin re-export: shared formula now lives in lib/domain/tally.ts. */
export function pct(voted: number, total: number): number {
  return calcTurnoutPercent(voted, total);
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
