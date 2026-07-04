"use client";

import type { CountdownTarget } from "./landing-shared";

export function InfoBand({ target }: { target: CountdownTarget }) {
  return (
    <section className="relative border-y border-gold/20 bg-navy/60 py-[45px] px-[27px] overflow-hidden">
      <div
        className="absolute inset-[0px] opacity-5"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #F5C000 0px, #F5C000 1px, transparent 1px, transparent 12px)",
        }}
      />
      <div className="relative max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-[27px]">
        <div>
          <p className="font-body text-gold/60 text-[14px] tracking-[0.3em] uppercase mb-[5px]">
            Election Schedule
          </p>
          <p className="font-heading font-bold text-white text-[20px]">{target.electionName}</p>
          <p className="font-body text-mid/[0.55] text-[17px] leading-[27px] mt-[10px] max-w-xl">
            Check this schedule for official voting times and division updates from OLPS COMELEC.
          </p>
        </div>
        {target.status === "OPEN" && (
          <div className="flex items-center gap-[14px]">
            <span className="w-[10px] h-[10px] rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-heading font-bold text-emerald-400 text-[17px] tracking-widest uppercase">
              Voting is now open
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
