"use client";

import { useFormState, useFormStatus } from "react-dom";
import { addVotersFromCSV, addVoterManual } from "./actions";
import type { CSVImportResult, ManualAddResult } from "./actions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VoterFormsProps {
  electionId: string;
  schoolYear: number;
  isFinalized: boolean; // Added to control form locking
}

// ─── Shared submit button ─────────────────────────────────────────────────────

function SubmitButton({
  label,
  loadingLabel,
  disabled,
}: {
  label: string;
  loadingLabel: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="h-9 shrink-0 rounded-lg bg-amber-400 px-4 text-[12px] font-semibold text-[#0b1220] transition-opacity hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30"
    >
      {pending ? loadingLabel : label}
    </button>
  );
}

// ─── CSV Upload Form ──────────────────────────────────────────────────────────

export function CSVUploadForm({ electionId, schoolYear, isFinalized }: VoterFormsProps) {
  const [result, action] = useFormState<CSVImportResult | null, FormData>(
    addVotersFromCSV,
    null
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-white/30">
          Format: <span className="font-mono text-white/50">studentId, gradeLevel, section</span>
        </p>
        {isFinalized && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
            Locked
          </span>
        )}
      </div>

      <form action={action} className="space-y-3">
        <input type="hidden" name="electionId" value={electionId} />
        <input type="hidden" name="schoolYear" value={schoolYear} />
        <textarea
          name="csvText"
          rows={5}
          placeholder={`studentId,gradeLevel,section\n2025-001,11,A\n2025-002,11,B`}
          required
          disabled={isFinalized}
          className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 py-2.5 font-mono text-[12px] text-white/80 placeholder:text-white/20 outline-none transition-colors focus:border-amber-400/50 focus:bg-amber-400/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
        />
        <SubmitButton
          label="Import Voters"
          loadingLabel="Importing…"
          disabled={isFinalized}
        />
      </form>

      {result && (
        <div
          className={`mt-3 rounded-lg border px-4 py-3 text-[12px] ${result.rejected > 0
              ? "border-yellow-500/20 bg-yellow-500/[0.08]"
              : "border-emerald-500/20 bg-emerald-500/[0.08]"
            }`}
        >
          {result.added > 0 && (
            <p className="text-emerald-300">✓ {result.added} voters added.</p>
          )}
          {result.reasons.map((reason, i) => (
            <p key={i} className="mt-0.5 text-[11px] text-yellow-300">
              ⚠ {reason}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Manual Add Form ──────────────────────────────────────────────────────────

export function ManualAddForm({ electionId, schoolYear, isFinalized }: VoterFormsProps) {
  const [result, action] = useFormState<ManualAddResult | null, FormData>(
    addVoterManual,
    null
  );

  return (
    <div className="space-y-3">
      <form action={action} className="flex flex-wrap gap-2">
        <input type="hidden" name="electionId" value={electionId} />
        <input type="hidden" name="schoolYear" value={schoolYear} />
        <input
          name="studentId"
          placeholder="Student ID"
          required
          disabled={isFinalized}
          className="h-9 min-w-[120px] flex-1 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-[13px] text-white/90 placeholder:text-white/25 outline-none transition-colors focus:border-amber-400/50 focus:bg-amber-400/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
        />
        <input
          name="gradeLevel"
          placeholder="Grade"
          required
          disabled={isFinalized}
          className="h-9 w-20 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-[13px] text-white/90 placeholder:text-white/25 outline-none transition-colors focus:border-amber-400/50 focus:bg-amber-400/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
        />
        <input
          name="section"
          placeholder="Section"
          required
          disabled={isFinalized}
          className="h-9 w-24 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-[13px] text-white/90 placeholder:text-white/25 outline-none transition-colors focus:border-amber-400/50 focus:bg-amber-400/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
        />
        <SubmitButton
          label="+ Add"
          loadingLabel="Adding…"
          disabled={isFinalized}
        />
      </form>
      {result && !result.success && (
        <p className="mt-1 text-[11px] text-red-400">✗ {result.error}</p>
      )}
      {result && result.success && (
        <p className="mt-1 text-[11px] text-emerald-400">✓ Voter added successfully.</p>
      )}
    </div>
  );
}
