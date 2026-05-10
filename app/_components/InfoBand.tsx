"use client";

import type { CountdownTarget } from "./landing-shared";

export function InfoBand({ target }: { target: CountdownTarget }) {
  return (
    <section className="relative border-y border-gold/20 bg-navy/60 py-10 px-6 overflow-hidden">
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #F5C000 0px, #F5C000 1px, transparent 1px, transparent 12px)",
        }}
      />
      <div className="relative max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <p className="font-body text-gold/60 text-xs tracking-[0.3em] uppercase mb-1">
            Election Schedule
          </p>
          <p className="font-heading font-bold text-white text-lg">{target.electionName}</p>
        </div>
        {target.status === "OPEN" && (
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-heading font-bold text-emerald-400 text-sm tracking-widest uppercase">
              Voting is now open
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
