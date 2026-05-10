"use client";

import { useCallback, useEffect, useState } from "react";
import { ElectionSelector } from "./_components/ElectionSelector";
import { ElectionSummary } from "./_components/ElectionSummary";
import { HoldingState } from "./_components/HoldingState";
import { PositionCard } from "./_components/PositionCard";
import { ResultsFooter } from "./_components/ResultsFooter";
import { ResultsNav } from "./_components/ResultsNav";
import { TurnoutBadge } from "./_components/TurnoutBadge";
import { POLL_INTERVAL, type ElectionMeta, type ResultsPayload } from "./_components/results-shared";

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

  // Fetch on election change + poll
  useEffect(() => {
    setLoading(true);
    setData(null);
    fetchResults();
    const interval = setInterval(fetchResults, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchResults]);

  return (
    <div className="min-h-screen bg-navy-deep flex flex-col">
      <ResultsNav />

      {elections.length > 1 && (
        <ElectionSelector
          elections={elections}
          currentIndex={currentIndex}
          onPrev={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          onNext={() => setCurrentIndex((i) => Math.min(elections.length - 1, i + 1))}
        />
      )}

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

      <ResultsFooter />
    </div>
  );
}
