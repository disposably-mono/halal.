"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface ElectionMeta {
  id: string;
  name: string;
  division: string;
  status: string;
}

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
  name: string;
  division: string;
  embargoed: boolean;
  positions: PositionResult[];
  turnout: TurnoutData | null;
}

const DIVISION_LABELS: Record<string, string> = {
  GS: "Grade School",
  JHS: "Junior High School",
  SHS: "Senior High School",
  HC: "House Council",
};

const POLL_INTERVAL = 30000;

// ── Bar component with animation ─────────────────────────────────────
function VoteBar({
  candidate,
  totalVotes,
  isLeader,
  isDraw,
  rank,
}: {
  candidate: CandidateResult;
  totalVotes: number;
  isLeader: boolean;
  isDraw: boolean;
  rank: number;
}) {
  const pct = totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0;
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDisplayPct(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div
      className={`relative rounded-sm border transition-all duration-200 overflow-hidden
        ${isLeader && !isDraw
          ? "border-gold/40 bg-navy/60"
          : isDraw
            ? "border-sky-400/30 bg-navy/40"
            : "border-white/8 bg-navy/20"}`}
    >
      {/* Animated fill */}
      <div
        className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out
          ${isLeader && !isDraw
            ? "bg-gold/15"
            : isDraw
              ? "bg-sky-400/[0.07]"
              : "bg-white/[0.04]"}`}
        style={{ width: `${displayPct}%` }}
      />

      <div className="relative flex items-center gap-3 px-4 py-3">
        {/* Rank */}
        <span
          className={`font-mono text-[11px] w-5 text-center shrink-0
            ${isLeader && !isDraw
              ? "text-gold/70"
              : isDraw
                ? "text-sky-400/70"
                : "text-white/20"}`}
        >
          {rank}
        </span>

        {/* Name */}
        <span
          className={`flex-1 font-heading font-bold text-sm tracking-wide uppercase min-w-0 truncate
            ${isLeader && !isDraw
              ? "text-white"
              : isDraw
                ? "text-white/90"
                : "text-white/60"}`}
        >
          {candidate.fullName}
        </span>

        {/* Grade */}
        <span className="font-mono text-[10px] text-white/25 shrink-0">
          Gr.{candidate.gradeLevel}
        </span>

        {/* Vote count */}
        <div className="text-right shrink-0 min-w-[52px]">
          <span
            className={`font-mono text-sm font-bold tabular-nums
              ${isLeader && !isDraw
                ? "text-gold"
                : isDraw
                  ? "text-sky-400"
                  : "text-white/40"}`}
          >
            {candidate.votes.toLocaleString()}
          </span>
          <span
            className={`font-mono text-[10px] ml-1.5
              ${isLeader && !isDraw
                ? "text-gold/50"
                : isDraw
                  ? "text-sky-400/50"
                  : "text-white/20"}`}
          >
            {pct.toFixed(1)}%
          </span>
        </div>

        {/* Draw indicator */}
        {isDraw && candidate.votes > 0 && (
          <span className="text-sky-400 text-xs ml-1 shrink-0 font-mono font-bold">=</span>
        )}
        {/* Leader crown */}
        {isLeader && !isDraw && candidate.votes > 0 && (
          <span className="text-gold text-xs ml-1 shrink-0">★</span>
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
    <div className="border border-white/8 rounded-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-navy/40 border-b border-white/8">
        <h3 className="font-heading font-bold text-white text-sm tracking-wide uppercase">
          {position.title}
        </h3>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {isDraw && (
            <span className="text-[10px] text-sky-400 border border-sky-400/20 bg-sky-400/[0.06] px-1.5 py-0.5 rounded-full">
              Draw
            </span>
          )}
          <span className="font-mono text-[10px] text-white/30">
            {position.totalVotes} vote{position.totalVotes !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Candidates */}
      <div className="p-3 space-y-2 bg-navy-deep/40">
        {position.candidates.length === 0 ? (
          <p className="font-body text-white/25 text-xs italic text-center py-4">
            No candidates
          </p>
        ) : (
          position.candidates.map((c, idx) => (
            <VoteBar
              key={c.id}
              candidate={c}
              totalVotes={position.totalVotes}
              isLeader={c.votes === topVotes && !isDraw}
              isDraw={isDraw && c.votes === topVotes}
              rank={idx + 1}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Holding state (embargoed) ─────────────────────────────────────────
function HoldingState({
  electionName,
  status,
}: {
  electionName: string;
  status: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 border border-white/10 rounded-sm flex items-center justify-center mx-auto mb-8">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#F5C000" strokeWidth="1.2" strokeOpacity="0.4" />
          <path d="M12 7v5l3 3" stroke="#F5C000" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
        </svg>
      </div>
      <p className="font-body text-gold/40 text-[10px] tracking-[0.3em] uppercase mb-3">
        {status === "OPEN" ? "Voting In Progress" : "Results Pending"}
      </p>
      <h2 className="font-display text-4xl text-white uppercase tracking-wide mb-3">
        {electionName}
      </h2>
      <p className="font-tagline text-white/25 text-sm italic mb-6">
        VOX POPULI VOX DEI
      </p>
      <p className="font-body text-white/40 text-sm max-w-xs leading-relaxed">
        {status === "OPEN"
          ? "Voting is currently in progress. Results will be published once polls close."
          : "Results will be available after this election closes."}
      </p>
    </div>
  );
}

// ── Turnout bar ───────────────────────────────────────────────────────
function TurnoutBadge({ turnout }: { turnout: TurnoutData }) {
  const [displayPct, setDisplayPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setDisplayPct(turnout.pct), 120);
    return () => clearTimeout(t);
  }, [turnout.pct]);

  return (
    <div className="border border-white/10 rounded-sm px-4 py-3 bg-navy/30">
      <div className="flex items-center justify-between mb-2">
        <span className="font-body text-white/40 text-xs tracking-[0.15em] uppercase">
          Voter Turnout
        </span>
        <span className="font-mono text-white/60 text-sm">
          {turnout.voted.toLocaleString()}{" "}
          <span className="text-white/25">/ {turnout.total.toLocaleString()}</span>
        </span>
      </div>
      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div
          className="h-full bg-gold/60 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${displayPct}%` }}
        />
      </div>
      <p className="font-mono text-gold/60 text-xs mt-1.5 text-right">
        {turnout.pct}% turnout
      </p>
    </div>
  );
}

