import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createElection } from "./actions";
import { ThemedSelect } from "@/components/admin/ThemedSelect";
import Link from "next/link";
import {
  DIVISION_LABELS,
  DIVISION_ORDER,
  formatDivisionGrades,
} from "@/lib/ui/division-labels";

export default async function NewElectionPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <div className="p-6">

      {/* ── Breadcrumb ── */}
      <div className="mb-6 flex items-center gap-2 text-[13px]">
        <Link
          href="/admin"
          className="text-white/60 transition-colors hover:text-white/80"
        >
          Elections
        </Link>
        <span className="text-white/20">/</span>
        <span className="text-white/50">New Election</span>
      </div>

      <main className="mx-auto max-w-xl">

        {/* ── Page header ── */}
        <div className="mb-7">
          <h1 className="text-[22px] font-semibold tracking-tight text-white/90">
            Create Election
          </h1>
          <p className="mt-1 text-[13px] text-white/40">
            Set up the details. You can add candidates and voters after creation.
          </p>
        </div>

        {/* ── Form card ── */}
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-admin-surface">

          {/* Card header */}
          <div className="border-b border-white/[0.08] px-6 py-4">
            <h2 className="text-[13px] font-semibold text-white/80">
              Election Details
            </h2>
          </div>

          {/* Form body */}
          <form action={createElection} className="flex flex-col gap-6 px-6 py-6">

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.06em] text-white/40">
                Election Name
                <span className="text-gold">*</span>
              </label>
              <input
                name="name"
                type="text"
                placeholder="e.g. JHSSCT Elections AY 2025–2026"
                required
                className="h-10 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-[13px] text-white/90 placeholder:text-white/40 outline-none transition-colors focus:border-gold/50 focus:bg-gold/[0.04]"
              />
            </div>

            {/* Division */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.06em] text-white/40">
                Division
                <span className="text-gold">*</span>
              </label>
              <ThemedSelect
                name="division"
                required
                placeholder="Select a division"
                className="h-10 rounded-lg"
                options={DIVISION_ORDER.map((div) => ({
                  value: div,
                  label: `${DIVISION_LABELS[div]} (${formatDivisionGrades(div)})`,
                }))}
              />
            </div>

            {/* Schedule */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline gap-2">
                <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-white/40">
                  Schedule
                </label>
                <span className="text-[11px] text-white/60">— optional</span>
              </div>
              <p className="text-[11px] text-white/60">
                Leave blank to open and close the election manually.
              </p>
              <div className="mt-1 grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] text-white/60">Opens</span>
                  <input
                    name="scheduledOpen"
                    type="datetime-local"
                    className="h-10 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-[13px] text-white/60 outline-none transition-colors focus:border-gold/50 focus:bg-gold/[0.04]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] text-white/60">Closes</span>
                  <input
                    name="scheduledClose"
                    type="datetime-local"
                    className="h-10 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-[13px] text-white/60 outline-none transition-colors focus:border-gold/50 focus:bg-gold/[0.04]"
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.06]" />

            {/* Actions */}
            <div className="flex gap-2.5">
              <Link href="/admin" className="flex-1">
                <button
                  type="button"
                  className="h-10 w-full rounded-lg border border-white/[0.12] text-[13px] text-white/60 transition-colors hover:border-white/[0.2] hover:bg-white/[0.04] hover:text-white/80"
                >
                  Cancel
                </button>
              </Link>
              <button
                type="submit"
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-gold text-[13px] font-semibold text-admin-bg transition-opacity hover:opacity-90 active:scale-[0.97]"
              >
                Create &amp; Add Candidates
                <svg
                  className="size-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}
