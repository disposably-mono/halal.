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
      className="w-full bg-gold text-navy font-heading font-bold text-[17px] tracking-[0.2em] uppercase py-[17px] rounded-sm hover:bg-gold/90 active:bg-gold/80 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gold/35 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-[10px]"
    >
      {isPending ? (
        <>
          <Spinner className="w-[19px] h-[19px]" />
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
      <div className="text-center mb-[45px]">
        <p className="font-tagline text-white/35 text-[17px] italic mb-[10px]">
          VOX POPULI VOX DEI
        </p>
        <h1 className="font-display text-[54px] text-white tracking-wide mb-[14px] uppercase">
          Cast Your Vote
        </h1>
        <p className="font-body text-mid/60 text-[17px] leading-[27px]">
          Enter the details from your printed voter slip to receive your ballot.
        </p>
      </div>

      <div className="flex items-center justify-center gap-[19px] mb-[45px]">
        <div className="w-[36px] h-px bg-gold/40" />
        <span className="font-body text-gold/40 text-[12px] tracking-[0.3em] uppercase">
          Voter Login
        </span>
        <div className="w-[36px] h-px bg-gold/40" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-[19px]">

        {/* Student ID */}
        <div className="space-y-[10px]">
          <label
            htmlFor="studentId"
            className="block font-body text-white/60 text-[14px] tracking-[0.25em] uppercase"
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
            className={`w-full bg-navy border rounded-sm px-[19px] py-[17px] font-mono text-[20px] text-white placeholder-white/15 tracking-[0.15em] outline-hidden transition-all focus:border-gold/50 focus:ring-1 focus:ring-gold/20 focus-visible:ring-2 focus-visible:ring-gold/25 ${errorBorderClass}`}
          />
        </div>

        {/* Control Number */}
        <div className="space-y-[10px]">
          <label
            htmlFor="voterCode"
            className="block font-body text-white/60 text-[14px] tracking-[0.25em] uppercase"
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
            className={`w-full bg-navy border rounded-sm px-[19px] py-[17px] font-mono text-[20px] text-white placeholder-white/15 tracking-[0.15em] uppercase outline-hidden transition-all focus:border-gold/50 focus:ring-1 focus:ring-gold/20 focus-visible:ring-2 focus-visible:ring-gold/25 ${errorBorderClass}`}
          />
        </div>

        {/* Error / helper */}
        {!state && (
          <p id="vote-login-helper" className="font-body text-mid/60 text-[14px] pt-[5px]">
            Both fields are required to continue.
          </p>
        )}
        {state?.error && (
          <div
            id="vote-login-error"
            role="alert"
            className={`flex items-start gap-[12px] rounded-sm border px-[17px] py-[14px] ${state.error === "ALREADY_VOTED"
                ? "border-maroon/40 bg-maroon/10 text-red-300"
                : state.error === "ELECTION_NOT_OPEN"
                  ? "border-gold/30 bg-gold/8 text-gold/80"
                  : "border-red-500/30 bg-red-500/8 text-red-300"
              }`}
          >
            <span className="font-mono text-[17px] mt-[2px] opacity-70 shrink-0">
              {ERROR_ICONS[state.error] ?? "!"}
            </span>
            <p className="font-body text-[14px] leading-relaxed">{state.message}</p>
          </div>
        )}

        {submitError && (
          <p role="alert" className="font-body text-[14px] text-red-300">{submitError}</p>
        )}

        <SubmitButton isPending={isPending} />
      </form>

      {/* Format hints */}
      <div className="mt-[36px] border border-white/5 rounded-sm p-[19px] space-y-[19px]">
        <div>
          <p className="font-body text-mid/50 text-[13px] tracking-[0.2em] uppercase mb-[10px]">
            Student ID Format
          </p>
          <span className="font-mono text-[14px] text-gold/60 bg-gold/10 px-[7px] py-[2px] rounded-sm tracking-widest">
            0000-0000
          </span>
        </div>
        <div className="border-t border-white/5 pt-[19px]">
          <p className="font-body text-mid/50 text-[13px] tracking-[0.2em] uppercase mb-[10px]">
            Control Number Format
          </p>
          <div className="flex items-center gap-[0px] font-mono text-[14px]">
            <span className="text-gold/70 bg-gold/10 px-[7px] py-[2px] rounded-sm">YY</span>
            <span className="text-white/30 px-[2px]">·</span>
            <span className="text-gold/70 bg-gold/10 px-[7px] py-[2px] rounded-sm">GG</span>
            <span className="text-white/30 px-[2px]">·</span>
            <span className="text-gold/70 bg-gold/10 px-[7px] py-[2px] rounded-sm">S</span>
            <span className="text-white/30 px-[2px]">·</span>
            <span className="text-gold/70 bg-gold/10 px-[7px] py-[2px] rounded-sm">NNN</span>
          </div>
          <p className="font-body text-mid/40 text-[12px] mt-[10px]">
            Year · Grade · Section · Sequence
          </p>
        </div>
      </div>

    </div>
  );
}
