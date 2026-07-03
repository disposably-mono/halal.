"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/admin/ui";
import { CLIENT_REQUEST_TIMEOUT_MS, createTimeoutController } from "@/lib/client/request-timeout";
import { snapshotsToTurnoutTrend, type DashboardElection } from "./dashboard-helpers";
import type { SnapshotResponse, TurnoutTrendPoint } from "./dashboard-live-stats";
import { pct } from "./shared";

const DASHBOARD_POLL_MS = 30_000;

type TrendLoadResult = {
  id: string;
  points: TurnoutTrendPoint[];
  error: string | null;
};

async function loadElectionTrend(election: DashboardElection): Promise<TrendLoadResult> {
  const { controller, clearTimeout } = createTimeoutController(CLIENT_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`/api/elections/${election.id}/monitor-snapshots`, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      return {
        id: election.id,
        points: [],
        error: "Live turnout data is temporarily unavailable.",
      };
    }
    const body = (await response.json()) as SnapshotResponse;
    return { id: election.id, points: snapshotsToTurnoutTrend(body.snapshots), error: null };
  } catch {
    return {
      id: election.id,
      points: [],
      error: "Live turnout data is temporarily unavailable.",
    };
  } finally {
    clearTimeout();
  }
}

export function DashboardLiveStats({ elections }: { elections: DashboardElection[] }) {
  const openElections = useMemo(
    () => elections.filter((election) => election.status === "OPEN"),
    [elections],
  );
  const [trends, setTrends] = useState<Record<string, TurnoutTrendPoint[]>>({});
  const [trendErrors, setTrendErrors] = useState<Record<string, string | null>>({});

  const refresh = useCallback(async () => {
    if (openElections.length === 0) {
      setTrends({});
      setTrendErrors({});
      return;
    }

    const entries = await Promise.all(openElections.map(loadElectionTrend));

    setTrends((previous) => {
      const nextTrends = Object.fromEntries(
        entries.map((entry) => [entry.id, entry.error ? previous[entry.id] ?? [] : entry.points] as const),
      );
      return nextTrends;
    });
    setTrendErrors(Object.fromEntries(entries.map((entry) => [entry.id, entry.error] as const)));
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
          const trendError = trendErrors[election.id];
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
                  {trendError && (
                    <p className="mt-0.5 text-[10px] text-amber-300/80">{trendError}</p>
                  )}
                </div>
                <p className={`font-mono text-[18px] font-bold ${trendError ? "text-amber-300" : "text-emerald-400"}`}>
                  {currentPct}%
                </p>
              </div>
              <Sparkline points={trend} fallbackPct={currentPct} isStale={Boolean(trendError)} />
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
  isStale,
}: {
  points: TurnoutTrendPoint[];
  fallbackPct: number;
  isStale: boolean;
}) {
  const bars = points.length > 0 ? points : [{ label: "Now", pct: fallbackPct, voted: 0, total: 0 }];

  return (
    <div className="mt-3 flex h-12 items-end gap-1" aria-label="Turnout trend">
      {bars.map((point, index) => (
        <div
          key={`${point.label}-${index}`}
          title={`${point.label}: ${point.pct}%`}
          className={`min-w-0 flex-1 rounded-t-[3px] ${isStale ? "bg-amber-300/70" : "bg-emerald-400/70"}`}
          style={{ height: `${Math.max(8, point.pct)}%` }}
        />
      ))}
    </div>
  );
}
