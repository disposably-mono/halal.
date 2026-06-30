"use client";

import { useState } from "react";
import { submitBallot, type BallotSelection } from "./actions";
import { AbstentionModal } from "./_components/AbstentionModal";
import { BallotFooter } from "./_components/BallotFooter";
import { BallotHeader } from "./_components/BallotHeader";
import { PositionSection } from "./_components/PositionSection";
import type { Position } from "./_components/ballot-shared";

interface Props {
  electionName: string;
  division: string;
  gradeLevel: number;
  section: string;
  positions: Position[];
}

export default function BallotClient({
  electionName,
  division,
  gradeLevel,
  section,
  positions,
}: Props) {
  const [selections, setSelections] = useState<BallotSelection>({});
  const [showModal, setShowModal] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSelect = (positionId: string, candidateId: string | null) => {
    setSelections((prev) => ({ ...prev, [positionId]: candidateId ?? "" }));
  };

  const selectedCount = Object.values(selections).filter(Boolean).length;
  const totalPositions = positions.length;
  const skippedPositions = positions.filter((p) => !selections[p.id]);
  const allSelected = skippedPositions.length === 0;
  const remaining = totalPositions - selectedCount;

  const handleSubmitClick = () => {
    if (!allSelected) { setShowModal(true); return; }
    doSubmit();
  };

  const doSubmit = async () => {
    setIsPending(true);
    setServerError(null);
    try {
      const finalSelections: BallotSelection = {};
      for (const p of positions) {
        finalSelections[p.id] = selections[p.id] || null;
      }
      const result = await submitBallot(finalSelections);
      if (result.success) {
        window.location.href = "/vote/confirmed";
      } else {
        setServerError(result.error);
        setShowModal(false);
        setIsPending(false);
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
      setShowModal(false);
      setIsPending(false);
    }
  };

  return (
    <>
      {/*
        style={{ colorScheme: "light" }} — prevents the browser from applying
        dark mode to native UI elements (scrollbars, focus outlines, etc.)
        caused by className="dark" on <html>. All ballot token colors are
        explicit hex values and are NOT affected by shadcn CSS variables,
        so this single override is all that is needed.
      */}
      <div className="ballot-scrollbar min-h-screen bg-ballot-bg text-navy flex flex-col" style={{ colorScheme: "light", color: "#1B1F5E" }}>
        <BallotHeader
          electionName={electionName}
          division={division}
          gradeLevel={gradeLevel}
          section={section}
          selectedCount={selectedCount}
          totalPositions={totalPositions}
        />

        {/* ── Ballot body ────────────────────────────────────────── */}
        <main className="flex-1 px-4 sm:px-6 py-8">
          <div className="max-w-2xl mx-auto">

            {/* Document header block */}
            <div className="bg-ballot-paper border-2 border-navy border-t-[3px] border-t-gold text-center px-6 py-5 mb-4">
              <div className="flex items-center gap-[10px] mb-[10px]">
                <div className="flex-1 h-px bg-navy/18" />
                <span className="font-ballot-mono text-[9px] tracking-[0.38em] uppercase text-navy/38">
                  Official Document
                </span>
                <div className="flex-1 h-px bg-navy/18" />
              </div>
              <p className="font-tagline italic text-[11px] text-navy/38 mb-[6px]">
                Vox Populi, Vox Dei
              </p>
              <h1 className="font-ballot-display text-[30px] uppercase tracking-[0.15em] text-navy leading-none">
                Official Ballot
              </h1>
              <p className="font-ballot-mono text-[10px] tracking-[0.16em] uppercase text-navy/45 mt-[9px]">
                Mark the oval completely · One candidate per position
              </p>
              <div className="flex items-center gap-[10px] mt-[10px]">
                <div className="flex-1 h-px bg-navy/18" />
                <div className="w-[5px] h-[5px] rounded-full bg-gold/70" />
                <div className="flex-1 h-px bg-navy/18" />
              </div>
            </div>

            {/* Instruction strip */}
            <div className="flex items-start gap-[10px] border border-navy bg-ballot-inst px-[13px] py-[9px] mb-4">
              <span className="font-ballot-mono text-[10px] tracking-[0.2em] uppercase font-bold text-navy/65 whitespace-nowrap mt-[1px]">
                Instr.
              </span>
              <p className="font-ballot-mono text-[11px] leading-[1.55] tracking-[0.04em] text-navy/58">
                Select one candidate per position by clicking the oval. Positions
                left blank will be recorded as abstentions. Review your selections
                before submitting.
              </p>
            </div>

            {/* Server error */}
            {serverError && (
              <div
                role="alert"
                className="border-l-4 border-red-600 bg-red-50 px-4 py-3 font-ballot-mono text-xs text-red-700 tracking-wide mb-4"
              >
                ⚠ {serverError}
              </div>
            )}

            {/* Positions */}
            <div className="space-y-3">
              {positions.map((position, idx) => (
                <PositionSection
                  key={position.id}
                  position={position}
                  positionNumber={idx + 1}
                  selectedCandidateId={selections[position.id] ?? null}
                  onSelect={(candidateId) => handleSelect(position.id, candidateId)}
                  disabled={isPending}
                  skipped={showModal && !selections[position.id]}
                />
              ))}
            </div>

            {positions.length === 0 && (
              <div className="border-2 border-navy bg-ballot-paper p-10 text-center">
                <p className="font-ballot-mono text-navy/30 text-xs tracking-widest uppercase">
                  No positions found for your grade level.
                </p>
              </div>
            )}

            <div className="h-4" />
          </div>
        </main>

        <BallotFooter
          allSelected={allSelected}
          totalPositions={totalPositions}
          remaining={remaining}
          isPending={isPending}
          onSubmit={handleSubmitClick}
        />
      </div>

      {/* ── Abstention Modal ───────────────────────────────────────── */}
      {showModal && (
        <AbstentionModal
          skippedTitles={skippedPositions.map((p) => p.title)}
          onConfirm={doSubmit}
          onBack={() => setShowModal(false)}
          pending={isPending}
        />
      )}
    </>
  );
}
