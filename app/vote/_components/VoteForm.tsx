"use client";

import { useEffect, useRef } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useServerActionForm } from "@/lib/client/use-server-action-form";
import { validateVoterCode, VoterLoginResult } from "../actions";

const ERROR_ICONS: Record<string, string> = {
  INVALID_CREDENTIALS: "⊘",
  ALREADY_VOTED: "✓",
  ELECTION_NOT_OPEN: "◷",
  UNKNOWN: "!",
};

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="w-full bg-gold text-navy font-heading font-bold text-sm tracking-[0.2em] uppercase py-3.5 rounded-sm hover:bg-gold/90 active:bg-gold/80 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gold/35 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {isPending ? (
        <>
          <Spinner className="w-4 h-4" />
          Verifying…
        </>
      ) : (
        "Proceed to Ballot"
      )}
    </button>
  );
}

export function VoteForm() {
  const { state, isPending, submitError, handleSubmit } = useServerActionForm<VoterLoginResult | null>(
    validateVoterCode,
    null,
  );

  const studentIdRef = useRef<HTMLInputElement>(null);
  const voterCodeRef = useRef<HTMLInputElement>(null);

  // Focus student ID on mount
  useEffect(() => {
    studentIdRef.current?.focus();
  }, []);

  // Auto-format student ID: digits only, insert hyphen after position 4
  const handleStudentIdInput = () => {
    const input = studentIdRef.current;
    if (!input) return;
    const raw = input.value.replace(/\D/g, "").slice(0, 8);
    input.value = raw.length > 4 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw;
  };

  // Auto-uppercase control number
  const handleVoterCodeInput = () => {
    const input = voterCodeRef.current;
    if (!input) return;
    const pos = input.selectionStart ?? 0;
    input.value = input.value.toUpperCase();
    input.setSelectionRange(pos, pos);
  };

  const hasError = !!state?.error;
  const errorBorderClass = hasError ? "border-red-500/40 focus:border-red-400/60" : "border-white/10";
  const fieldDescriptionId = hasError ? "vote-login-error" : "vote-login-helper";

  return (
    <div className="w-full max-sm:max-w-xs sm:max-w-sm">

      {/* Branding */}
      <div className="text-center mb-10">
        <p className="font-tagline text-white/35 text-sm italic mb-2">
          VOX POPULI VOX DEI
        </p>
        <h1 className="font-display text-5xl text-white tracking-wide mb-3 uppercase">
          Cast Your Vote
        </h1>
        <p className="font-body text-mid/60 text-sm leading-6">
          Enter the details from your printed voter slip to receive your ballot.
        </p>
      </div>

      <div className="flex items-center justify-center gap-4 mb-10">
        <div className="w-8 h-px bg-gold/40" />
        <span className="font-body text-gold/40 text-[10px] tracking-[0.3em] uppercase">
          Voter Login
        </span>
        <div className="w-8 h-px bg-gold/40" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Student ID */}
        <div className="space-y-2">
          <label
            htmlFor="studentId"
            className="block font-body text-white/60 text-xs tracking-[0.25em] uppercase"
          >
            Student ID
          </label>
          <input
            ref={studentIdRef}
            id="studentId"
            name="studentId"
            type="text"
            inputMode="numeric"
            maxLength={9}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onInput={handleStudentIdInput}
            placeholder="0000-0000"
            aria-invalid={hasError}
            aria-describedby={fieldDescriptionId}
            className={`w-full bg-navy border rounded-sm px-4 py-3.5 font-mono text-lg text-white placeholder-white/15 tracking-[0.15em] outline-hidden transition-all focus:border-gold/50 focus:ring-1 focus:ring-gold/20 focus-visible:ring-2 focus-visible:ring-gold/25 ${errorBorderClass}`}
          />
        </div>

        {/* Control Number */}
        <div className="space-y-2">
          <label
            htmlFor="voterCode"
            className="block font-body text-white/60 text-xs tracking-[0.25em] uppercase"
          >
            Control Number
          </label>
          <input
            ref={voterCodeRef}
            id="voterCode"
            name="voterCode"
            type="text"
            maxLength={8}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onInput={handleVoterCodeInput}
            placeholder="e.g. 2611A001"
            aria-invalid={hasError}
            aria-describedby={fieldDescriptionId}
            className={`w-full bg-navy border rounded-sm px-4 py-3.5 font-mono text-lg text-white placeholder-white/15 tracking-[0.15em] uppercase outline-hidden transition-all focus:border-gold/50 focus:ring-1 focus:ring-gold/20 focus-visible:ring-2 focus-visible:ring-gold/25 ${errorBorderClass}`}
          />
        </div>

        {/* Error / helper */}
        {!state && (
          <p id="vote-login-helper" className="font-body text-mid/60 text-xs pt-1">
            Both fields are required to continue.
          </p>
        )}
        {state?.error && (
          <div
            id="vote-login-error"
            role="alert"
            className={`flex items-start gap-2.5 rounded-sm border px-3.5 py-3 ${state.error === "ALREADY_VOTED"
                ? "border-maroon/40 bg-maroon/10 text-red-300"
                : state.error === "ELECTION_NOT_OPEN"
                  ? "border-gold/30 bg-gold/8 text-gold/80"
                  : "border-red-500/30 bg-red-500/8 text-red-300"
              }`}
          >
            <span className="font-mono text-sm mt-0.5 opacity-70 shrink-0">
              {ERROR_ICONS[state.error] ?? "!"}
            </span>
            <p className="font-body text-xs leading-relaxed">{state.message}</p>
          </div>
        )}

        {submitError && (
          <p role="alert" className="font-body text-xs text-red-300">{submitError}</p>
        )}

        <SubmitButton isPending={isPending} />
      </form>

      {/* Format hints */}
      <div className="mt-8 border border-white/5 rounded-sm p-4 space-y-4">
        <div>
          <p className="font-body text-mid/50 text-[11px] tracking-[0.2em] uppercase mb-2">
            Student ID Format
          </p>
          <span className="font-mono text-xs text-gold/60 bg-gold/10 px-1.5 py-0.5 rounded-sm tracking-widest">
            0000-0000
          </span>
        </div>
        <div className="border-t border-white/5 pt-4">
          <p className="font-body text-mid/50 text-[11px] tracking-[0.2em] uppercase mb-2">
            Control Number Format
          </p>
          <div className="flex items-center gap-0 font-mono text-xs">
            <span className="text-gold/70 bg-gold/10 px-1.5 py-0.5 rounded-sm">YY</span>
            <span className="text-white/30 px-0.5">·</span>
            <span className="text-gold/70 bg-gold/10 px-1.5 py-0.5 rounded-sm">GG</span>
            <span className="text-white/30 px-0.5">·</span>
            <span className="text-gold/70 bg-gold/10 px-1.5 py-0.5 rounded-sm">S</span>
            <span className="text-white/30 px-0.5">·</span>
            <span className="text-gold/70 bg-gold/10 px-1.5 py-0.5 rounded-sm">NNN</span>
          </div>
          <p className="font-body text-mid/40 text-[10px] mt-2">
            Year · Grade · Section · Sequence
          </p>
        </div>
      </div>

    </div>
  );
}
