"use client";

import { STATUS_CONFIG, type DivisionCard } from "./landing-shared";
import { DIVISION_CODES } from "@/lib/ui/division-labels";

export function DivisionStatusCard({ card, index }: { card: DivisionCard; index: number }) {
  const { division, label, sublabel, election } = card;
  const status = election?.status ?? null;
  const cfg = status ? STATUS_CONFIG[status] : null;

  return (
    <div
      className={`relative border border-white/10 bg-navy/40 rounded-sm p-[23px] flex flex-col gap-[14px] hover:border-gold/20 transition-all duration-300 ${status === "OPEN" ? "border-gold/25 bg-navy/60" : ""}`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      {/* Division code */}
      <div className="flex items-center justify-between">
        <span className="font-display text-[34px] text-white/30 leading-none">{DIVISION_CODES[division] ?? division}</span>
        {cfg && (
          <span
            className={`inline-flex items-center gap-[7px] text-[12px] font-body tracking-[0.15em] uppercase border px-[10px] py-[5px] rounded-sm ${cfg.color}`}
          >
            <span className={`w-[7px] h-[7px] rounded-full ${cfg.dot} ${status === "OPEN" ? "animate-pulse" : ""}`} />
            {cfg.label}
          </span>
        )}
        {!cfg && (
          <span className="text-[12px] font-body tracking-[0.15em] uppercase text-mid">—</span>
        )}
      </div>

      {/* Name */}
      <div>
        <p className="font-heading font-bold text-white text-[19px] leading-tight">{label}</p>
        <p className="font-body text-mid text-[14px] mt-[2px]">{sublabel}</p>
      </div>

      {/* Election name if exists */}
      {election && (
        <p className="font-body text-white/50 text-[14px] leading-snug border-t border-white/5 pt-[14px]">
          {election.name}
        </p>
      )}

      {/* Voter count */}
      {election && election._count.voters > 0 && (
        <p className="font-mono text-mid text-[13px]">
          {election._count.voters.toLocaleString()} registered voters
        </p>
      )}

      {/* No election */}
      {!election && (
        <p className="font-body text-mid/50 text-[14px] italic">No election scheduled</p>
      )}

      {/* Gold left border accent for OPEN */}
      {status === "OPEN" && (
        <div className="absolute left-[0px] top-[19px] bottom-[19px] w-[2px] bg-gold rounded-full" />
      )}
    </div>
  );
}
