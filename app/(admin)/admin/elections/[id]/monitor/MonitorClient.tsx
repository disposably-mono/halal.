"use client";

import { Download, RotateCw } from "lucide-react";
import { Breadcrumb, PageContainer, PageHeader, PollingStatus, StatusPill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { MetricsStrip } from "./_components/MetricsStrip";
import { PositionCard } from "./_components/PositionCard";
import { ReplayPanel } from "./_components/ReplayPanel";
import { TurnoutCard } from "./_components/TurnoutCard";
import { DIVISION_LABELS } from "./_components/monitor-shared";
import { useMonitorPolling } from "./_components/useMonitorPolling";
import { useMonitorReplay } from "./_components/useMonitorReplay";

export default function MonitorClient({
  electionId,
  electionName,
  division,
  status,
  canExportResults,
}: {
  electionId: string;
  electionName: string;
  division: string;
  status: string;
  canExportResults: boolean;
}) {
  const { liveData, snapshots, loading, isFetching, error, lastUpdated, refresh } = useMonitorPolling(electionId);
  const replay = useMonitorReplay(snapshots, lastUpdated);

  const displayData =
    replay.replayIndex !== null
      ? (snapshots[replay.replayIndex]?.payload ?? liveData)
      : liveData;

  return (
    <main>
      <PageContainer className="space-y-5">
        <PageHeader
          eyebrow={DIVISION_LABELS[division] ?? division}
          title={electionName}
          breadcrumb={
            <Breadcrumb
              items={[
                { href: "/admin", label: "Dashboard" },
                { label: "Monitor" },
              ]}
            />
          }
          meta={
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={status as "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED"} />
              <PollingStatus
                updatedAt={lastUpdated}
                isFetching={isFetching}
                error={error}
              />
            </div>
          }
          actions={
            <>
              <Button type="button" onClick={refresh} disabled={isFetching} variant="adminGhost" size="adminMd">
                <RotateCw aria-hidden="true" className={isFetching ? "animate-spin" : undefined} />
                Refresh
              </Button>
              {status === "CLOSED" && canExportResults && (
                <Button asChild variant="adminPrimary" size="adminMd">
                  <a href={`/api/elections/${electionId}/results-pdf`} download>
                    <Download aria-hidden="true" />
                    Export PDF
                  </a>
                </Button>
              )}
            </>
          }
        />

        <div className="flex flex-wrap items-center gap-2">
          {!replay.isLive && (
            <span className="rounded-full border border-gold/25 bg-gold/[0.07] px-2 py-[3px] font-mono text-[10px] text-gold">
              Replaying {snapshots[replay.replayIndex!]?.label}
            </span>
          )}
        </div>

        {/* ── Metrics strip ── */}
        {displayData && (
          <MetricsStrip data={displayData} snapshotCount={snapshots.length} lastUpdated={lastUpdated} />
        )}

        {/* ── Loading ── */}
        {loading && !displayData && (
          <div className="flex items-center justify-center py-20">
            <RotateCw aria-hidden="true" className="h-5 w-5 animate-spin text-white/60" />
          </div>
        )}

        {/* ── Main layout ── */}
        {displayData && (
          <div className="grid grid-cols-1 items-start gap-5 2xl:grid-cols-[1fr_340px]">
            {/* Positions grid */}
            <div>
              {displayData.positions.length === 0 ? (
                <div className="rounded-xl border border-white/[0.08] bg-admin-surface px-6 py-16 text-center">
                  <p className="text-[13px] text-white/40">No positions found for this election.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {displayData.positions.map((position) => (
                    <PositionCard key={position.id} position={position} />
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {displayData.turnout && (
                <TurnoutCard turnout={displayData.turnout} snapshots={snapshots} />
              )}
              <ReplayPanel
                snapshots={snapshots}
                replayIndex={replay.replayIndex}
                isReplaying={replay.isReplaying}
                onPlay={replay.play}
                onPause={replay.pause}
                onJump={replay.jump}
                onPrev={replay.prev}
                onNext={replay.next}
                speed={replay.speed}
                onSpeedChange={replay.setSpeed}
              />
            </div>
          </div>
        )}
      </PageContainer>
    </main>
  );
}
