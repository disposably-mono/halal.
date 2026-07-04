"use client";

import type { ResultsPayload } from "./results-shared";

export function ElectionSummary({
  data,
  lastUpdated,
}: {
  data: ResultsPayload;
  lastUpdated: Date | null;
}) {
  const totalVotes = data.positions.reduce((s, p) => s + p.totalVotes, 0);

  return (
    <div className="flex flex-wrap items-center gap-[10px]">
      <span
        className={`inline-flex items-center gap-[7px] text-[12px] font-body tracking-[0.15em] uppercase border px-[10px] py-[5px] rounded-sm
          ${data.status === "CLOSED"
            ? "border-white/20 text-white/50"
            : "border-emerald-400/30 text-emerald-400 bg-emerald-400/8"
          }`}
      >
        {data.status === "CLOSED" ? (
          "Final · Official Results"
        ) : (
          <>
            <span className="w-[7px] h-[7px] rounded-full bg-emerald-400 animate-pulse" />
            Live · Updates every 30 seconds
          </>
        )}
      </span>

      <span className="font-mono text-[12px] text-white/30 border border-white/6 px-[10px] py-[5px] rounded-sm">
        {totalVotes.toLocaleString()} total votes
      </span>

      {data.audit.receiptVerificationSupported ? (
        <a href="/verify" className="font-mono text-[12px] text-gold/60 border border-gold/15 px-[10px] py-[5px] rounded-sm hover:text-gold">
          Verify receipt
        </a>
      ) : (
        <span className="font-mono text-[12px] text-amber-300/50 border border-amber-300/10 px-[10px] py-[5px] rounded-sm">Legacy election</span>
      )}

      {data.audit.fingerprint && (
        <span className="basis-full break-all font-mono text-[11px] text-white/20">Audit fingerprint: {data.audit.fingerprint}</span>
      )}

      <span className="font-mono text-[12px] text-white/30 border border-white/6 px-[10px] py-[5px] rounded-sm">
        {data.positions.length} position{data.positions.length !== 1 ? "s" : ""}
      </span>

      {lastUpdated && (
        <span className="basis-full font-mono text-white/35 text-[12px] sm:ml-auto sm:basis-auto">
          Updated{" "}
          <span className="text-white/35">
            {lastUpdated.toLocaleTimeString("en-PH", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </span>
      )}
    </div>
  );
}
