"use client";

import { useEffect, useState } from "react";
import type { CandidateResult } from "./monitor-shared";

export function VoteBar({
  candidate,
  totalVotes,
  isLeader,
  isTie,
}: {
  candidate: CandidateResult;
  totalVotes: number;
  isLeader: boolean;
  isTie: boolean;
}) {
  const pct = totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0;
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDisplayPct(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);

  const wrapCls = isLeader && !isTie
    ? "border-amber-400/30 bg-[#1d2a3a]"
    : isTie
      ? "border-sky-400/25 bg-[#131e30]"
      : "border-white/[0.06] bg-[#131c2e]";

  const fillCls = isLeader && !isTie
    ? "bg-amber-400/10"
    : isTie
      ? "bg-sky-400/[0.07]"
      : "bg-white/[0.03]";

  const countColor = isLeader && !isTie
    ? "text-amber-400"
    : isTie
      ? "text-sky-400"
      : "text-white/60";

  return (
    <div className={`relative overflow-hidden rounded-[7px] border transition-colors ${wrapCls}`}>
      <div
        className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${fillCls}`}
        style={{ width: `${displayPct}%` }}
      />
      <div className="relative flex items-center gap-3 px-3 py-2.5">
        <span className="flex-1 truncate font-mono text-[11px] font-medium text-white/90">
          {candidate.fullName}
        </span>
        <span className="shrink-0 font-mono text-[10px] text-white/40">
          Gr.{candidate.gradeLevel}
        </span>
        <span className={`min-w-[32px] shrink-0 text-right font-mono text-[12px] font-bold tabular-nums ${countColor}`}>
          {candidate.votes}
        </span>
        <span className="w-[38px] shrink-0 text-right font-mono text-[10px] text-white/35">
          {pct.toFixed(1)}%
        </span>
        {isTie && candidate.votes > 0 && (
          <span className="shrink-0 font-mono text-[11px] font-bold text-sky-400">=</span>
        )}
        {isLeader && !isTie && candidate.votes > 0 && (
          <span className="shrink-0 text-[11px] text-amber-400">★</span>
        )}
      </div>
    </div>
  );
}
