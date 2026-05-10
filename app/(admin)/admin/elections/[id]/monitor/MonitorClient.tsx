"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { StatusPill } from "@/components/admin/ui";
import { MetricsStrip } from "./_components/MetricsStrip";
import { PositionCard } from "./_components/PositionCard";
import { ReplayPanel } from "./_components/ReplayPanel";
import { TurnoutCard } from "./_components/TurnoutCard";
import {
  DIVISION_LABELS,
  MAX_SNAPSHOTS,
  POLL_INTERVAL,
  type ResultsPayload,
  type Snapshot,
} from "./_components/monitor-shared";

export default function MonitorClient({
  electionId,
  electionName,
  division,
  status,
}: {
  electionId: string;
  electionName: string;
  division: string;
  status: string;
}) {
  const [liveData, setLiveData] = useState<ResultsPayload | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [replayIndex, setReplayIndex] = useState<number | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(400);
  const replayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const displayData =
    replayIndex !== null ? (snapshots[replayIndex]?.payload ?? liveData) : liveData;

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/results/${electionId}?admin=1`, { cache: "no-store" });
      if (res.ok) {
        const json: ResultsPayload = await res.json();
        setLiveData(json);
        const now = new Date();
        setLastUpdated(now);
        setSnapshots((prev) => {
          const label = now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
          const next: Snapshot[] = [...prev, { timestamp: now, label, payload: json }];
          return next.length > MAX_SNAPSHOTS ? next.slice(next.length - MAX_SNAPSHOTS) : next;
        });
        setReplayIndex(null);
      }
    } catch {
      // Retain last data on network error
    } finally {
      setLoading(false);
    }
  }, [electionId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    if (!isReplaying) return;
    replayTimerRef.current = setInterval(() => {
      setReplayIndex((prev) => {
        const current = prev ?? snapshots.length - 1;
        if (current >= snapshots.length - 1) {
          setIsReplaying(false);
          return null;
        }
        return current + 1;
      });
    }, replaySpeed);
    return () => {
      if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    };
  }, [isReplaying, replaySpeed, snapshots.length]);

  const handlePlay = () => {
    if (snapshots.length < 2) return;
    setReplayIndex((prev) =>
      prev === null || prev >= snapshots.length - 1 ? 0 : prev
    );
    setIsReplaying(true);
  };
  const handlePause = () => setIsReplaying(false);
  const handleJump = (i: number) => {
    setIsReplaying(false);
    const clamped = Math.max(0, Math.min(snapshots.length - 1, i));
    setReplayIndex(clamped === snapshots.length - 1 ? null : clamped);
  };
  const handlePrev = () => {
    setIsReplaying(false);
    const current = replayIndex ?? snapshots.length - 1;
    const next = Math.max(0, current - 1);
    setReplayIndex(next === snapshots.length - 1 ? null : next);
  };
  const handleNext = () => {
    setIsReplaying(false);
    const current = replayIndex ?? snapshots.length - 1;
    const next = Math.min(snapshots.length - 1, current + 1);
    setReplayIndex(next === snapshots.length - 1 ? null : next);
  };

  const isLive = replayIndex === null;

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-white/30">
            {DIVISION_LABELS[division] ?? division}
          </p>
          <h1 className="text-[22px] font-semibold tracking-tight text-white/90">
            {electionName}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isLive && (
            <span className="rounded-full border border-amber-400/25 bg-amber-400/[0.07] px-2 py-[3px] font-mono text-[10px] text-amber-400">
              Replaying {snapshots[replayIndex!]?.label}
            </span>
          )}
          {status === "CLOSED" && (
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
          {lastUpdated && isLive && (
            <p className="font-mono text-[10px] text-white/20">
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
          <svg className="h-5 w-5 animate-spin text-white/20" viewBox="0 0 24 24" fill="none">
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
                <p className="text-[13px] text-white/30">No positions found for this election.</p>
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
              replayIndex={replayIndex}
              isReplaying={isReplaying}
              onPlay={handlePlay}
              onPause={handlePause}
              onJump={handleJump}
              onPrev={handlePrev}
              onNext={handleNext}
              speed={replaySpeed}
              onSpeedChange={(s) => setReplaySpeed(s)}
            />
          </div>
        </div>
      )}
    </main>
  );
}
