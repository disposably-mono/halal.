"use client";

import { useEffect, useState } from "react";
import type { CandidateResult } from "./results-shared";

export function VoteBar({
  candidate,
  totalVotes,
  isLeader,
  isTie,
  rank,
}: {
  candidate: CandidateResult;
  totalVotes: number;
  isLeader: boolean;
  isTie: boolean;
  rank: number;
}) {
  const pct = totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0;
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDisplayPct(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div
      className={`relative rounded-sm border transition-all duration-200 overflow-hidden
        ${isLeader && !isTie
          ? "border-gold/40 bg-navy/60"
          : isTie
            ? "border-sky-400/30 bg-navy/40"
            : "border-white/[0.08] bg-navy/25"}`}
    >
      {/* Animated fill */}
      <div
        className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out
          ${isLeader && !isTie
            ? "bg-gold/[0.15]"
            : isTie
              ? "bg-sky-400/[0.07]"
              : "bg-white/[0.04]"}`}
        style={{ width: `${displayPct}%` }}
      />

      <div className="relative flex items-center gap-3 px-3 py-3 sm:px-4">
        {/* Rank */}
        <span
          className={`font-mono text-[11px] w-5 text-center shrink-0
            ${isLeader && !isTie
              ? "text-gold/70"
              : isTie
                ? "text-sky-400/70"
                : "text-white/30"}`}
        >
          {rank}
        </span>

        {/* Name */}
        <span
          className={`min-w-0 flex-1 truncate font-heading text-sm font-bold uppercase tracking-wide
            ${isLeader && !isTie
              ? "text-white"
              : isTie
                ? "text-white/90"
                : "text-white/60"}`}
        >
          {candidate.fullName}
        </span>

        {/* Grade */}
        <span className="hidden shrink-0 font-mono text-[10px] text-white/35 sm:inline">
          Gr.{candidate.gradeLevel}
        </span>

        {/* Vote count */}
        <div className="text-right shrink-0 min-w-[52px]">
          <span
            className={`font-mono text-sm font-bold tabular-nums
              ${isLeader && !isTie
                ? "text-gold"
                : isTie
                  ? "text-sky-400"
                  : "text-white/50"}`}
          >
            {candidate.votes.toLocaleString()}
          </span>
          <span
            className={`font-mono text-[10px] ml-1.5
              ${isLeader && !isTie
                ? "text-gold/50"
                : isTie
                  ? "text-sky-400/50"
                  : "text-white/30"}`}
          >
            {pct.toFixed(1)}%
          </span>
        </div>

        {/* Tie indicator */}
        {isTie && candidate.votes > 0 && (
          <span className="text-sky-400 text-xs ml-1 shrink-0 font-mono font-bold">=</span>
        )}
        {/* Leader crown */}
        {isLeader && !isTie && candidate.votes > 0 && (
          <span className="text-gold text-xs ml-1 shrink-0">★</span>
        )}
      </div>
    </div>
  );
}
