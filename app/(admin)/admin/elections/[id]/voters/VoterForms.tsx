"use client";

import { useServerActionForm } from "@/lib/client/use-server-action-form";
import { addVotersFromCSV, addVoterManual } from "./actions";
import type { CSVImportResult, ManualAddResult } from "./actions";
import { AdminInput, AdminTextarea, Field } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VoterFormsProps {
  electionId: string;
  schoolYear: number;
  isFinalized: boolean;
}

// ─── Submit button ────────────────────────────────────────────────────────────

function SubmitButton({
  label,
  loadingLabel,
  disabled,
  isPending,
  variant = "primary",
}: {
  label: string;
  loadingLabel: string;
  disabled?: boolean;
  isPending: boolean;
  variant?: "primary" | "ghost";
}) {
  return (
    <Button
      type="submit"
      disabled={isPending || disabled}
      variant={variant === "primary" ? "adminPrimary" : "adminGhost"}
      size="adminMd"
    >
      {isPending ? loadingLabel : label}
    </Button>
  );
}

// ─── CSV Upload Form ──────────────────────────────────────────────────────────

export function CSVUploadForm({ electionId, schoolYear, isFinalized }: VoterFormsProps) {
  const { state: result, isPending, handleSubmit } = useServerActionForm<CSVImportResult | null>(
    addVotersFromCSV,
    null,
    { shouldRefresh: (nextResult) => Boolean(nextResult && nextResult.added > 0) },
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="electionId" value={electionId} />
      <input type="hidden" name="schoolYear" value={schoolYear} />

      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] text-white/50">
          Format: <code className="font-mono text-white/55">studentId, gradeLevel, section</code>
        </p>
        {isFinalized && (
          <span className="text-[9px] font-semibold uppercase tracking-wider text-gold/80">
            Locked
          </span>
        )}
      </div>

      <Field
        label="CSV rows"
        htmlFor="csvText"
        required
        error={result && result.added === 0 && result.rejected === 0 && result.reasons.length > 0 ? result.reasons[0] : undefined}
      >
        <AdminTextarea
          id="csvText"
          name="csvText"
          rows={5}
          placeholder={`studentId,gradeLevel,section\n2025-001,11,A\n2025-002,11,B`}
          required
          disabled={isFinalized}
          className="resize-none leading-relaxed"
        />
      </Field>

      <SubmitButton
        label="Import Voters"
        loadingLabel="Importing…"
        disabled={isFinalized}
        isPending={isPending}
      />

      {result && (
        <div
          className={`rounded-[8px] border px-4 py-3 text-[11px] ${result.rejected > 0 || result.skippedDuplicates > 0
              ? "border-gold/20 bg-gold/[0.07]"
              : "border-emerald-500/20 bg-emerald-500/[0.07]"
            }`}
        >
          {result.added > 0 && (
            <p className="text-emerald-300">✓ {result.added} voters added.</p>
          )}
          {result.reasons.slice(result.added === 0 && result.rejected === 0 ? 1 : 0).map((reason, i) => (
            <p key={i} className="mt-0.5 text-gold">
              ⚠ {reason}
            </p>
          ))}
          {result.added === 0 && result.rejected === 0 && result.skippedDuplicates === 0 && (
            <p className="text-white/50">No new voters to import.</p>
          )}
        </div>
      )}
    </form>
  );
}

// ─── Manual Add Form ──────────────────────────────────────────────────────────

export function ManualAddForm({ electionId, schoolYear, isFinalized }: VoterFormsProps) {
  const { state: result, isPending, handleSubmit } = useServerActionForm<ManualAddResult | null>(
    addVoterManual,
    null,
    { shouldRefresh: (nextResult) => Boolean(nextResult?.success) },
  );

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[1fr_80px_96px_auto]">
        <input type="hidden" name="electionId" value={electionId} />
        <input type="hidden" name="schoolYear" value={schoolYear} />

        <Field label="Student ID" htmlFor="studentId" required>
          <AdminInput
            id="studentId"
            name="studentId"
            placeholder="e.g. 2025-0001"
            required
            disabled={isFinalized}
          />
        </Field>

        <Field label="Grade" htmlFor="gradeLevel" required>
          <AdminInput
            id="gradeLevel"
            name="gradeLevel"
            placeholder="11"
            required
            disabled={isFinalized}
          />
        </Field>

        <Field label="Section" htmlFor="section" required>
          <AdminInput
            id="section"
            name="section"
            placeholder="A"
            required
            disabled={isFinalized}
          />
        </Field>

        <SubmitButton
          label="+ Add"
          loadingLabel="Adding…"
          disabled={isFinalized}
          isPending={isPending}
        />
      </form>

      {result && !result.success && (
        <p className="text-[11px] text-red-400">✗ {result.error}</p>
      )}
      {result?.success && (
        <p className="text-[11px] text-emerald-400">✓ Voter added successfully.</p>
      )}
    </div>
  );
}
