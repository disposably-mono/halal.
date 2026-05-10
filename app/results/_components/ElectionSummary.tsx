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
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 text-[10px] font-body tracking-[0.15em] uppercase border px-2 py-1 rounded-sm
          ${data.status === "CLOSED"
            ? "border-white/20 text-white/40"
            : "border-emerald-400/30 text-emerald-400 bg-emerald-400/8"
          }`}
      >
        {data.status === "CLOSED" ? (
          "Final · Official Results"
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live · Updates every 30 seconds
          </>
        )}
      </span>

      <span className="font-mono text-[10px] text-white/20 border border-white/[0.06] px-2 py-1 rounded-sm">
        {totalVotes.toLocaleString()} total votes
      </span>

      <span className="font-mono text-[10px] text-white/20 border border-white/[0.06] px-2 py-1 rounded-sm">
        {data.positions.length} position{data.positions.length !== 1 ? "s" : ""}
      </span>

      {lastUpdated && (
        <span className="font-mono text-white/20 text-[10px] ml-auto">
          {lastUpdated.toLocaleTimeString("en-PH", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
      )}
    </div>
  );
}
