"use client";

import { useFormState, useFormStatus } from "react-dom";
import { addVotersFromCSV, addVoterManual } from "./actions";
import type { CSVImportResult, ManualAddResult } from "./actions";
import { AdminInput, AdminTextarea } from "@/components/admin/ui";
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
  variant = "primary",
}: {
  label: string;
  loadingLabel: string;
  disabled?: boolean;
  variant?: "primary" | "ghost";
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      variant={variant === "primary" ? "adminPrimary" : "adminGhost"}
      size="adminMd"
    >
      {pending ? loadingLabel : label}
    </Button>
  );
}

// ─── CSV Upload Form ──────────────────────────────────────────────────────────

export function CSVUploadForm({ electionId, schoolYear, isFinalized }: VoterFormsProps) {
  const [result, action] = useFormState<CSVImportResult | null, FormData>(
    addVotersFromCSV,
    null
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="electionId" value={electionId} />
      <input type="hidden" name="schoolYear" value={schoolYear} />

      <div className="flex items-center justify-between">
        <label className="text-[10px] text-white/40">
          Format:{" "}
          <code className="font-mono text-white/55">
            studentId, gradeLevel, section
          </code>
        </label>
        {isFinalized && (
          <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-400/80">
            Locked
          </span>
        )}
      </div>

      <AdminTextarea
        name="csvText"
        rows={5}
        placeholder={`studentId,gradeLevel,section\n2025-001,11,A\n2025-002,11,B`}
        required
        disabled={isFinalized}
        className="resize-none leading-relaxed"
      />

      <SubmitButton label="Import Voters" loadingLabel="Importing…" disabled={isFinalized} />

      {result && (
        <div
          className={`rounded-[8px] border px-4 py-3 text-[11px] ${result.rejected > 0 || result.skippedDuplicates > 0
              ? "border-yellow-500/20 bg-yellow-500/[0.07]"
              : "border-emerald-500/20 bg-emerald-500/[0.07]"
            }`}
        >
          {result.added > 0 && (
            <p className="text-emerald-300">✓ {result.added} voters added.</p>
          )}
          {result.reasons.map((reason, i) => (
            <p key={i} className="mt-0.5 text-yellow-300">
              ⚠ {reason}
            </p>
          ))}
          {result.added === 0 && result.rejected === 0 && result.skippedDuplicates === 0 && (
            <p className="text-white/40">No new voters to import.</p>
          )}
        </div>
      )}
    </form>
  );
}

// ─── Manual Add Form ──────────────────────────────────────────────────────────

export function ManualAddForm({ electionId, schoolYear, isFinalized }: VoterFormsProps) {
  const [result, action] = useFormState<ManualAddResult | null, FormData>(
    addVoterManual,
    null
  );

  return (
    <div className="flex flex-col gap-2">
      <form action={action} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="electionId" value={electionId} />
        <input type="hidden" name="schoolYear" value={schoolYear} />

        <div className="flex flex-1 flex-col gap-[5px]" style={{ minWidth: 120 }}>
          <label className="text-[10px] text-white/40">Student ID</label>
          <AdminInput
            name="studentId"
            placeholder="e.g. 2025-0001"
            required
            disabled={isFinalized}
          />
        </div>

        <div className="flex flex-col gap-[5px]" style={{ width: 72 }}>
          <label className="text-[10px] text-white/40">Grade</label>
          <AdminInput
            name="gradeLevel"
            placeholder="11"
            required
            disabled={isFinalized}
          />
        </div>

        <div className="flex flex-col gap-[5px]" style={{ width: 84 }}>
          <label className="text-[10px] text-white/40">Section</label>
          <AdminInput
            name="section"
            placeholder="A"
            required
            disabled={isFinalized}
          />
        </div>

        <SubmitButton label="+ Add" loadingLabel="Adding…" disabled={isFinalized} />
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
