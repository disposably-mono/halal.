"use client";

import { useEffect, useRef, useState } from "react";
import type { Snapshot } from "./monitor-shared";

interface ReplayController {
  replayIndex: number | null;
  isReplaying: boolean;
  speed: number;
  setSpeed: (s: number) => void;
  isLive: boolean;
  play: () => void;
  pause: () => void;
  jump: (i: number) => void;
  prev: () => void;
  next: () => void;
}

/**
 * Snaps back to live whenever `lastUpdated` changes (i.e. polling succeeded).
 * This preserves the original MonitorClient behaviour where any poll tick
 * pulls the user out of replay back to live data.
 */
export function useMonitorReplay(snapshots: Snapshot[], lastUpdated: Date | null): ReplayController {
  const [replayIndex, setReplayIndex] = useState<number | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [speed, setSpeed] = useState(400);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Snap back to live when new poll data arrives.
  useEffect(() => {
    setReplayIndex(null);
  }, [lastUpdated]);

  // Auto-advance during replay.
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!isReplaying) return;
    timerRef.current = setInterval(() => {
      setReplayIndex((current) => {
        const c = current ?? snapshots.length - 1;
        if (c >= snapshots.length - 1) {
          setIsReplaying(false);
          return null;
        }
        return c + 1;
      });
    }, speed);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isReplaying, speed, snapshots.length]);

  const play = () => {
    if (snapshots.length < 2) return;
    setReplayIndex((prev) =>
      prev === null || prev >= snapshots.length - 1 ? 0 : prev
    );
    setIsReplaying(true);
  };

  const pause = () => setIsReplaying(false);

  const jump = (i: number) => {
    setIsReplaying(false);
    const clamped = Math.max(0, Math.min(snapshots.length - 1, i));
    setReplayIndex(clamped === snapshots.length - 1 ? null : clamped);
  };

  const prev = () => {
    setIsReplaying(false);
    setReplayIndex((current) => {
      const c = current ?? snapshots.length - 1;
      const n = Math.max(0, c - 1);
      return n === snapshots.length - 1 ? null : n;
    });
  };

  const next = () => {
    setIsReplaying(false);
    setReplayIndex((current) => {
      const c = current ?? snapshots.length - 1;
      const n = Math.min(snapshots.length - 1, c + 1);
      return n === snapshots.length - 1 ? null : n;
    });
  };

  return {
    replayIndex,
    isReplaying,
    speed,
    setSpeed,
    isLive: replayIndex === null,
    play,
    pause,
    jump,
    prev,
    next,
  };
}
