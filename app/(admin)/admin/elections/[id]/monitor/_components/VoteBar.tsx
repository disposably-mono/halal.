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
    ? "border-gold/30 bg-[#1d2a3a]"
    : isTie
      ? "border-sky-400/25 bg-[#131e30]"
      : "border-white/6 bg-admin-surface";

  const fillCls = isLeader && !isTie
    ? "bg-gold/10"
    : isTie
      ? "bg-sky-400/[0.07]"
      : "bg-white/3";

  const countColor = isLeader && !isTie
    ? "text-gold"
    : isTie
      ? "text-sky-400"
      : "text-white/60";

  return (
    <div className={`relative overflow-hidden rounded-[8px] border transition-colors ${wrapCls}`}>
      <div
        className={`absolute inset-y-[0px] left-[0px] transition-all duration-700 ease-out ${fillCls}`}
        style={{ width: `${displayPct}%` }}
      />
      <div className="relative flex items-center gap-[13px] px-[13px] py-[11px]">
        <span className="flex-1 truncate font-mono text-[12px] font-medium text-white/90">
          {candidate.fullName}
        </span>
        <span className="shrink-0 font-mono text-[11px] text-white/40">
          Gr.{candidate.gradeLevel}
        </span>
        <span className={`min-w-[36px] shrink-0 text-right font-mono text-[13px] font-bold tabular-nums ${countColor}`}>
          {candidate.votes}
        </span>
        <span className="w-[43px] shrink-0 text-right font-mono text-[11px] text-white/60">
          {pct.toFixed(1)}%
        </span>
        {isTie && candidate.votes > 0 && (
          <span className="shrink-0 font-mono text-[12px] font-bold text-sky-400">=</span>
        )}
        {isLeader && !isTie && candidate.votes > 0 && (
          <span className="shrink-0 text-[12px] text-gold">★</span>
        )}
      </div>
    </div>
  );
}
