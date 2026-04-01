import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createElection } from "./actions";
import Link from "next/link";

export default async function NewElectionPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-[#0b1220] font-sans">

      {/* ── Topbar ── */}
      <nav className="sticky top-0 z-10 border-b border-white/[0.08] bg-[#131c2e]">
        <div className="mx-auto flex h-[52px] max-w-4xl items-center gap-2 px-6">
          <Link
            href="/admin"
            className="text-[13px] text-white/30 transition-colors hover:text-white/60"
          >
            ← Elections
          </Link>
          <span className="text-[13px] text-white/20">/</span>
          <span className="text-[13px] text-white/50">New Election</span>
        </div>
      </nav>

      <main className="mx-auto max-w-xl px-6 py-10">

        {/* ── Page header ── */}
        <div className="mb-7">
          <h1 className="text-[22px] font-semibold tracking-tight text-white/90">
            Create Election
          </h1>
          <p className="mt-1 text-[13px] text-white/30">
            Set up the details. You can add candidates and voters after creation.
          </p>
        </div>

        {/* ── Form card ── */}
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#1a2540]">

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
              <label className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.06em] text-white/30">
                Election Name
                <span className="text-amber-400">*</span>
              </label>
              <input
                name="name"
                type="text"
                placeholder="e.g. JHSSCT Elections AY 2025–2026"
                required
                className="h-10 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-[13px] text-white/90 placeholder:text-white/25 outline-none transition-colors focus:border-amber-400/50 focus:bg-amber-400/[0.04]"
              />
            </div>

            {/* Division */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.06em] text-white/30">
                Division
                <span className="text-amber-400">*</span>
              </label>
              <select
                name="division"
                required
                defaultValue=""
                className="h-10 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-[13px] text-white/70 outline-none transition-colors focus:border-amber-400/50 focus:bg-amber-400/[0.04] [&>option]:bg-[#0b1220]"
              >
                <option value="" disabled>
                  Select a division
                </option>
                <option value="GS">Grade School (Grades 3–5)</option>
                <option value="JHS">Junior High School (Grades 6–9)</option>
                <option value="SHS">Senior High School (Grades 10–11)</option>
                <option value="HC">House Council (Grades 10–11)</option>
              </select>
            </div>

            {/* Schedule */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline gap-2">
                <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-white/30">
                  Schedule
                </label>
                <span className="text-[11px] text-white/20">— optional</span>
              </div>
              <p className="text-[11px] text-white/25">
                Leave blank to open and close the election manually.
              </p>
              <div className="mt-1 grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] text-white/25">Opens</span>
                  <input
                    name="scheduledOpen"
                    type="datetime-local"
                    className="h-10 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-[13px] text-white/60 outline-none transition-colors focus:border-amber-400/50 focus:bg-amber-400/[0.04]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] text-white/25">Closes</span>
                  <input
                    name="scheduledClose"
                    type="datetime-local"
                    className="h-10 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-[13px] text-white/60 outline-none transition-colors focus:border-amber-400/50 focus:bg-amber-400/[0.04]"
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
                  className="h-10 w-full rounded-lg border border-white/[0.12] text-[13px] text-white/50 transition-colors hover:border-white/[0.2] hover:bg-white/[0.04] hover:text-white/80"
                >
                  Cancel
                </button>
              </Link>
              <button
                type="submit"
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-amber-400 text-[13px] font-semibold text-[#0b1220] transition-opacity hover:opacity-90 active:scale-[0.97]"
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
