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

const TWO_COL_THRESHOLD = 4;

// ── Candidate Row ─────────────────────────────────────────────────────
function CandidateRow({
  candidate,
  selected,
  onSelect,
  disabled,
  index,
}: {
  candidate: Candidate;
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
  index: number;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={`
        group w-full flex items-center gap-3 px-4 py-[9px]
        border-b border-ballot-rule last:border-b-0
        transition-colors duration-100 text-left
        ${selected
          ? "bg-navy/[0.06] shadow-[inset_3px_0_0_#F5C000]"
          : "bg-transparent hover:bg-ballot-hover"
        }
        ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
      `}
    >
      <span
        className={`
          shrink-0 w-[22px] h-[22px] rounded-full border-2 transition-all duration-150
          ${selected
            ? "bg-navy border-navy"
            : "bg-transparent border-navy/35 group-hover:border-navy/70"
          }
        `}
        aria-hidden="true"
      />
      <span
        className={`
          font-ballot-mono text-[10px] w-[18px] text-right shrink-0
          ${selected ? "text-navy/50" : "text-navy/30"}
        `}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <span
        className={`
          flex-1 font-ballot-serif text-[13px] uppercase tracking-[0.06em]
          min-w-0 overflow-hidden text-ellipsis whitespace-nowrap
          ${selected ? "text-navy font-semibold" : "text-navy/72"}
        `}
      >
        {candidate.fullName}
      </span>
      <span
        className={`
          shrink-0 font-ballot-mono text-[9px] tracking-[0.16em]
          ${selected ? "text-navy/50" : "text-navy/25"}
        `}
      >
        Gr.{candidate.gradeLevel}
      </span>
    </button>
  );
}

