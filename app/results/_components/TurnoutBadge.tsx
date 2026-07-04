"use client";

import { useDelayedPercent } from "@/lib/client/use-delayed-percent";
import type { TurnoutData } from "./results-shared";

export function TurnoutBadge({ turnout }: { turnout: TurnoutData }) {
  const displayPct = useDelayedPercent(turnout.pct, 120);

  return (
    <div className="rounded-sm border border-gold/15 bg-navy/35 px-[19px] py-[14px] shadow-[0_14px_35px_rgba(0,0,0,0.14)]">
      <div className="flex items-center justify-between mb-[10px]">
        <span className="font-body text-white/50 text-[14px] tracking-[0.15em] uppercase">
          Voter Turnout
        </span>
        <span className="font-mono text-white/60 text-[17px]">
          {turnout.voted.toLocaleString()}{" "}
          <span className="text-white/35">/ {turnout.total.toLocaleString()}</span>
        </span>
      </div>
      <div className="h-[7px] overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-gold/70 transition-all duration-700 ease-out"
          style={{ width: `${displayPct}%` }}
        />
      </div>
      <p className="font-mono text-gold/60 text-[14px] mt-[7px] text-right">
        {turnout.pct}% turnout
      </p>
    </div>
  );
}
