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
    <div className="rounded-sm border border-gold/[0.15] bg-navy/[0.35] px-4 py-3 shadow-[0_14px_35px_rgba(0,0,0,0.14)]">
      <div className="flex items-center justify-between mb-2">
        <span className="font-body text-white/50 text-xs tracking-[0.15em] uppercase">
          Voter Turnout
        </span>
        <span className="font-mono text-white/60 text-sm">
          {turnout.voted.toLocaleString()}{" "}
          <span className="text-white/35">/ {turnout.total.toLocaleString()}</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full bg-gold/70 transition-all duration-700 ease-out"
          style={{ width: `${displayPct}%` }}
        />
      </div>
      <p className="font-mono text-gold/60 text-xs mt-1.5 text-right">
        {turnout.pct}% turnout
      </p>
    </div>
  );
}
