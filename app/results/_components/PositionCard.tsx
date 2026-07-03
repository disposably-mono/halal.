"use client";

import { VoteBar } from "./VoteBar";
import type { PositionResult } from "./results-shared";

export function PositionCard({ position }: { position: PositionResult }) {
  const isTie = position.candidates.some((c) => c.isTie);

  return (
    <div className="overflow-hidden rounded-sm border border-white/8 bg-navy-deep/50 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/8 bg-navy/45 px-4 py-3">
        <h3 className="font-heading font-bold text-white text-sm tracking-wide uppercase">
          {position.title}
        </h3>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {isTie && (
            <span className="text-[10px] text-sky-400 border border-sky-400/20 bg-sky-400/6 px-1.5 py-0.5 rounded-full">
              TIE
            </span>
          )}
          <span className="font-mono text-[10px] text-white/40">
            {position.totalVotes} vote{position.totalVotes !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Candidates */}
      <div className="space-y-2 bg-navy-deep/45 p-3">
        {position.candidates.length === 0 ? (
          <p className="font-body text-white/35 text-xs italic text-center py-4">
            No candidates
          </p>
        ) : (
          position.candidates.map((c, idx) => (
            <VoteBar
              key={c.id}
              candidate={c}
              totalVotes={position.totalVotes}
              isLeader={c.isWinner && !c.isTie}
              isTie={c.isTie}
              rank={idx + 1}
            />
          ))
        )}
      </div>
    </div>
  );
}
