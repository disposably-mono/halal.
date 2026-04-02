"use client";

import { useState, useRef, useEffect } from "react";
import { submitBallot, BallotSelection } from "./actions";

interface Candidate {
  id: string;
  fullName: string;
  gradeLevel: number;
}

interface Position {
  id: string;
  title: string;
  candidateGrade: number | number[];
  candidates: Candidate[];
}

interface Props {
  electionName: string;
  division: string;
  gradeLevel: number;
  section: string;
  positions: Position[];
}

// ── Candidate Card ───────────────────────────────────────────────────
function CandidateCard({
  candidate,
  selected,
  onSelect,
  disabled,
}: {
  candidate: Candidate;
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`
        relative flex flex-col items-center text-center px-4 py-5 rounded-sm border transition-all duration-150
        min-w-[120px] flex-1 max-w-[180px]
        ${selected
          ? "border-gold bg-gold/10 shadow-[0_0_0_1px_rgba(245,192,0,0.3)]"
          : "border-white/10 bg-navy/30 hover:border-white/25 hover:bg-navy/50"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
      aria-pressed={selected}
    >
      {/* Selection indicator */}
      <div
        className={`
          w-5 h-5 rounded-full border-2 mb-3 flex items-center justify-center transition-all
          ${selected ? "border-gold bg-gold" : "border-white/20"}
        `}
      >
        {selected && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4l3 3 5-6"
              stroke="#1B1F5E"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* Avatar initial */}
      <div
        className={`
          w-10 h-10 rounded-sm flex items-center justify-center mb-3 font-heading font-bold text-lg
          ${selected ? "bg-gold/20 text-gold" : "bg-white/5 text-white/40"}
        `}
      >
        {candidate.fullName.charAt(0).toUpperCase()}
      </div>

      {/* Name */}
      <p
        className={`font-heading font-bold text-sm leading-tight ${selected ? "text-white" : "text-white/70"
          }`}
      >
        {candidate.fullName}
      </p>

      {/* Grade */}
      <p className="font-mono text-[10px] text-mid/60 mt-1">
        Grade {candidate.gradeLevel}
      </p>
    </button>
  );
}

// ── Position Row ─────────────────────────────────────────────────────
function PositionRow({
  position,
  selectedCandidateId,
  onSelect,
  disabled,
  skipped,
}: {
  position: Position;
  selectedCandidateId: string | null;
  onSelect: (candidateId: string | null) => void;
  disabled: boolean;
  skipped: boolean;
}) {
  return (
    <div
      className={`
        border rounded-sm p-5 transition-all
        ${skipped ? "border-gold/40 bg-gold/5" : "border-white/8 bg-transparent"}
      `}
    >
      {/* Position header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-heading font-bold text-white text-base tracking-wide">
            {position.title}
          </h3>
          <p className="font-body text-mid/50 text-xs mt-0.5">
            Candidate Grade:{" "}
            {Array.isArray(position.candidateGrade)
              ? `Grades ${position.candidateGrade[0]}–${position.candidateGrade[position.candidateGrade.length - 1]}`
              : `Grade ${position.candidateGrade}`}
          </p>
        </div>

        {/* Status pill */}
        {selectedCandidateId ? (
          <span className="shrink-0 inline-flex items-center gap-1.5 text-[10px] font-body tracking-[0.15em] uppercase border border-emerald-400/30 bg-emerald-400/10 text-emerald-400 px-2 py-1 rounded-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Selected
          </span>
        ) : skipped ? (
          <span className="shrink-0 inline-flex items-center gap-1.5 text-[10px] font-body tracking-[0.15em] uppercase border border-gold/30 bg-gold/10 text-gold/80 px-2 py-1 rounded-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            Unselected
          </span>
        ) : null}
      </div>

      {/* Candidate cards */}
      <div className="flex flex-wrap gap-3">
        {position.candidates.length === 0 ? (
          <p className="font-body text-mid/40 text-xs italic py-2">
            No candidates filed for this position.
          </p>
        ) : (
          position.candidates.map((c) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              selected={selectedCandidateId === c.id}
              onSelect={() =>
                onSelect(selectedCandidateId === c.id ? null : c.id)
              }
              disabled={disabled}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Abstention Modal ─────────────────────────────────────────────────
function AbstentionModal({
  skippedTitles,
  onConfirm,
  onBack,
  pending,
}: {
  skippedTitles: string[];
  onConfirm: () => void;
  onBack: () => void;
  pending: boolean;
}) {
  // Trap focus inside modal
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy-deep/80 backdrop-blur-sm"
        onClick={onBack}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-navy border border-white/15 rounded-sm shadow-2xl">
        {/* Gold top border accent */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gold/60 rounded-t-sm" />

        <div className="p-6">
          <p className="font-body text-gold/60 text-[10px] tracking-[0.3em] uppercase mb-2">
            Review Your Ballot
          </p>
          <h2
            id="modal-title"
            className="font-heading font-bold text-white text-xl mb-4"
          >
            You have unselected positions
          </h2>

          <p className="font-body text-mid/80 text-sm mb-4 leading-relaxed">
            You have not made a selection for the following{" "}
            {skippedTitles.length === 1 ? "position" : "positions"}:
          </p>

          {/* Skipped list */}
          <ul className="space-y-1.5 mb-5">
            {skippedTitles.map((title) => (
              <li
                key={title}
                className="flex items-center gap-2.5 font-body text-sm text-white/70"
              >
                <span className="w-1 h-1 rounded-full bg-gold/50 shrink-0" />
                {title}
              </li>
            ))}
          </ul>

          <p className="font-body text-mid/60 text-xs leading-relaxed border-t border-white/8 pt-4 mb-6">
            Submitting without a selection will be noted in your ballot. You
            may go back to make a selection, or continue to submit.
          </p>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="button"
              onClick={onBack}
              disabled={pending}
              className="flex-1 py-3 border border-white/15 text-white/60 font-heading text-sm tracking-[0.15em] uppercase hover:border-white/30 hover:text-white/80 transition-colors rounded-sm disabled:opacity-40"
            >
              Go Back
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={onConfirm}
              disabled={pending}
              className="flex-1 py-3 bg-gold text-navy font-heading font-bold text-sm tracking-[0.15em] uppercase hover:bg-gold/90 transition-colors rounded-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {pending ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Submitting…
                </>
              ) : (
                "Submit Anyway"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Ballot Client ───────────────────────────────────────────────
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

  const handleSubmitClick = () => {
    if (!allSelected) {
      setShowModal(true);
      return;
    }
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
      const result = await submitBallot(
        finalSelections,
        positions.map((p) => p.id)
      );
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

  const progressPct =
    totalPositions > 0 ? (selectedCount / totalPositions) * 100 : 0;

  return (
    <>
      <div className="min-h-screen bg-navy-deep flex flex-col">
        {/* ── Header ── */}
        <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-deep/95 backdrop-blur-sm px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-gold rounded-full" />
              <div>
                <p className="font-body text-gold/50 text-[10px] tracking-[0.3em] uppercase">
                  OLPS COMELEC
                </p>
                <p className="font-heading font-bold text-white text-sm">
                  {electionName}
                </p>
              </div>
            </div>

            {/* Progress + voter info */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="font-body text-mid/50 text-[10px] tracking-[0.15em] uppercase">
                  {division} · Gr.{gradeLevel} · Sec.{section}
                </p>
                <p className="font-mono text-mid/40 text-[10px]">
                  {selectedCount}/{totalPositions} selected
                </p>
              </div>

              {/* Circular progress */}
              <div className="relative w-10 h-10 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle
                    cx="18" cy="18" r="15"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18" cy="18" r="15"
                    fill="none"
                    stroke="#F5C000"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${progressPct * 0.942} 94.2`}
                    className="transition-all duration-300"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] text-gold">
                  {Math.round(progressPct)}%
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ── Ballot body ── */}
        <main className="flex-1 px-6 py-8">
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Ballot header */}
            <div className="mb-8">
              <p className="font-tagline text-white/25 text-sm italic mb-1">
                VOX POPULI VOX DEI
              </p>
              <h1 className="font-display text-4xl sm:text-5xl text-white uppercase tracking-wide">
                Official Ballot
              </h1>
              <p className="font-body text-mid/60 text-sm mt-2">
                Select one candidate per position. You may leave positions blank — unselected positions will be recorded as abstentions.
              </p>
            </div>

            {/* Server error */}
            {serverError && (
              <div className="border border-red-500/30 bg-red-500/8 rounded-sm px-4 py-3 text-red-300 font-body text-sm">
                {serverError}
              </div>
            )}

            {/* Position rows */}
            {positions.map((position) => (
              <PositionRow
                key={position.id}
                position={position}
                selectedCandidateId={selections[position.id] ?? null}
                onSelect={(candidateId) =>
                  handleSelect(position.id, candidateId)
                }
                disabled={isPending}
                skipped={showModal && !selections[position.id]}
              />
            ))}

            {/* Empty state */}
            {positions.length === 0 && (
              <div className="border border-white/8 rounded-sm p-10 text-center">
                <p className="font-body text-mid/40 text-sm">
                  No positions found for your grade level.
                </p>
              </div>
            )}
          </div>
        </main>

        {/* ── Sticky submit footer ── */}
        <div className="sticky bottom-0 border-t border-white/10 bg-navy-deep/95 backdrop-blur-sm px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            {/* Summary */}
            <div>
              {allSelected ? (
                <p className="font-body text-emerald-400/80 text-xs">
                  All {totalPositions} positions selected
                </p>
              ) : (
                <p className="font-body text-mid/50 text-xs">
                  {totalPositions - selectedCount} position
                  {totalPositions - selectedCount !== 1 ? "s" : ""} unselected
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmitClick}
              disabled={isPending}
              className="px-8 py-3 bg-gold text-navy font-heading font-bold text-sm tracking-[0.2em] uppercase hover:bg-gold/90 active:bg-gold/80 transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Submitting…
                </>
              ) : (
                "Submit Ballot"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Abstention Modal ── */}
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
