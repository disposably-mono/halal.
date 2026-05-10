export interface DivisionCard {
  division: string;
  label: string;
  sublabel: string;
  election: {
    id: string;
    name: string;
    status: string;
    scheduledOpen: string;
    scheduledClose: string;
    _count: { voters: number };
  } | null;
}

export interface CountdownTarget {
  date: string;
  electionName: string;
  status: string;
}

export const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  OPEN: {
    label: "Voting Open",
    color: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
    dot: "bg-emerald-400",
  },
  SCHEDULED: {
    label: "Scheduled",
    color: "text-gold border-gold/40 bg-gold/10",
    dot: "bg-gold",
  },
  DRAFT: {
    label: "In Setup",
    color: "text-mid border-mid/40 bg-mid/10",
    dot: "bg-mid",
  },
  CLOSED: {
    label: "Closed",
    color: "text-maroon border-maroon/40 bg-maroon/10",
    dot: "bg-maroon",
  },
};
