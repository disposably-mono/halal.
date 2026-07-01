"use client";

import { STATUS_CONFIG, type DivisionCard } from "./landing-shared";
import { DIVISION_CODES } from "@/lib/ui/division-labels";

export function DivisionStatusCard({ card, index }: { card: DivisionCard; index: number }) {
  const { division, label, sublabel, election } = card;
  const status = election?.status ?? null;
  const cfg = status ? STATUS_CONFIG[status] : null;

  return (
    <div
      className={`relative border border-white/10 bg-navy/40 rounded-sm p-5 flex flex-col gap-3 hover:border-gold/20 transition-all duration-300 ${status === "OPEN" ? "border-gold/25 bg-navy/60" : ""}`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      {/* Division code */}
      <div className="flex items-center justify-between">
        <span className="font-display text-3xl text-white/30 leading-none">{DIVISION_CODES[division] ?? division}</span>
        {cfg && (
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-body tracking-[0.15em] uppercase border px-2 py-1 rounded-sm ${cfg.color}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === "OPEN" ? "animate-pulse" : ""}`} />
            {cfg.label}
          </span>
        )}
        {!cfg && (
          <span className="text-[10px] font-body tracking-[0.15em] uppercase text-mid">—</span>
        )}
      </div>

      {/* Name */}
      <div>
        <p className="font-heading font-bold text-white text-base leading-tight">{label}</p>
        <p className="font-body text-mid text-xs mt-0.5">{sublabel}</p>
      </div>

      {/* Election name if exists */}
      {election && (
        <p className="font-body text-white/50 text-xs leading-snug border-t border-white/5 pt-3">
          {election.name}
        </p>
      )}

      {/* Voter count */}
      {election && election._count.voters > 0 && (
        <p className="font-mono text-mid text-[11px]">
          {election._count.voters.toLocaleString()} registered voters
        </p>
      )}

      {/* No election */}
      {!election && (
        <p className="font-body text-mid/50 text-xs italic">No election scheduled</p>
      )}

      {/* Gold left border accent for OPEN */}
      {status === "OPEN" && (
        <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-gold rounded-full" />
      )}
    </div>
  );
}
