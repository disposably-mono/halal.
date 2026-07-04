"use client";

import { AdminCardTitle } from "@/components/admin/ui";
import { VoteBar } from "./VoteBar";
import type { PositionResult } from "./monitor-shared";

export function PositionCard({ position }: { position: PositionResult }) {
  const isTie = position.candidates.some((c) => c.isTie);

  return (
    <div className="overflow-hidden rounded-xl border border-white/8 bg-admin-surface">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-[18px] py-[13px]">
        <AdminCardTitle as="h3">{position.title}</AdminCardTitle>
        <div className="flex shrink-0 items-center gap-[9px]">
          {isTie && (
            <span className="rounded-full border border-sky-400/20 bg-sky-400/6 px-[8px] py-[2px] text-[10px] font-semibold text-sky-400">
              TIE
            </span>
          )}
          <span className="text-[11px] text-white/40">
            {position.totalVotes} vote{position.totalVotes !== 1 ? "s" : ""}
          </span>
          {position.abstentions > 0 && (
            <span className="rounded-full border border-white/8 px-[8px] py-[2px] text-[10px] text-white/60">
              {position.abstentions} abstain{position.abstentions !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
      <div className="space-y-[7px] p-[13px]">
        {position.candidates.length === 0 ? (
          <p className="py-[18px] text-center text-[12px] italic text-white/60">
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
