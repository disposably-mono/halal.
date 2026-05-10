"use client";

import { StatCell } from "@/components/admin/ui";
import type { ResultsPayload } from "./monitor-shared";

export function MetricsStrip({
  data,
  snapshotCount,
  lastUpdated,
}: {
  data: ResultsPayload;
  snapshotCount: number;
  lastUpdated: Date | null;
}) {
  const totalVotes = data.positions.reduce((s, p) => s + p.totalVotes, 0);
  const totalAbstentions = data.positions.reduce((s, p) => s + p.abstentions, 0);

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.06] sm:grid-cols-4">
      {[
        { label: "Total Votes", value: totalVotes.toLocaleString(), sub: "across all positions" },
        { label: "Positions", value: data.positions.length.toString(), sub: `${totalAbstentions} abstentions` },
        { label: "Snapshots", value: snapshotCount.toString(), sub: "replay available" },
        {
          label: "Last Sync",
          value: lastUpdated
            ? lastUpdated.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
            : "—",
          sub: "auto-polls every 30s",
          mono: true,
        },
      ].map((m) => (
        <StatCell key={m.label} label={m.label} value={m.value} sub={m.sub} mono={m.mono} />
      ))}
    </div>
  );
}
