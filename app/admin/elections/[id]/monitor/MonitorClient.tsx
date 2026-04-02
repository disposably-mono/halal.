"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface CandidateResult {
  id: string;
  fullName: string;
  gradeLevel: number;
  votes: number;
}

interface PositionResult {
  id: string;
  title: string;
  order: number;
  candidates: CandidateResult[];
  abstentions: number;
  totalVotes: number;
}

interface TurnoutData {
  voted: number;
  total: number;
  pct: number;
}

interface ResultsPayload {
  electionId: string;
  status: string;
  positions: PositionResult[];
  turnout: TurnoutData | null;
}

interface Snapshot {
  timestamp: Date;
  label: string;
  payload: ResultsPayload;
}

const POLL_INTERVAL = 30000;
const MAX_SNAPSHOTS = 60;

const DIVISION_LABELS: Record<string, string> = {
  GS: "Grade School",
  JHS: "Junior High School",
  SHS: "Senior High School",
  HC: "House Council",
};

// ── Animated vote bar ─────────────────────────────────────────────────
function VoteBar({
  candidate,
  totalVotes,
  isLeader,
  isDraw,
}: {
  candidate: CandidateResult;
  totalVotes: number;
  isLeader: boolean;
  isDraw: boolean;
}) {
  const pct = totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0;
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDisplayPct(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div
      className={`relative overflow-hidden rounded-md border transition-colors
        ${isLeader && !isDraw
          ? "border-amber-400/30 bg-[#1a2540]"
          : isDraw
            ? "border-sky-400/30 bg-[#131e30]"
            : "border-white/[0.06] bg-[#131c2e]"}`}
    >
      <div
        className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out
          ${isLeader && !isDraw
            ? "bg-amber-400/10"
            : isDraw
              ? "bg-sky-400/[0.07]"
              : "bg-white/[0.03]"}`}
        style={{ width: `${displayPct}%` }}
      />
      <div className="relative flex items-center gap-3 px-3 py-2.5">
        <span className="font-mono text-[11px] text-white/90 flex-1 truncate font-medium">
          {candidate.fullName}
        </span>
        <span className="font-mono text-[10px] text-white/30 shrink-0">
          Gr.{candidate.gradeLevel}
        </span>
        <span
          className={`font-mono text-[12px] font-bold tabular-nums shrink-0 min-w-[32px] text-right
            ${isLeader && !isDraw
              ? "text-amber-400"
              : isDraw
                ? "text-sky-400"
                : "text-white/50"}`}
        >
          {candidate.votes}
        </span>
        <span className="font-mono text-[10px] text-white/25 shrink-0 w-[36px] text-right">
          {pct.toFixed(1)}%
        </span>
        {isDraw && candidate.votes > 0 && (
          <span className="text-sky-400 text-xs shrink-0 font-mono font-bold">=</span>
        )}
        {isLeader && !isDraw && candidate.votes > 0 && (
          <span className="text-amber-400 text-xs shrink-0">★</span>
        )}
      </div>
    </div>
  );
}

// ── Position card ─────────────────────────────────────────────────────
function PositionCard({ position }: { position: PositionResult }) {
  const topVotes = position.candidates[0]?.votes ?? 0;
  const isDraw =
    topVotes > 0 &&
    position.candidates.filter((c) => c.votes === topVotes).length > 1;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#1a2540] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
          {position.title}
        </h3>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          {isDraw && (
            <span className="text-[10px] text-sky-400 border border-sky-400/20 bg-sky-400/[0.06] px-1.5 py-0.5 rounded-full">
              Draw
            </span>
          )}
          <span className="text-[11px] text-white/30">
            {position.totalVotes} vote{position.totalVotes !== 1 ? "s" : ""}
          </span>
          {position.abstentions > 0 && (
            <span className="text-[10px] text-white/20 border border-white/[0.08] px-1.5 py-0.5 rounded-full">
              {position.abstentions} abstain{position.abstentions !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
      <div className="p-3 space-y-1.5">
        {position.candidates.length === 0 ? (
          <p className="text-[11px] text-white/25 italic text-center py-3">No candidates</p>
        ) : (
          position.candidates.map((c) => (
            <VoteBar
              key={c.id}
              candidate={c}
              totalVotes={position.totalVotes}
              isLeader={c.votes === topVotes && !isDraw}
              isDraw={isDraw && c.votes === topVotes}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Turnout sparkline (SVG) ───────────────────────────────────────────
function TurnoutSparkline({ snapshots }: { snapshots: Snapshot[] }) {
  if (snapshots.length < 2) return null;
  const values = snapshots.map((s) => s.payload.turnout?.pct ?? 0);
  const max = Math.max(...values, 1);
  const W = 200;
  const H = 40;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * W;
      const y = H - (v / max) * (H - 4);
      return `${x},${y}`;
    })
    .join(" ");
  const last = values[values.length - 1];
  const lastX = W;
  const lastY = H - (last / max) * (H - 4);

  return (
    <div className="mt-3">
      <p className="text-[9px] text-white/25 uppercase tracking-[0.12em] mb-1.5">
        Turnout over session
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
        <polyline
          points={pts}
          fill="none"
          stroke="rgba(52,211,153,0.5)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={lastX} cy={lastY} r="3" fill="#34d399" />
      </svg>
    </div>
  );
}

// ── Vote momentum chart (last N snapshots, total votes delta) ─────────
function MomentumChart({ snapshots }: { snapshots: Snapshot[] }) {
  if (snapshots.length < 2) return null;
  const deltas = snapshots.slice(1).map((s, i) => {
    const prev = snapshots[i].payload.positions.reduce(
      (sum, p) => sum + p.totalVotes,
      0
    );
    const curr = s.payload.positions.reduce((sum, p) => sum + p.totalVotes, 0);
    return Math.max(0, curr - prev);
  });
  const visible = deltas.slice(-12);
  const maxD = Math.max(...visible, 1);
  const W = 200;
  const H = 44;
  const barW = Math.floor((W - (visible.length - 1) * 2) / visible.length);

  return (
    <div className="mt-4">
      <p className="text-[9px] text-white/25 uppercase tracking-[0.12em] mb-1.5">
        Vote momentum
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
        {visible.map((d, i) => {
          const barH = Math.max(2, (d / maxD) * (H - 6));
          const x = i * (barW + 2);
          const y = H - barH;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx="2"
              fill={i === visible.length - 1 ? "rgba(251,191,36,0.6)" : "rgba(255,255,255,0.12)"}
            />
          );
        })}
      </svg>
    </div>
  );
}

// ── Replay controls ───────────────────────────────────────────────────
function ReplayPanel({
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
  const progPct =
    snapshots.length <= 1 ? 100 : (frameIdx / (snapshots.length - 1)) * 100;
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const active = el.querySelector("[data-active='true']") as HTMLElement | null;
    active?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [replayIndex]);

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#1a2540] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wide">
            Vote Replay
          </span>
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 border border-emerald-400/20 px-1.5 py-0.5 rounded-full">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          )}
        </div>
        <span className="text-[10px] text-white/25 font-mono">
          {snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06]">
        <button
          onClick={onPrev}
          disabled={frameIdx <= 0}
          className="w-7 h-7 flex items-center justify-center rounded-md border border-white/10 text-white/50 hover:text-white hover:border-white/25 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          aria-label="Previous snapshot"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M6.5 1.5L3.5 5L6.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          onClick={isReplaying ? onPause : onPlay}
          className={`w-7 h-7 flex items-center justify-center rounded-md border transition-all
            ${isReplaying
              ? "border-amber-400/40 bg-amber-400/10 text-amber-400"
              : "border-white/10 text-white/50 hover:text-white hover:border-white/25"
            }`}
          aria-label={isReplaying ? "Pause" : "Play"}
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
          className="w-7 h-7 flex items-center justify-center rounded-md border border-white/10 text-white/50 hover:text-white hover:border-white/25 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          aria-label="Next snapshot"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M3.5 1.5L6.5 5L3.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Progress scrubber */}
        <div className="flex-1 relative">
          <div className="h-1 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400/60 rounded-full transition-all duration-300"
              style={{ width: `${progPct}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0, snapshots.length - 1)}
            value={frameIdx}
            onChange={(e) => onJump(parseInt(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
            aria-label="Replay scrubber"
          />
        </div>

        {/* Frame label */}
        <span className="font-mono text-[9px] text-white/30 shrink-0 w-9 text-right">
          {isLive ? "LIVE" : snapshots[frameIdx]?.label ?? "—"}
        </span>

        {/* Speed */}
        <select
          value={speed}
          onChange={(e) => onSpeedChange(parseInt(e.target.value))}
          className="bg-transparent border border-white/10 text-white/40 text-[9px] rounded px-1 py-0.5 outline-none cursor-pointer"
        >
          <option value={800}>0.5×</option>
          <option value={400}>1×</option>
          <option value={200}>2×</option>
          <option value={100}>4×</option>
        </select>
      </div>

      {/* Timeline */}
      <div
        ref={timelineRef}
        className="max-h-[140px] overflow-y-auto p-2 space-y-0.5"
      >
        {snapshots.map((snap, i) => {
          const isActive = frameIdx === i;
          const totalV = snap.payload.positions.reduce(
            (s, p) => s + p.totalVotes,
            0
          );
          return (
            <div
              key={i}
              data-active={isActive ? "true" : "false"}
              onClick={() => onJump(i)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors
                ${isActive
                  ? "bg-amber-400/10 border border-amber-400/15"
                  : "hover:bg-white/[0.04] border border-transparent"
                }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? "bg-amber-400" : "bg-emerald-500/60"}`}
              />
              <span className="font-mono text-[9px] text-white/30 shrink-0 w-10">
                {snap.label}
              </span>
              <span className="text-[10px] text-white/40 flex-1 truncate">
                {totalV.toLocaleString()} votes · {snap.payload.turnout?.pct ?? 0}% turnout
              </span>
              {i === snapshots.length - 1 && (
                <span className="text-[8px] text-emerald-400/70 shrink-0">latest</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Turnout card ──────────────────────────────────────────────────────
function TurnoutCard({
  turnout,
  snapshots,
}: {
  turnout: TurnoutData;
  snapshots: Snapshot[];
}) {
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDisplayPct(turnout.pct), 120);
    return () => clearTimeout(t);
  }, [turnout.pct]);

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#1a2540] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-white/40 uppercase tracking-[0.12em]">
          Voter Turnout
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-[22px] font-semibold text-white/90 leading-none tabular-nums">
            {turnout.voted}
          </span>
          <span className="text-[13px] text-white/25">/ {turnout.total}</span>
        </div>
      </div>
      <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-700"
          style={{ width: `${displayPct}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-emerald-400">
          {turnout.pct}% turnout
        </span>
        <span className="text-[11px] text-white/25">
          {turnout.total - turnout.voted} not yet voted
        </span>
      </div>
      <TurnoutSparkline snapshots={snapshots} />
      <MomentumChart snapshots={snapshots} />
    </div>
  );
}

// ── Metrics strip ─────────────────────────────────────────────────────
function MetricsStrip({
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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.06] rounded-xl overflow-hidden border border-white/[0.08]">
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
        <div key={m.label} className="bg-[#1a2540] px-4 py-3">
          <p className="text-[9px] text-white/30 uppercase tracking-[0.12em] mb-1">{m.label}</p>
          <p className={`text-[18px] font-bold text-white/90 leading-none tabular-nums ${m.mono ? "font-mono text-[13px]" : ""}`}>
            {m.value}
          </p>
          <p className="text-[9px] text-white/25 mt-1">{m.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function MonitorClient({
  electionId,
  electionName,
  division,
  status,
  totalVoters,
}: {
  electionId: string;
  electionName: string;
  division: string;
  status: string;
  totalVoters: number;
}) {
  const [liveData, setLiveData] = useState<ResultsPayload | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Replay state
  const [replayIndex, setReplayIndex] = useState<number | null>(null); // null = live
  const [isReplaying, setIsReplaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(400);
  const replayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // The data currently shown (live or a snapshot)
  const displayData =
    replayIndex !== null ? snapshots[replayIndex]?.payload ?? liveData : liveData;

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/results/${electionId}?admin=1`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json: ResultsPayload = await res.json();
        setLiveData(json);
        const now = new Date();
        setLastUpdated(now);
        setSnapshots((prev) => {
          const label = now.toLocaleTimeString("en-PH", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const next: Snapshot[] = [
            ...prev,
            { timestamp: now, label, payload: json },
          ];
          return next.length > MAX_SNAPSHOTS
            ? next.slice(next.length - MAX_SNAPSHOTS)
            : next;
        });
        // If we're in live mode, stay live
        setReplayIndex(null);
      }
    } catch {
      // Keep last data on error
    } finally {
      setLoading(false);
    }
  }, [electionId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Replay timer
  useEffect(() => {
    if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    if (!isReplaying) return;
    replayTimerRef.current = setInterval(() => {
      setReplayIndex((prev) => {
        const current = prev ?? snapshots.length - 1;
        if (current >= snapshots.length - 1) {
          setIsReplaying(false);
          return null; // back to live
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
    setReplayIndex((prev) => (prev === null || prev >= snapshots.length - 1 ? 0 : prev));
    setIsReplaying(true);
  };

  const handlePause = () => {
    setIsReplaying(false);
  };

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
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-5">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] text-white/30 uppercase tracking-[0.15em] mb-1">
            {DIVISION_LABELS[division] ?? division}
          </p>
          <h1 className="text-[22px] font-semibold tracking-tight text-white/90">
            {electionName}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isLive && (
            <span className="text-[10px] text-amber-400 border border-amber-400/25 bg-amber-400/[0.07] px-2 py-1 rounded-full font-mono">
              Replaying {snapshots[replayIndex!]?.label}
            </span>
          )}
          <div
            className={`flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] border px-2 py-1 rounded-full
              ${status === "OPEN" && isLive
                ? "border-emerald-400/25 text-emerald-400"
                : "border-white/15 text-white/35"
              }`}
          >
            {status === "OPEN" && isLive && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
            {status === "OPEN" ? (isLive ? "Live" : "Paused") : "Final Results"}
          </div>
          {lastUpdated && isLive && (
            <p className="font-mono text-[10px] text-white/20">
              {lastUpdated.toLocaleTimeString("en-PH", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          )}
        </div>
      </div>

      {/* ── Metrics strip ──────────────────────────────────────────── */}
      {displayData && (
        <MetricsStrip
          data={displayData}
          snapshotCount={snapshots.length}
          lastUpdated={lastUpdated}
        />
      )}

      {/* ── Loading ────────────────────────────────────────────────── */}
      {loading && !displayData && (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin w-5 h-5 text-white/20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* ── Main 2-col layout ──────────────────────────────────────── */}
      {displayData && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
          {/* Left: positions grid */}
          <div className="space-y-4">
            {displayData.positions.length === 0 ? (
              <div className="rounded-xl border border-white/[0.08] bg-[#1a2540] px-6 py-16 text-center">
                <p className="text-[13px] text-white/30">
                  No positions found for this election.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {displayData.positions.map((position) => (
                  <PositionCard key={position.id} position={position} />
                ))}
              </div>
            )}
          </div>

          {/* Right: sidebar */}
          <div className="space-y-4">
            {/* Turnout + charts */}
            {displayData.turnout && (
              <TurnoutCard turnout={displayData.turnout} snapshots={snapshots} />
            )}

            {/* Replay */}
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
              onSpeedChange={(s) => {
                setReplaySpeed(s);
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
