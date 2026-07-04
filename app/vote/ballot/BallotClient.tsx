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
        <main className="flex-1 px-[18px] sm:px-[27px] py-[36px]">
          <div className="max-w-2xl mx-auto">

            {/* Document header block */}
            <div className="bg-ballot-paper border-2 border-navy border-t-[3px] border-t-gold text-center px-[27px] py-[23px] mb-[18px]">
              <div className="flex items-center gap-[11px] mb-[11px]">
                <div className="flex-1 h-px bg-navy/18" />
                <span className="font-ballot-mono text-[10px] tracking-[0.38em] uppercase text-navy/38">
                  Official Document
                </span>
                <div className="flex-1 h-px bg-navy/18" />
              </div>
              <p className="font-tagline italic text-[12px] text-navy/38 mb-[7px]">
                Vox Populi, Vox Dei
              </p>
              <h1 className="font-ballot-display text-[34px] uppercase tracking-[0.15em] text-navy leading-none">
                Official Ballot
              </h1>
              <p className="font-ballot-mono text-[11px] tracking-[0.16em] uppercase text-navy/45 mt-[10px]">
                Mark the oval completely · One candidate per position
              </p>
              <div className="flex items-center gap-[11px] mt-[11px]">
                <div className="flex-1 h-px bg-navy/18" />
                <div className="w-[6px] h-[6px] rounded-full bg-gold/70" />
                <div className="flex-1 h-px bg-navy/18" />
              </div>
            </div>

            {/* Instruction strip */}
            <div className="flex items-start gap-[11px] border border-navy bg-ballot-inst px-[15px] py-[10px] mb-[18px]">
              <span className="font-ballot-mono text-[11px] tracking-[0.2em] uppercase font-bold text-navy/65 whitespace-nowrap mt-px">
                Instr.
              </span>
              <p className="font-ballot-mono text-[12px] leading-[1.55] tracking-[0.04em] text-navy/58">
                Select one candidate per position by clicking the oval. Positions
                left blank will be recorded as abstentions. Review your selections
                before submitting.
              </p>
            </div>

            {/* Server error */}
            {serverError && (
              <div
                role="alert"
                className="border-l-4 border-red-600 bg-red-50 px-[18px] py-[14px] font-ballot-mono text-[14px] text-red-700 tracking-wide mb-[18px]"
              >
                ⚠ {serverError}
              </div>
            )}

            {/* Positions */}
            <div className="space-y-[14px]">
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
              <div className="border-2 border-navy bg-ballot-paper p-[45px] text-center">
                <p className="font-ballot-mono text-navy/30 text-[14px] tracking-widest uppercase">
                  No positions found for your grade level.
                </p>
              </div>
            )}

            <div className="h-[18px]" />
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
