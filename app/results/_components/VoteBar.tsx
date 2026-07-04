"use client";

import { useDelayedPercent } from "@/lib/client/use-delayed-percent";
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
  const displayPct = useDelayedPercent(pct, 80);

  return (
    <div
      className={`relative rounded-sm border transition-all duration-200 overflow-hidden
        ${isLeader && !isTie
          ? "border-gold/40 bg-navy/60"
          : isTie
            ? "border-sky-400/30 bg-navy/40"
            : "border-white/8 bg-navy/25"}`}
    >
      {/* Animated fill */}
      <div
        className={`absolute inset-y-[0px] left-[0px] transition-all duration-700 ease-out
          ${isLeader && !isTie
            ? "bg-gold/15"
            : isTie
              ? "bg-sky-400/[0.07]"
              : "bg-white/4"}`}
        style={{ width: `${displayPct}%` }}
      />

      <div className="relative flex items-center gap-[14px] px-[14px] py-[14px] sm:px-[19px]">
        {/* Rank */}
        <span
          className={`font-mono text-[13px] w-[23px] text-center shrink-0
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
          className={`min-w-[0px] flex-1 truncate font-heading text-[17px] font-bold uppercase tracking-wide
            ${isLeader && !isTie
              ? "text-white"
              : isTie
                ? "text-white/90"
                : "text-white/60"}`}
        >
          {candidate.fullName}
        </span>

        {/* Grade */}
        <span className="hidden shrink-0 font-mono text-[12px] text-white/35 sm:inline">
          Gr.{candidate.gradeLevel}
        </span>

        {/* Vote count */}
        <div className="text-right shrink-0 min-w-[59px]">
          <span
            className={`font-mono text-[17px] font-bold tabular-nums
              ${isLeader && !isTie
                ? "text-gold"
                : isTie
                  ? "text-sky-400"
                  : "text-white/50"}`}
          >
            {candidate.votes.toLocaleString()}
          </span>
          <span
            className={`font-mono text-[12px] ml-[7px]
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
          <span className="text-sky-400 text-[14px] ml-[5px] shrink-0 font-mono font-bold">=</span>
        )}
        {/* Leader crown */}
        {isLeader && !isTie && candidate.votes > 0 && (
          <span className="text-gold text-[14px] ml-[5px] shrink-0">★</span>
        )}
      </div>
    </div>
  );
}
