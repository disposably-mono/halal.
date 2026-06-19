"use client";

import { StatusPill } from "@/components/admin/ui";
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
  const { liveData, snapshots, loading, lastUpdated } = useMonitorPolling(electionId);
  const replay = useMonitorReplay(snapshots, lastUpdated);

  const displayData =
    replay.replayIndex !== null
      ? (snapshots[replay.replayIndex]?.payload ?? liveData)
      : liveData;

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-white/40">
            {DIVISION_LABELS[division] ?? division}
          </p>
          <h1 className="text-[22px] font-semibold tracking-tight text-white/90">
            {electionName}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!replay.isLive && (
            <span className="rounded-full border border-amber-400/25 bg-amber-400/[0.07] px-2 py-[3px] font-mono text-[10px] text-amber-400">
              Replaying {snapshots[replay.replayIndex!]?.label}
            </span>
          )}
          {status === "CLOSED" && canExportResults && (
            <a
              href={`/api/elections/${electionId}/results-pdf`}
              download
              className="inline-flex items-center gap-1.5 rounded-[7px] border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-[11px] font-semibold text-amber-400 transition-colors hover:bg-amber-400/20"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M5.5 1v6M2.5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M1 9.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Export PDF
            </a>
          )}
          <StatusPill status={status as "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED"} />
          {lastUpdated && replay.isLive && (
            <p className="font-mono text-[10px] text-white/30">
              {lastUpdated.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          )}
        </div>
      </div>

      {/* ── Metrics strip ── */}
      {displayData && (
        <MetricsStrip data={displayData} snapshotCount={snapshots.length} lastUpdated={lastUpdated} />
      )}

      {/* ── Loading ── */}
      {loading && !displayData && (
        <div className="flex items-center justify-center py-20">
          <svg className="h-5 w-5 animate-spin text-white/30" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* ── Main layout ── */}
      {displayData && (
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1fr_320px]">
          {/* Positions grid */}
          <div>
            {displayData.positions.length === 0 ? (
              <div className="rounded-xl border border-white/[0.08] bg-[#1a2540] px-6 py-16 text-center">
                <p className="text-[13px] text-white/40">No positions found for this election.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
    </main>
  );
}
