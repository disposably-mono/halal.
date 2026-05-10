export type ElectionStatus = "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED";

export type Election = {
  id: string;
  name: string;
  division: string;
  status: ElectionStatus;
  scheduledOpen: Date | null;
  scheduledClose: Date | null;
  _count: { voters: number; votes: number; positions: number; candidates: number };
  votedCount: number;
};

export const DIVISION_LABELS: Record<string, string> = {
  GS: "Grade School",
  JHS: "Junior High School",
  SHS: "Senior High School",
  HC: "House Council",
};

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
