"use client";

import { useState } from "react";
import { useEffect, useRef } from "react";
import { ChevronDown, Pause, Play, StepBack, StepForward } from "lucide-react";
import { AdminCardTitle } from "@/components/admin/ui";
import { ThemedSelect } from "@/components/admin/ThemedSelect";
import type { Snapshot } from "./monitor-shared";

export function ReplayPanel({
  snapshots,
  replayIndex,
  isReplaying,
  onPlay,
  onPause,
  onJump,
  onPrev,
  onNext,
  speed,
  onSpeedChange,
}: {
  snapshots: Snapshot[];
  replayIndex: number | null;
  isReplaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onJump: (i: number) => void;
  onPrev: () => void;
  onNext: () => void;
  speed: number;
  onSpeedChange: (s: number) => void;
}) {
  const isLive = replayIndex === null;
  const frameIdx = replayIndex ?? snapshots.length - 1;
  const progPct = snapshots.length <= 1 ? 100 : (frameIdx / (snapshots.length - 1)) * 100;
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const active = el.querySelector("[data-active='true']") as HTMLElement | null;
    active?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [replayIndex]);

  const iconBtn =
    "flex h-[36px] w-[36px] items-center justify-center rounded-[7px] border border-white/10 text-white/60 transition-all hover:border-white/25 hover:text-white/90 disabled:cursor-not-allowed disabled:opacity-20 cursor-pointer";

  return (
    <div className="overflow-hidden rounded-xl border border-white/8 bg-admin-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.07] px-[18px] py-[13px]">
        <div className="flex items-center gap-[9px]">
          <AdminCardTitle>Timeline Replay</AdminCardTitle>
          {isLive && (
            <span className="flex items-center gap-[6px] rounded-full border border-emerald-400/20 px-[8px] py-[2px] text-[10px] font-semibold text-emerald-400">
              <span className="h-[6px] w-[6px] animate-pulse rounded-full bg-emerald-400" />
              Live
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="flex h-[36px] items-center gap-[9px] rounded-[7px] border border-white/8 px-[9px] font-mono text-[11px] text-white/60 transition-colors hover:border-white/18 hover:text-white/80"
          aria-expanded={isOpen}
        >
          {snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""}
          <ChevronDown aria-hidden="true" className={`h-[16px] w-[16px] transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {isOpen && (
        <>
          {/* Controls */}
          <div className="flex items-center gap-[9px] border-b border-white/[0.07] px-[13px] py-[11px]">
            <button
              onClick={onPrev}
              disabled={frameIdx <= 0}
              className={iconBtn}
              aria-label="Previous snapshot"
              title="Previous snapshot"
            >
              <StepBack aria-hidden="true" className="h-[16px] w-[16px]" />
            </button>

            <button
              onClick={isReplaying ? onPause : onPlay}
              className={`flex h-[36px] w-[36px] items-center justify-center rounded-[7px] border transition-all cursor-pointer ${isReplaying
                ? "border-gold/40 bg-gold/10 text-gold"
                : "border-white/10 text-white/60 hover:border-white/25 hover:text-white/90"
                }`}
              aria-label={isReplaying ? "Pause replay" : "Play replay"}
              title={isReplaying ? "Pause replay" : "Play replay"}
            >
              {isReplaying ? <Pause aria-hidden="true" className="h-[16px] w-[16px]" /> : <Play aria-hidden="true" className="h-[16px] w-[16px]" />}
            </button>

            <button
              onClick={onNext}
              disabled={isLive && !isReplaying}
              className={iconBtn}
              aria-label="Next snapshot"
              title="Next snapshot"
            >
              <StepForward aria-hidden="true" className="h-[16px] w-[16px]" />
            </button>

            {/* Scrubber */}
            <div className="relative flex-1">
              <div className="h-[4px] overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-gold/60 transition-all duration-300"
                  style={{ width: `${progPct}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(0, snapshots.length - 1)}
                value={frameIdx}
                onChange={(e) => onJump(parseInt(e.target.value))}
                className="absolute inset-[0px] h-full w-full cursor-pointer opacity-0"
                aria-label="Replay scrubber"
              />
            </div>

            <span className="w-[40px] shrink-0 text-right font-mono text-[10px] text-white/40">
              {isLive ? "LIVE" : (snapshots[frameIdx]?.label ?? "—")}
            </span>

            <ThemedSelect
              value={String(speed)}
              onValueChange={(v) => onSpeedChange(parseInt(v))}
              ariaLabel="Replay speed"
              className="w-auto px-[8px] py-[2px] text-[10px]"
              options={[
                { value: "800", label: "0.5x" },
                { value: "400", label: "1x" },
                { value: "200", label: "2x" },
                { value: "100", label: "4x" },
              ]}
            />
          </div>

          {/* Timeline */}
          <div ref={timelineRef} className="max-h-[157px] space-y-[2px] overflow-y-auto p-[9px]">
            {snapshots.map((snap, i) => {
              const isActive = frameIdx === i;
              const totalV = snap.payload.positions.reduce((s, p) => s + p.totalVotes, 0);
              return (
                <div
                  key={`${snap.timestamp.toISOString()}-${i}`}
                  data-active={isActive ? "true" : "false"}
                  onClick={() => onJump(i)}
                  className={`flex cursor-pointer items-center gap-[9px] rounded-[8px] border px-[11px] py-[7px] transition-colors ${isActive
                    ? "border-gold/15 bg-gold/8"
                    : "border-transparent hover:bg-white/4"
                    }`}
                >
                  <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${isActive ? "bg-gold" : "bg-emerald-500/60"}`} />
                  <span className="w-[45px] shrink-0 font-mono text-[10px] text-white/40">
                    {snap.label}
                  </span>
                  <span className="flex-1 truncate text-[11px] text-white/50">
                    {totalV.toLocaleString()} votes · {snap.payload.turnout?.pct ?? 0}% turnout
                  </span>
                  {i === snapshots.length - 1 && (
                    <span className="shrink-0 text-[9px] text-emerald-400/70">latest</span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
