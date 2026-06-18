"use client";

import { useEffect, useRef } from "react";
import { AdminCardTitle } from "@/components/admin/ui";
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

  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const active = el.querySelector("[data-active='true']") as HTMLElement | null;
    active?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [replayIndex]);

  const iconBtn =
    "flex h-7 w-7 items-center justify-center rounded-[6px] border border-white/10 text-white/60 transition-all hover:border-white/25 hover:text-white/90 disabled:cursor-not-allowed disabled:opacity-20 cursor-pointer";

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#1a2540]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
        <div className="flex items-center gap-2">
          <AdminCardTitle>Timeline Replay</AdminCardTitle>
          {isLive && (
            <span className="flex items-center gap-[5px] rounded-full border border-emerald-400/20 px-[7px] py-[2px] text-[9px] font-semibold text-emerald-400">
              <span className="h-[5px] w-[5px] animate-pulse rounded-full bg-emerald-400" />
              Live
            </span>
          )}
        </div>
        <span className="font-mono text-[10px] text-white/35">
          {snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 border-b border-white/[0.07] px-3 py-2.5">
        <button
          onClick={onPrev}
          disabled={frameIdx <= 0}
          className={iconBtn}
          aria-label="Previous snapshot"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M6.5 1.5L3.5 5L6.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          onClick={isReplaying ? onPause : onPlay}
          className={`flex h-7 w-7 items-center justify-center rounded-[6px] border transition-all cursor-pointer ${isReplaying
            ? "border-amber-400/40 bg-amber-400/10 text-amber-400"
            : "border-white/10 text-white/60 hover:border-white/25 hover:text-white/90"
            }`}
          aria-label={isReplaying ? "Pause replay" : "Play replay"}
        >
          {isReplaying ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="2" y="1.5" width="2.5" height="7" rx="0.5" fill="currentColor" />
              <rect x="5.5" y="1.5" width="2.5" height="7" rx="0.5" fill="currentColor" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M3 1.5L8.5 5L3 8.5V1.5Z" fill="currentColor" />
            </svg>
          )}
        </button>

        <button
          onClick={onNext}
          disabled={isLive && !isReplaying}
          className={iconBtn}
          aria-label="Next snapshot"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M3.5 1.5L6.5 5L3.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Scrubber */}
        <div className="relative flex-1">
          <div className="h-1 overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full bg-amber-400/60 transition-all duration-300"
              style={{ width: `${progPct}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0, snapshots.length - 1)}
            value={frameIdx}
            onChange={(e) => onJump(parseInt(e.target.value))}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Replay scrubber"
          />
        </div>

        <span className="w-9 shrink-0 text-right font-mono text-[9px] text-white/40">
          {isLive ? "LIVE" : (snapshots[frameIdx]?.label ?? "—")}
        </span>

        <select
          value={speed}
          onChange={(e) => onSpeedChange(parseInt(e.target.value))}
          className="cursor-pointer rounded-[5px] border border-white/10 bg-transparent px-[5px] py-[3px] text-[9px] text-white/50 outline-none"
          aria-label="Replay speed"
        >
          <option value={800}>0.5×</option>
          <option value={400}>1×</option>
          <option value={200}>2×</option>
          <option value={100}>4×</option>
        </select>
      </div>

      {/* Timeline */}
      <div ref={timelineRef} className="max-h-[140px] space-y-0.5 overflow-y-auto p-2">
        {snapshots.map((snap, i) => {
          const isActive = frameIdx === i;
          const totalV = snap.payload.positions.reduce((s, p) => s + p.totalVotes, 0);
          return (
            <div
              key={i}
              data-active={isActive ? "true" : "false"}
              onClick={() => onJump(i)}
              className={`flex cursor-pointer items-center gap-2 rounded-[7px] border px-2.5 py-1.5 transition-colors ${isActive
                ? "border-amber-400/15 bg-amber-400/[0.08]"
                : "border-transparent hover:bg-white/[0.04]"
                }`}
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isActive ? "bg-amber-400" : "bg-emerald-500/60"}`} />
              <span className="w-10 shrink-0 font-mono text-[9px] text-white/40">
                {snap.label}
              </span>
              <span className="flex-1 truncate text-[10px] text-white/50">
                {totalV.toLocaleString()} votes · {snap.payload.turnout?.pct ?? 0}% turnout
              </span>
              {i === snapshots.length - 1 && (
                <span className="shrink-0 text-[8px] text-emerald-400/70">latest</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
