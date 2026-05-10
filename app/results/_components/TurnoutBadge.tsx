"use client";

import { useEffect, useState } from "react";
import type { TurnoutData } from "./results-shared";

export function TurnoutBadge({ turnout }: { turnout: TurnoutData }) {
  const [displayPct, setDisplayPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setDisplayPct(turnout.pct), 120);
    return () => clearTimeout(t);
  }, [turnout.pct]);

  return (
    <div className="border border-white/10 rounded-sm px-4 py-3 bg-navy/30">
      <div className="flex items-center justify-between mb-2">
        <span className="font-body text-white/40 text-xs tracking-[0.15em] uppercase">
          Voter Turnout
        </span>
        <span className="font-mono text-white/60 text-sm">
          {turnout.voted.toLocaleString()}{" "}
          <span className="text-white/25">/ {turnout.total.toLocaleString()}</span>
        </span>
      </div>
      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div
          className="h-full bg-gold/60 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${displayPct}%` }}
        />
      </div>
      <p className="font-mono text-gold/60 text-xs mt-1.5 text-right">
        {turnout.pct}% turnout
      </p>
    </div>
  );
}
