"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Spinner } from "@/components/ui/spinner";
import { PublicFooter } from "@/app/_components/PublicFooter";
import { PublicNav } from "@/app/_components/PublicNav";
import { PUBLIC_PAGE_BACKGROUND } from "@/app/_components/public-page";
import { ElectionSelector } from "./_components/ElectionSelector";
import { ElectionSummary } from "./_components/ElectionSummary";
import { HoldingState } from "./_components/HoldingState";
import { PositionCard } from "./_components/PositionCard";
import { TurnoutBadge } from "./_components/TurnoutBadge";
import { CLIENT_REQUEST_TIMEOUT_MS, createTimeoutController } from "@/lib/client/request-timeout";
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
  const requestIdRef = useRef(0);

  const currentElection = elections[currentIndex];

  // Returns the fetched election status (or null on a failed/non-OK request) so
  // the poll loop can decide whether there's any point polling again.
  const fetchResults = useCallback(async (election: ElectionMeta, requestId: number): Promise<string | null> => {
    const { controller, clearTimeout } = createTimeoutController(CLIENT_REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(`/api/results/${election.id}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!res.ok || requestId !== requestIdRef.current) {
        return null;
      }
      const json: ResultsPayload = await res.json();
      if (requestId !== requestIdRef.current) return null;

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
      return json.status;
    } catch {
      // Silently fail — keep showing last data
      return null;
    } finally {
      clearTimeout();
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Fetch on election change, then poll — but stop once the election is CLOSED.
  // A closed election's tally is frozen and certified; it never changes again,
  // so continuing to poll identical results forever is pure waste. While the
  // election is still embargoed/pre-close we keep polling so the page flips to
  // results the moment it closes. A failed poll (null) keeps polling to retry.
  // The previous tally stays on screen while the next election loads so the
  // crossfade has something to animate from; the full-screen loader only
  // appears on the very first load (data == null).
  useEffect(() => {
    if (!currentElection) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const requestId = ++requestIdRef.current;

    const tick = async () => {
      const status = await fetchResults(currentElection, requestId);
      if (cancelled || requestId !== requestIdRef.current || status === "CLOSED") return;
      timer = setTimeout(tick, POLL_INTERVAL);
    };
    void tick();

    return () => {
      cancelled = true;
      requestIdRef.current += 1;
      if (timer) clearTimeout(timer);
    };
  }, [currentElection, fetchResults]);

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
            <div className="flex flex-col items-center gap-[19px]">
              <Spinner className="w-[27px] h-[27px] text-gold/40" />
              <p className="font-body text-white/40 text-[14px] tracking-widest uppercase">Loading…</p>
            </div>
          </div>
        ) : data?.integrityFailure ? (
          <div className="flex-1 flex items-center justify-center px-[27px] py-[90px] text-center">
            <div className="max-w-lg border border-red-400/30 bg-red-400/6 p-[36px]">
              <p className="text-[12px] uppercase tracking-[0.25em] text-red-300/70">Integrity Warning</p>
              <h2 className="mt-[14px] font-display text-[41px] uppercase">Certified Results Unavailable</h2>
              <p className="mt-[19px] text-[17px] leading-[27px] text-white/55">The official closing snapshot did not pass cryptographic verification. Results are withheld until OLPS COMELEC completes an audit.</p>
            </div>
          </div>
        ) : data?.embargoed ? (
          <HoldingState electionName={data.name} status={data.status} audit={data.audit} />
        ) : data ? (
          <div className="max-w-3xl mx-auto w-full px-[19px] sm:px-[27px] py-[36px] sm:py-[45px] space-y-[27px]">
            {/* Page header */}
            <div>
              <p className="font-tagline text-white/35 text-[17px] italic mb-[5px]">
                VOX POPULI VOX DEI
              </p>
              <h1 className="font-display text-[41px] sm:text-[54px] text-white uppercase tracking-wide mb-[14px]">
                {data.status === "CLOSED" ? "Final Results" : "Live Results"}
              </h1>
              <div className="mb-[19px] flex flex-wrap items-center gap-x-[12px] gap-y-[5px] font-body text-[17px] text-mid/60">
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
            <div className="flex items-center gap-[19px]">
              <div className="w-[36px] h-px bg-gold/40" />
              <span className="font-body text-gold/40 text-[12px] tracking-[0.3em] uppercase">
                {data.positions.length} Position{data.positions.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Position cards */}
            <div className="space-y-[19px]">
              {data.positions.map((position) => (
                <PositionCard key={position.id} position={position} />
              ))}
            </div>

            {data.status === "CLOSED" && (
              <div className="text-center pt-[19px] pb-[36px]">
                <p className="font-body text-white/30 text-[14px] tracking-widest uppercase">
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
