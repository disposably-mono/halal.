"use client";

import { AdminCardTitle } from "@/components/admin/ui";
import { VoteBar } from "./VoteBar";
import type { PositionResult } from "./monitor-shared";

export function PositionCard({ position }: { position: PositionResult }) {
  const isTie = position.candidates.some((c) => c.isTie);

  return (
    <div className="overflow-hidden rounded-xl border border-white/8 bg-admin-surface">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
        <AdminCardTitle as="h3">{position.title}</AdminCardTitle>
        <div className="flex shrink-0 items-center gap-2">
          {isTie && (
            <span className="rounded-full border border-sky-400/20 bg-sky-400/6 px-[7px] py-[2px] text-[9px] font-semibold text-sky-400">
              TIE
            </span>
          )}
          <span className="text-[10px] text-white/40">
            {position.totalVotes} vote{position.totalVotes !== 1 ? "s" : ""}
          </span>
          {position.abstentions > 0 && (
            <span className="rounded-full border border-white/8 px-[7px] py-[2px] text-[9px] text-white/60">
              {position.abstentions} abstain{position.abstentions !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
      <div className="space-y-1.5 p-3">
        {position.candidates.length === 0 ? (
          <p className="py-4 text-center text-[11px] italic text-white/60">
            No candidates
          </p>
        ) : (
          position.candidates.map((c) => (
            <VoteBar
              key={c.id}
              candidate={c}
              totalVotes={position.totalVotes}
              isLeader={c.isWinner && !c.isTie}
              isTie={c.isTie}
            />
          ))
        )}
      </div>
    </div>
  );
}
