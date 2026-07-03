"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/admin/ui";
import { MomentumChart } from "./MomentumChart";
import { TurnoutSparkline } from "./TurnoutSparkline";
import type { Snapshot, TurnoutData } from "./monitor-shared";

export function TurnoutCard({
  turnout,
  snapshots,
}: {
  turnout: TurnoutData;
  snapshots: Snapshot[];
}) {
  const [displayPct, setDisplayPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setDisplayPct(turnout.pct), 120);
    return () => clearTimeout(t);
  }, [turnout.pct]);

  return (
    <Card title="Voter Turnout" meta={<span className="text-[10px] text-white/40">{turnout.voted} / {turnout.total}</span>}>
      <div className="mb-2 h-[3px] overflow-hidden rounded-full bg-white/6">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-700"
          style={{ width: `${displayPct}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-emerald-400">
          {turnout.pct}% turnout
        </span>
        <span className="text-[11px] text-white/35">
          {turnout.total - turnout.voted} remaining
        </span>
      </div>
      <TurnoutSparkline snapshots={snapshots} />
      <MomentumChart snapshots={snapshots} />
    </Card>
  );
}
