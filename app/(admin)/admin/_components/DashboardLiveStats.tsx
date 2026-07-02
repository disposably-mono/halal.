"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/admin/ui";
import { snapshotsToTurnoutTrend, type DashboardElection } from "./dashboard-helpers";
import type { SnapshotResponse, TurnoutTrendPoint } from "./dashboard-live-stats";
import { pct } from "./shared";

const DASHBOARD_POLL_MS = 30_000;

export function DashboardLiveStats({ elections }: { elections: DashboardElection[] }) {
  const openElections = useMemo(
    () => elections.filter((election) => election.status === "OPEN"),
    [elections],
  );
  const [trends, setTrends] = useState<Record<string, TurnoutTrendPoint[]>>({});

  const refresh = useCallback(async () => {
    if (openElections.length === 0) {
      setTrends({});
      return;
    }

    const entries = await Promise.all(
      openElections.map(async (election) => {
        try {
          const response = await fetch(`/api/elections/${election.id}/monitor-snapshots`, {
            cache: "no-store",
          });
          if (!response.ok) return [election.id, []] as const;
          const body = await response.json() as SnapshotResponse;
          return [election.id, snapshotsToTurnoutTrend(body.snapshots)] as const;
        } catch {
          return [election.id, []] as const;
        }
      }),
    );

    setTrends(Object.fromEntries(entries));
  }, [openElections]);

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, DASHBOARD_POLL_MS);
    return () => window.clearInterval(interval);
  }, [refresh]);

  if (openElections.length === 0) return null;

  return (
    <Card title="Live Turnout" meta={<span className="text-[10px] text-white/45">Auto-refreshes</span>}>
      <div className="grid gap-3 md:grid-cols-2">
        {openElections.map((election) => {
          const trend = trends[election.id] ?? [];
          const latest = trend.at(-1);
          const currentPct = latest?.pct ?? pct(election.votedCount, election._count.voters);
          const currentVoted = latest?.voted ?? election.votedCount;
          const total = latest?.total ?? election._count.voters;

          return (
            <div key={election.id} className="rounded-[8px] border border-white/[0.07] bg-white/[0.03] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-white/85">{election.name}</p>
                  <p className="mt-0.5 text-[10px] text-white/45">
                    {currentVoted.toLocaleString()} of {total.toLocaleString()} voted
                  </p>
                </div>
                <p className="font-mono text-[18px] font-bold text-emerald-400">{currentPct}%</p>
              </div>
              <Sparkline points={trend} fallbackPct={currentPct} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Sparkline({
  points,
  fallbackPct,
}: {
  points: TurnoutTrendPoint[];
  fallbackPct: number;
}) {
  const bars = points.length > 0 ? points : [{ label: "Now", pct: fallbackPct, voted: 0, total: 0 }];

  return (
    <div className="mt-3 flex h-12 items-end gap-1" aria-label="Turnout trend">
      {bars.map((point, index) => (
        <div
          key={`${point.label}-${index}`}
          title={`${point.label}: ${point.pct}%`}
          className="min-w-0 flex-1 rounded-t-[3px] bg-emerald-400/70"
          style={{ height: `${Math.max(8, point.pct)}%` }}
        />
      ))}
    </div>
  );
}
