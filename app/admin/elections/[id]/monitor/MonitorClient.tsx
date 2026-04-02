"use client";

import { useState, useEffect, useCallback } from "react";

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

const POLL_INTERVAL = 5000;

const DIVISION_LABELS: Record<string, string> = {
  GS: "Grade School",
  JHS: "Junior High School",
  SHS: "Senior High School",
  HC: "House Council",
};

function VoteBar({
  candidate,
  totalVotes,
  isLeader,
}: {
  candidate: CandidateResult;
  totalVotes: number;
  isLeader: boolean;
}) {
  const pct = totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0;
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDisplayPct(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className={`relative overflow-hidden rounded-md border transition-colors
      ${isLeader ? "border-amber-400/30 bg-[#1a2540]" : "border-white/[0.06] bg-[#131c2e]"}`}
    >
      <div
        className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out
          ${isLeader ? "bg-amber-400/10" : "bg-white/[0.03]"}`}
        style={{ width: `${displayPct}%` }}
      />
      <div className="relative flex items-center gap-3 px-3 py-2.5">
        <span className="font-mono text-[11px] text-white/90 flex-1 truncate font-medium">
          {candidate.fullName}
        </span>
        <span className="font-mono text-[10px] text-white/30 shrink-0">
          Gr.{candidate.gradeLevel}
        </span>
        <span className={`font-mono text-[12px] font-bold tabular-nums shrink-0 min-w-[32px] text-right
          ${isLeader ? "text-amber-400" : "text-white/50"}`}
        >
          {candidate.votes}
        </span>
        <span className="font-mono text-[10px] text-white/25 shrink-0 w-[36px] text-right">
          {pct.toFixed(1)}%
        </span>
        {isLeader && candidate.votes > 0 && (
          <span className="text-amber-400 text-xs shrink-0">★</span>
        )}
      </div>
    </div>
  );
}

function PositionCard({ position }: { position: PositionResult }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#1a2540] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-[12px] font-semibold text-white/90 uppercase tracking-wide">
          {position.title}
        </h3>
        <div className="flex items-center gap-3 shrink-0 ml-3">
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
          position.candidates.map((c, idx) => (
            <VoteBar
              key={c.id}
              candidate={c}
              totalVotes={position.totalVotes}
              isLeader={idx === 0 && c.votes > 0}
            />
          ))
        )}
      </div>
    </div>
  );
}

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
  const [data, setData] = useState<ResultsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/results/${electionId}?admin=1`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastUpdated(new Date());
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

  const turnout = data?.turnout;
  const [displayPct, setDisplayPct] = useState(0);
  useEffect(() => {
    if (turnout) {
      const t = setTimeout(() => setDisplayPct(turnout.pct), 120);
      return () => clearTimeout(t);
    }
  }, [turnout]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] text-white/30 uppercase tracking-[0.15em] mb-1">
            {DIVISION_LABELS[division] ?? division}
          </p>
          <h1 className="text-[22px] font-semibold tracking-tight text-white/90">
            {electionName}
          </h1>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] text-white/25 uppercase tracking-[0.1em]">
            {status === "OPEN" ? "Live Monitor" : "Final Results"}
          </p>
          {lastUpdated && (
            <p className="font-mono text-[10px] text-white/20 mt-0.5">
              {lastUpdated.toLocaleTimeString("en-PH", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          )}
        </div>
      </div>

      {/* Turnout card */}
      {turnout && (
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
        </div>
      )}

      {/* Loading */}
      {loading && !data && (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin w-5 h-5 text-white/20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* Positions grid */}
      {data && data.positions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.positions.map((position) => (
            <PositionCard key={position.id} position={position} />
          ))}
        </div>
      )}

      {data && data.positions.length === 0 && !loading && (
        <div className="rounded-xl border border-white/[0.08] bg-[#1a2540] px-6 py-16 text-center">
          <p className="text-[13px] text-white/30">
            No positions found for this election.
          </p>
        </div>
      )}

    </main>
  );
}
