"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { PublicFooter } from "@/app/_components/PublicFooter";
import { PublicNav } from "@/app/_components/PublicNav";
import { PUBLIC_PAGE_BACKGROUND } from "@/app/_components/public-page";
import { ElectionSelector } from "./_components/ElectionSelector";
import { ElectionSummary } from "./_components/ElectionSummary";
import { HoldingState } from "./_components/HoldingState";
import { PositionCard } from "./_components/PositionCard";
import { TurnoutBadge } from "./_components/TurnoutBadge";
import { DIVISION_LABELS, POLL_INTERVAL, type ElectionMeta, type ResultsPayload } from "./_components/results-shared";

export default function ResultsClient({
  elections,
}: {
  elections: ElectionMeta[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [data, setData] = useState<ResultsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Which election the visible tally belongs to, so we only animate when the
  // viewer actually swaps elections (not on routine background poll refreshes).
  const displayedElectionIdRef = useRef<string | null>(null);

  const currentElection = elections[currentIndex];

  const fetchResults = useCallback(async () => {
    if (!currentElection) return;
    try {
      const res = await fetch(`/api/results/${currentElection.id}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json: ResultsPayload = await res.json();
        const isElectionSwap =
          displayedElectionIdRef.current !== null &&
          displayedElectionIdRef.current !== json.electionId;

        const commit = () => {
          setData(json);
          setLastUpdated(new Date());
          displayedElectionIdRef.current = json.electionId;
        };

        const doc = document as Document & {
          startViewTransition?: (cb: () => void) => void;
        };

        if (isElectionSwap && typeof doc.startViewTransition === "function") {
          // Crossfade the old tally into the new one. flushSync forces the
          // DOM swap to land inside the View Transition snapshot.
          doc.startViewTransition(() => flushSync(commit));
        } else {
          commit();
        }
      }
    } catch {
      // Silently fail — keep showing last data
    } finally {
      setLoading(false);
    }
  }, [currentElection]);

  // Fetch on election change + poll. The previous tally stays on screen while
  // the next election loads so the crossfade has something to animate from;
  // the full-screen loader only appears on the very first load (data == null).
  useEffect(() => {
    setLoading(true);
    fetchResults();
    const interval = setInterval(fetchResults, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchResults]);

  const divisionLabel = data ? DIVISION_LABELS[data.division] ?? data.division : "";
  const candidateCount =
    data?.positions.reduce((sum, p) => sum + p.candidates.length, 0) ?? 0;

  return (
    <div className="min-h-screen text-white overflow-x-hidden flex flex-col" style={PUBLIC_PAGE_BACKGROUND}>
      <PublicNav label="Results" />

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
              <p className="font-body text-white/40 text-xs tracking-widest uppercase">Loading…</p>
            </div>
          </div>
        ) : data?.integrityFailure ? (
          <div className="flex-1 flex items-center justify-center px-6 py-20 text-center">
            <div className="max-w-lg border border-red-400/30 bg-red-400/[0.06] p-8">
              <p className="text-[10px] uppercase tracking-[0.25em] text-red-300/70">Integrity Warning</p>
              <h2 className="mt-3 font-display text-4xl uppercase">Certified Results Unavailable</h2>
              <p className="mt-4 text-sm leading-6 text-white/55">The official closing snapshot did not pass cryptographic verification. Results are withheld until OLPS COMELEC completes an audit.</p>
            </div>
          </div>
        ) : data?.embargoed ? (
          <HoldingState electionName={data.name} status={data.status} audit={data.audit} />
        ) : data ? (
          <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10 space-y-6">
            {/* Page header */}
            <div>
              <p className="font-tagline text-white/35 text-sm italic mb-1">
                VOX POPULI VOX DEI
              </p>
              <h1 className="font-display text-4xl sm:text-5xl text-white uppercase tracking-wide mb-3">
                {data.status === "CLOSED" ? "Final Results" : "Live Results"}
              </h1>
              <div className="mb-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-body text-sm text-mid/60">
                <span className="font-heading uppercase tracking-wide text-white/80">
                  {data.name}
                </span>
                <span aria-hidden className="text-white/25">·</span>
                <span>{divisionLabel}</span>
                <span aria-hidden className="text-white/25">·</span>
                <span>
                  {candidateCount} candidate{candidateCount !== 1 ? "s" : ""} contesting{" "}
                  {data.positions.length} position{data.positions.length !== 1 ? "s" : ""}
                </span>
              </div>
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
                <p className="font-body text-white/30 text-xs tracking-widest uppercase">
                  FINAL OFFICIAL RESULTS — OLPS COMELEC
                </p>
              </div>
            )}
          </div>
        ) : null}
      </main>

      <PublicFooter note="Public Results" />
    </div>
  );
}
