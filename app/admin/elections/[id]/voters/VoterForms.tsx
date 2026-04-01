"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addVotersFromCSV, addVoterManual } from "./actions";
import type { CSVImportResult, ManualAddResult } from "./actions";

interface VoterFormsProps {
  electionId: string;
  schoolYear: number;
}

function SubmitButton({ label, loadingLabel }: { label: string; loadingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-gold text-navy hover:bg-gold/90 font-semibold disabled:opacity-50"
    >
      {pending ? loadingLabel : label}
    </Button>
  );
}

export function CSVUploadForm({ electionId, schoolYear }: VoterFormsProps) {
  const [result, action] = useFormState<CSVImportResult | null, FormData>(
    addVotersFromCSV,
    null
  );

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-base">Upload Voter List (CSV)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-white/40 text-xs">
          Format: <span className="font-mono text-white/60">studentId, gradeLevel, section</span>
        </p>
        <form action={action} className="space-y-3">
          <input type="hidden" name="electionId" value={electionId} />
          <input type="hidden" name="schoolYear" value={schoolYear} />
          <textarea
            name="csvText"
            rows={6}
            placeholder={`studentId,gradeLevel,section\n2025-001,11,A\n2025-002,11,B`}
            className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white text-xs font-mono placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
            required
          />
          <SubmitButton label="Import Voters" loadingLabel="Importing..." />
        </form>

        {result && (
          <div className={`rounded-md px-4 py-3 text-sm mt-3 ${result.rejected > 0 ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-green-500/10 border border-green-500/20"}`}>
            {result.added > 0 && <p className="text-green-300">✓ {result.added} voters added.</p>}
            {result.reasons.map((reason, i) => (
              <p key={i} className="text-yellow-300 text-xs">⚠ {reason}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ManualAddForm({ electionId, schoolYear }: VoterFormsProps) {
  const [result, action] = useFormState<ManualAddResult | null, FormData>(
    addVoterManual,
    null
  );

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-base">Add Single Voter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form action={action} className="flex gap-2 flex-wrap">
          <input type="hidden" name="electionId" value={electionId} />
          <input type="hidden" name="schoolYear" value={schoolYear} />
          <Input name="studentId" placeholder="Student ID" className="bg-white/10 border-white/20 text-white text-sm h-9 flex-1 min-w-32" required />
          <Input name="gradeLevel" placeholder="Grade" className="bg-white/10 border-white/20 text-white text-sm h-9 w-20" required />
          <Input name="section" placeholder="Section" className="bg-white/10 border-white/20 text-white text-sm h-9 w-24" required />
          <SubmitButton label="+ Add" loadingLabel="Adding..." />
        </form>
        {result && !result.success && <p className="text-red-400 text-xs mt-1">✗ {result.error}</p>}
        {result && result.success && <p className="text-green-400 text-xs mt-1">✓ Voter added successfully.</p>}
      </CardContent>
    </Card>
  );
}