// ── Election summary pills (quick stats) ─────────────────────────────
function ElectionSummary({
  data,
  lastUpdated,
}: {
  data: ResultsPayload;
  lastUpdated: Date | null;
}) {
  const totalVotes = data.positions.reduce((s, p) => s + p.totalVotes, 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 text-[10px] font-body tracking-[0.15em] uppercase border px-2 py-1 rounded-sm
          ${data.status === "CLOSED"
            ? "border-white/20 text-white/40"
            : "border-emerald-400/30 text-emerald-400 bg-emerald-400/8"
          }`}
      >
        {data.status === "CLOSED" ? (
          "Final · Official Results"
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live · Updates every 30 seconds
          </>
        )}
      </span>

      <span className="font-mono text-[10px] text-white/20 border border-white/[0.06] px-2 py-1 rounded-sm">
        {totalVotes.toLocaleString()} total votes
      </span>

      <span className="font-mono text-[10px] text-white/20 border border-white/[0.06] px-2 py-1 rounded-sm">
        {data.positions.length} position{data.positions.length !== 1 ? "s" : ""}
      </span>

      {lastUpdated && (
        <span className="font-mono text-white/20 text-[10px] ml-auto">
          {lastUpdated.toLocaleTimeString("en-PH", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function ResultsClient({
  elections,
}: {
  elections: ElectionMeta[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [data, setData] = useState<ResultsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const currentElection = elections[currentIndex];

  const fetchResults = useCallback(async () => {
    if (!currentElection) return;
    try {
      const res = await fetch(`/api/results/${currentElection.id}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastUpdated(new Date());
      }
    } catch {
      // Silently fail — keep showing last data
    } finally {
      setLoading(false);
    }
  }, [currentElection]);

  // Fetch on election change + poll every 5s
  useEffect(() => {
    setLoading(true);
    setData(null);
    fetchResults();
    const interval = setInterval(fetchResults, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchResults]);

  const canPrev = currentIndex > 0;
  const canNext = currentIndex < elections.length - 1;

  return (
    <div className="min-h-screen bg-navy-deep flex flex-col">

      {/* ── Top nav ───────────────────────────────────────────────── */}
      <nav className="border-b border-white/8 px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-body text-mid text-xs tracking-[0.2em] uppercase hover:text-gold/70 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-50">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Home
        </Link>
        <p className="font-body text-gold/40 text-[10px] tracking-[0.3em] uppercase">
          OLPS COMELEC · Results
        </p>
      </nav>

      {/* ── Election selector ─────────────────────────────────────── */}
      {elections.length > 1 && (
        <div className="border-b border-white/8 px-6 py-3 flex items-center justify-between gap-4 bg-navy/20">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={!canPrev}
            className="p-2 border border-white/10 rounded-sm text-white/40 hover:text-white/70 hover:border-white/25 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            aria-label="Previous election"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="text-center min-w-0 flex-1">
            <p className="font-heading font-bold text-white text-sm tracking-wide uppercase truncate">
              {currentElection.name}
            </p>
            <p className="font-body text-white/30 text-xs mt-0.5">
              {DIVISION_LABELS[currentElection.division] ?? currentElection.division}
              {" · "}
              <span className="text-white/20">{currentIndex + 1} of {elections.length}</span>
            </p>
          </div>

          <button
            onClick={() => setCurrentIndex((i) => Math.min(elections.length - 1, i + 1))}
            disabled={!canNext}
            className="p-2 border border-white/10 rounded-sm text-white/40 hover:text-white/70 hover:border-white/25 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            aria-label="Next election"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Main content ──────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col">
        {loading && !data ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <svg className="animate-spin w-6 h-6 text-gold/40" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <p className="font-body text-white/30 text-xs tracking-widest uppercase">Loading…</p>
            </div>
          </div>
        ) : data?.embargoed ? (
          <HoldingState electionName={data.name} status={data.status} />
        ) : data ? (
          <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">

            {/* Page header */}
            <div>
              <p className="font-tagline text-white/25 text-sm italic mb-1">
                VOX POPULI VOX DEI
              </p>
              <h1 className="font-display text-4xl sm:text-5xl text-white uppercase tracking-wide mb-3">
                {data.status === "CLOSED" ? "Final Results" : "Live Results"}
              </h1>
              <ElectionSummary data={data} lastUpdated={lastUpdated} />
            </div>

            {/* Turnout */}
            {data.turnout && <TurnoutBadge turnout={data.turnout} />}

            {/* Gold rule */}
            <div className="flex items-center gap-4">
              <div className="w-8 h-px bg-gold/40" />
              <span className="font-body text-gold/40 text-[10px] tracking-[0.3em] uppercase">
                {data.positions.length} Position{data.positions.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Position cards */}
            <div className="space-y-4">
              {data.positions.map((position) => (
                <PositionCard key={position.id} position={position} />
              ))}
            </div>

            {data.status === "CLOSED" && (
              <div className="text-center pt-4 pb-8">
                <p className="font-body text-white/20 text-xs tracking-widest uppercase">
                  FINAL OFFICIAL RESULTS — OLPS COMELEC
                </p>
              </div>
            )}
          </div>
        ) : null}
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="py-5 px-6 border-t border-white/5 text-center">
        <p className="font-body text-mid/30 text-[11px]">
          OLPS COMELEC · Our Lady of Peace School
        </p>
      </footer>
    </div>
  );
}
