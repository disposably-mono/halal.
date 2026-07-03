type ResultStatus = "OPEN" | "CLOSED" | string;

export type ResultsElectionOrderInput = {
  id: string;
  status: ResultStatus;
  createdAt: Date;
};

export function orderResultsElections<T extends ResultsElectionOrderInput>(elections: readonly T[]): T[] {
  return [...elections].sort((a, b) => {
    const statusRank = statusOrder(a.status) - statusOrder(b.status);
    if (statusRank !== 0) return statusRank;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

export function getTurnoutPercent({ voted, voters }: { voted: number; voters: number }): number {
  if (voters <= 0) return 0;
  return Math.round((voted / voters) * 100);
}

export function getResultStatusMeta(status: ResultStatus) {
  if (status === "CLOSED") {
    return {
      label: "Final",
      badgeClassName: "bg-white/5 text-white/60",
      dotClassName: "bg-white/20",
      barClassName: "bg-white/30",
    };
  }

  return {
    label: "Live",
    badgeClassName: "bg-emerald-400/12 text-emerald-400",
    dotClassName: "bg-emerald-400",
    barClassName: "bg-emerald-400",
  };
}

function statusOrder(status: ResultStatus): number {
  if (status === "CLOSED") return 0;
  if (status === "OPEN") return 1;
  return 2;
}
