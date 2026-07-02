"use client";

import Link from "next/link";
import { useServerActionForm } from "@/lib/client/use-server-action-form";
import { Button } from "@/components/ui/button";
import { AdminInput, Card, Field, ThemedSelect } from "@/components/admin/ui";
import {
  DIVISION_LABELS,
  DIVISION_ORDER,
  formatDivisionGrades,
} from "@/lib/ui/division-labels";
import { createElection } from "./actions";
import {
  INITIAL_CREATE_ELECTION_STATE,
  type CreateElectionFormState,
} from "./form-state";

export function NewElectionForm() {
  const { state, isPending, handleSubmit } = useServerActionForm<CreateElectionFormState>(
    createElection,
    INITIAL_CREATE_ELECTION_STATE,
  );
  const errors = state.errors ?? {};

  return (
    <Card title="Election Details">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Field
          label="Election Name"
          htmlFor="election-name"
          required
          error={errors.name}
        >
          <AdminInput
            id="election-name"
            name="name"
            type="text"
            placeholder="e.g. JHSSCT Elections AY 2025-2026"
            required
          />
        </Field>

        <Field
          label="Division"
          htmlFor="election-division"
          required
          error={errors.division}
        >
          <ThemedSelect
            name="division"
            required
            placeholder="Select a division"
            ariaLabel="Division"
            options={DIVISION_ORDER.map((division) => ({
              value: division,
              label: `${DIVISION_LABELS[division]} (${formatDivisionGrades(division)})`,
            }))}
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="Opens"
            htmlFor="scheduled-open"
            hint="Optional"
            error={errors.scheduledOpen}
          >
            <AdminInput id="scheduled-open" name="scheduledOpen" type="datetime-local" />
          </Field>
          <Field
            label="Closes"
            htmlFor="scheduled-close"
            hint="Optional"
            error={errors.scheduledClose}
          >
            <AdminInput id="scheduled-close" name="scheduledClose" type="datetime-local" />
          </Field>
        </div>

        <div className="h-px bg-white/[0.06]" />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button asChild variant="adminGhost" size="adminMd">
            <Link href="/admin">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isPending} variant="adminPrimary" size="adminMd">
            {isPending ? "Creating..." : "Create & Add Candidates"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