// ── Position Section ──────────────────────────────────────────────────
function PositionSection({
  position,
  selectedCandidateId,
  onSelect,
  disabled,
  skipped,
  positionNumber,
}: {
  position: Position;
  selectedCandidateId: string | null;
  onSelect: (candidateId: string | null) => void;
  disabled: boolean;
  skipped: boolean;
  positionNumber: number;
}) {
  const twoCol = position.candidates.length >= TWO_COL_THRESHOLD;

  return (
    <section
      className={`
        border-2 bg-ballot-paper transition-all duration-200
        ${skipped
          ? "border-amber-600 shadow-[inset_3px_0_0_theme(colors.amber.600)]"
          : "border-navy"
        }
      `}
      aria-label={`Position: ${position.title}`}
    >
      <div className="flex items-stretch border-b-2 border-navy">
        <div className="w-11 min-w-[44px] flex items-center justify-center bg-navy shrink-0">
          <span className="font-ballot-mono text-[11px] font-bold tracking-[0.08em] text-gold">
            {String(positionNumber).padStart(2, "0")}
          </span>
        </div>
        <div className="flex-1 px-3 py-[9px] min-w-0">
          <h3 className="font-ballot-serif font-bold text-[13px] uppercase tracking-[0.14em] text-navy">
            {position.title}
          </h3>
          <p className="font-ballot-mono text-[9px] tracking-[0.14em] uppercase text-navy/40 mt-0.5">
            Vote for one ·{" "}
            {Array.isArray(position.candidateGrade)
              ? `Candidate Grades ${position.candidateGrade[0]}–${position.candidateGrade[position.candidateGrade.length - 1]}`
              : `Candidate Grade ${position.candidateGrade}`}
          </p>
        </div>
        <div className="flex items-center pr-3 shrink-0">
          {selectedCandidateId ? (
            <span className="font-ballot-mono text-[9px] tracking-[0.2em] uppercase font-bold px-[7px] py-[3px] border-[1.5px] border-navy/40 bg-navy/[0.06] text-navy">
              ✓ Voted
            </span>
          ) : skipped ? (
            <span className="font-ballot-mono text-[9px] tracking-[0.2em] uppercase font-bold px-[7px] py-[3px] border-[1.5px] border-amber-600/40 bg-amber-50 text-amber-700">
              Blank
            </span>
          ) : null}
        </div>
      </div>

      {position.candidates.length === 0 ? (
        <p className="font-ballot-mono text-navy/40 text-xs italic p-4 tracking-wide">
          No candidates filed for this position.
        </p>
      ) : (
        <div className={twoCol ? "grid grid-cols-2 max-sm:grid-cols-1" : "grid grid-cols-1"}>
          {position.candidates.map((c, idx) => (
            <div
              key={c.id}
              className={twoCol ? "border-r border-ballot-rule even:border-r-0" : undefined}
            >
              <CandidateRow
                candidate={c}
                index={idx}
                selected={selectedCandidateId === c.id}
                onSelect={() => onSelect(selectedCandidateId === c.id ? null : c.id)}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Abstention Modal ──────────────────────────────────────────────────
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
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { confirmRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onBack();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onBack, pending]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{ colorScheme: "light", color: "#1B1F5E" }}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={() => !pending && onBack()}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-md bg-ballot-paper border-2 border-navy shadow-2xl"
        style={{ borderTop: "3px solid #F5C000" }}
      >
        <div className="bg-navy px-4 py-[10px] flex items-center gap-2">
          <div className="w-0.5 h-4 bg-gold rounded-sm" />
          <p className="font-ballot-mono text-[10px] tracking-[0.3em] uppercase text-gold/70">
            Ballot Review Notice
          </p>
        </div>
        <div className="p-[18px] pb-4">
          <h2
            id="modal-title"
            className="font-ballot-serif font-bold text-[17px] uppercase tracking-[0.1em] text-navy mb-1"
          >
            Unselected Positions
          </h2>
          <p className="font-ballot-mono text-[11px] tracking-[0.1em] uppercase text-navy/45 mb-3">
            The following positions have no selection:
          </p>
          <div className="border-[1.5px] border-navy mb-3">
            {skippedTitles.map((title, i) => (
              <div
                key={title}
                className={`
                  flex items-center gap-[10px] px-3 py-2
                  font-ballot-serif text-[13px] text-navy
                  ${i < skippedTitles.length - 1 ? "border-b border-ballot-rule" : ""}
                `}
              >
                <div className="w-[14px] h-[14px] border-2 border-navy/28 rounded-sm shrink-0" aria-hidden="true" />
                {title}
              </div>
            ))}
          </div>
          <p className="font-ballot-mono text-[11px] leading-relaxed tracking-[0.04em] text-navy/45 border-t border-ballot-rule pt-3 mb-4">
            Unselected positions will be recorded as abstentions. You may go
            back to complete your ballot, or submit as-is.
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <button
              type="button"
              onClick={onBack}
              disabled={pending}
              className="flex-1 py-[10px] border-[1.5px] border-navy/25 bg-transparent text-navy font-ballot-mono text-[11px] tracking-[0.18em] uppercase hover:border-navy/60 opacity-60 hover:opacity-100 transition-opacity disabled:opacity-30"
            >
              ← Go Back
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={onConfirm}
              disabled={pending}
              className="flex-1 py-[10px] bg-gold border-none text-navy font-ballot-mono text-[11px] font-bold tracking-[0.18em] uppercase hover:opacity-85 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {pending ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Submitting…
                </>
              ) : (
                "Submit Ballot →"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Ballot Client ────────────────────────────────────────────────
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
      const result = await submitBallot(finalSelections, positions.map((p) => p.id));
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

  const progressPct = totalPositions > 0 ? (selectedCount / totalPositions) * 100 : 0;

  return (
    <>
      {/*
        style={{ colorScheme: "light" }} — prevents the browser from applying
        dark mode to native UI elements (scrollbars, focus outlines, etc.)
        caused by className="dark" on <html>. All ballot token colors are
        explicit hex values and are NOT affected by shadcn CSS variables,
        so this single override is all that is needed.
      */}
      <div className="min-h-screen bg-ballot-bg text-navy flex flex-col" style={{ colorScheme: "light", color: "#1B1F5E" }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 bg-navy border-b-[3px] border-gold">
          <div className="flex items-center justify-between px-4 py-[5px] border-b border-gold/15">
            <span className="font-ballot-mono text-[9px] tracking-[0.28em] uppercase text-gold/45">
              OLPS COMELEC · Official Election Ballot
            </span>
            <span className="font-ballot-mono text-[9px] tracking-[0.28em] uppercase text-gold/45">
              {division}
            </span>
          </div>
          <div className="max-w-2xl mx-auto w-full flex items-center justify-between px-4 py-[10px] gap-3">
            <div className="flex items-center gap-[10px] min-w-0">
              <div className="w-[3px] h-8 bg-gold rounded-sm shrink-0" />
              <div className="min-w-0">
                <p className="font-ballot-serif font-bold text-[14px] uppercase tracking-[0.1em] text-white whitespace-nowrap overflow-hidden text-ellipsis">
                  {electionName}
                </p>
                <p className="font-ballot-mono text-[9px] tracking-[0.18em] uppercase text-white/40 mt-0.5">
                  Official Ballot
                </p>
              </div>
            </div>
            <div className="flex items-center gap-[10px] shrink-0">
              <span className="hidden sm:block font-ballot-mono text-[9px] tracking-[0.16em] uppercase px-2 py-[3px] border border-gold/30 text-gold/70 whitespace-nowrap">
                Gr.{gradeLevel} · Sec.{section}
              </span>
              <div
                className="relative w-[72px] h-[26px] border-[1.5px] border-gold/35 bg-gold/[0.06] overflow-hidden"
                role="progressbar"
                aria-valuenow={selectedCount}
                aria-valuemin={0}
                aria-valuemax={totalPositions}
                aria-label={`${selectedCount} of ${totalPositions} positions voted`}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-gold/18 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center font-ballot-mono text-[10px] tracking-[0.14em] text-gold/85">
                  {Math.round(progressPct)}%
                </span>
              </div>
            </div>
          </div>
        </header>

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

        {/* ── Sticky footer ──────────────────────────────────────── */}
        <footer className="sticky bottom-0 bg-navy border-t-[3px] border-gold shadow-[0_-2px_12px_rgba(0,0,0,0.2)]">
          <div className="max-w-2xl mx-auto px-4 py-[10px] flex items-center justify-between gap-4">
            {allSelected ? (
              <p className="font-ballot-mono text-[10px] tracking-[0.16em] uppercase text-gold/85">
                ✓ All {totalPositions} positions completed
              </p>
            ) : (
              <p className="font-ballot-mono text-[10px] tracking-[0.16em] uppercase text-white/38">
                {remaining} position{remaining !== 1 ? "s" : ""} remaining
              </p>
            )}
            <button
              type="button"
              onClick={handleSubmitClick}
              disabled={isPending}
              className="px-[22px] py-[10px] bg-gold text-navy font-ballot-mono text-[11px] font-bold tracking-[0.22em] uppercase hover:opacity-88 active:opacity-75 transition-opacity disabled:opacity-45 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Submitting…
                </>
              ) : (
                "Submit Ballot →"
              )}
            </button>
          </div>
        </footer>
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
