# Admin Archive + UX Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reversible election archiving and refine the admin panel UI/UX (dashboard polish, cross-page consistency, states/feedback, accessibility).

**Architecture:** Archiving is an orthogonal `archivedAt` flag on `Election` (status lifecycle untouched), guarded by pure domain functions, mutated via server actions that write `AuditLog` rows. The dashboard splits active vs archived; row actions collapse into an accessible overflow menu; the Control page gains an archive card. Shared division labels and a single `StatusPill` remove duplication.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma 7 + PostgreSQL, Vitest 4, Tailwind, shadcn/ui.

**Spec:** `docs/superpowers/specs/2026-06-05-admin-archive-and-ux-refinement-design.md`

**Branch:** `feat/admin-archive-ux` (already created).

**Pre-flight:** Ensure the DB is running for the migration task: `docker compose up -d`.

---

## File Structure

**New files:**
- `lib/ui/division-labels.ts` — shared `DIVISION_LABELS` + `DIVISION_ORDER` (outside vitest coverage `include` since it is presentational data).
- `app/(admin)/admin/_components/RowActions.tsx` — accessible overflow menu for an election row.
- `app/(admin)/admin/_components/ArchivedSection.tsx` — collapsible archived list with Restore.

**Modified files:** see individual tasks.

---

## Task 1: Schema — add archive fields

**Files:**
- Modify: `prisma/schema.prisma` (`model Election`)

- [ ] **Step 1: Add fields to `model Election`**

In `prisma/schema.prisma`, inside `model Election`, after the `updatedAt` line add:

```prisma
  archivedAt          DateTime?
  archivedBy          String?
```

- [ ] **Step 2: Create the migration and regenerate the client**

Run:
```bash
docker compose up -d
npx prisma migrate dev --name add_election_archive
```
Expected: a new folder under `prisma/migrations/*_add_election_archive/` and "✔ Generated Prisma Client".

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add archivedAt/archivedBy to Election"
```

---

## Task 2: Domain guards — `canArchive` / `canRestore` (TDD)

**Files:**
- Modify: `lib/domain/election-state.ts`
- Test: `tests/domain/election-state.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/domain/election-state.test.ts` (inside the existing top-level `describe`, or as new `describe` blocks at the end of the file — match the file's existing style):

```ts
describe("canArchive", () => {
  it("allows archiving a DRAFT election", () => {
    expect(canArchive("DRAFT", null)).toEqual({ ok: true });
  });
  it("allows archiving a CLOSED election", () => {
    expect(canArchive("CLOSED", null)).toEqual({ ok: true });
  });
  it("rejects archiving an OPEN election", () => {
    expect(canArchive("OPEN", null)).toEqual({
      ok: false,
      reason: "Close the election before archiving",
    });
  });
  it("rejects archiving a SCHEDULED election", () => {
    expect(canArchive("SCHEDULED", null)).toEqual({
      ok: false,
      reason: "Unschedule the election before archiving",
    });
  });
  it("rejects archiving an already-archived election", () => {
    expect(canArchive("CLOSED", new Date())).toEqual({
      ok: false,
      reason: "Already archived",
    });
  });
});

describe("canRestore", () => {
  it("allows restoring an archived election", () => {
    expect(canRestore(new Date())).toEqual({ ok: true });
  });
  it("rejects restoring a non-archived election", () => {
    expect(canRestore(null)).toEqual({
      ok: false,
      reason: "Election is not archived",
    });
  });
});
```

Ensure `canArchive` and `canRestore` are added to the existing import from `@/lib/domain/election-state` at the top of the test file.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/domain/election-state.test.ts`
Expected: FAIL — `canArchive is not a function` / `canRestore is not a function`.

- [ ] **Step 3: Implement the guards**

Append to `lib/domain/election-state.ts` (uses the existing `ok`/`fail`/`ValidationResult` helpers in that file):

```ts
export function canArchive(
  status: ElectionStatus,
  archivedAt: Date | null,
): ValidationResult {
  if (archivedAt) return fail("Already archived");
  if (status === "OPEN") return fail("Close the election before archiving");
  if (status === "SCHEDULED") return fail("Unschedule the election before archiving");
  return ok();
}

export function canRestore(archivedAt: Date | null): ValidationResult {
  if (!archivedAt) return fail("Election is not archived");
  return ok();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/domain/election-state.test.ts`
Expected: PASS (all branches).

- [ ] **Step 5: Commit**

```bash
git add lib/domain/election-state.ts tests/domain/election-state.test.ts
git commit -m "feat: add canArchive/canRestore domain guards with tests"
```

---

## Task 3: Shared division labels module

**Files:**
- Create: `lib/ui/division-labels.ts`
- Modify: `app/(admin)/admin/_components/shared.ts`, `app/(admin)/admin/results/page.tsx`, `app/(admin)/admin/voters/page.tsx`, `app/(admin)/admin/candidates/page.tsx`, `app/(admin)/admin/elections/[id]/control/ControlClient.tsx`

- [ ] **Step 1: Create the shared module**

`lib/ui/division-labels.ts`:
```ts
export const DIVISION_LABELS: Record<string, string> = {
  GS: "Grade School",
  JHS: "Junior High School",
  SHS: "Senior High School",
  HC: "House Council",
};

export const DIVISION_ORDER = ["GS", "JHS", "SHS", "HC"] as const;
```

- [ ] **Step 2: Re-export from dashboard `shared.ts`**

In `app/(admin)/admin/_components/shared.ts`, remove the local `DIVISION_LABELS` declaration and add at the top:
```ts
export { DIVISION_LABELS } from "@/lib/ui/division-labels";
```
(Keep all other exports in `shared.ts` unchanged.)

- [ ] **Step 3: Replace duplicates in the four pages**

In each of `results/page.tsx`, `voters/page.tsx`, `candidates/page.tsx`, and `control/ControlClient.tsx`: delete the local `const DIVISION_LABELS = {...}` (and local `DIVISION_ORDER` in voters/candidates) and add an import:
```ts
import { DIVISION_LABELS, DIVISION_ORDER } from "@/lib/ui/division-labels";
```
(In files that only use `DIVISION_LABELS`, import just that.)

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors related to `DIVISION_LABELS`/`DIVISION_ORDER`.

- [ ] **Step 5: Commit**

```bash
git add lib/ui/division-labels.ts "app/(admin)/admin"
git commit -m "refactor: extract shared DIVISION_LABELS/ORDER to lib/ui"
```

---

## Task 4: Consolidate `StatusPill`

**Files:**
- Modify: `app/(admin)/admin/_components/StatusPill.tsx`

The canonical pill in `components/admin/ui.tsx` already renders DRAFT/SCHEDULED/OPEN/CLOSED. Make the dashboard pill a thin re-export so both surfaces are identical.

- [ ] **Step 1: Verify the canonical pill accepts the same statuses**

Read `components/admin/ui.tsx` around the `StatusPill` export (line ~97). Confirm its `Status` type covers `DRAFT | SCHEDULED | OPEN | CLOSED`. If it does, proceed.

- [ ] **Step 2: Replace dashboard StatusPill with a re-export**

Replace the entire contents of `app/(admin)/admin/_components/StatusPill.tsx` with:
```tsx
"use client";

export { StatusPill } from "@/components/admin/ui";
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (`StatusPill` is consumed by `ElectionRow.tsx` and `AttnCard.tsx` with a `status` prop — confirm the canonical signature is `{ status: ElectionStatus }`.)

- [ ] **Step 4: Commit**

```bash
git add "app/(admin)/admin/_components/StatusPill.tsx"
git commit -m "refactor: consolidate dashboard StatusPill onto shared admin pill"
```

---

## Task 5: Server actions — `archiveElection` / `restoreElection`

**Files:**
- Modify: `app/(admin)/admin/actions.ts`

- [ ] **Step 1: Add the actions**

Append to `app/(admin)/admin/actions.ts`. Add the new imports at the top (the file currently imports `prisma`, `requireAdminSession`, `revalidateAdminDashboard`, `ElectionStatusSchema`):

```ts
import {
  requireAdminSessionOrError,
  adminEmailFromSession,
} from "@/lib/server/auth";
import { canArchive, canRestore } from "@/lib/domain/election-state";
import { revalidateElectionControl } from "@/lib/server/revalidate";

type ActionResult = { success: true } | { success: false; error: string };

export async function archiveElection(electionId: string): Promise<ActionResult> {
  const guard = await requireAdminSessionOrError();
  if (!guard.ok) return { success: false, error: guard.error };

  const election = await prisma.election.findUnique({ where: { id: electionId } });
  if (!election) return { success: false, error: "Election not found" };

  const check = canArchive(election.status, election.archivedAt);
  if (!check.ok) return { success: false, error: check.reason };

  const adminEmail = adminEmailFromSession(guard.session);
  await prisma.$transaction([
    prisma.election.update({
      where: { id: electionId },
      data: { archivedAt: new Date(), archivedBy: adminEmail },
    }),
    prisma.auditLog.create({
      data: { electionId, action: "Archived election", toStatus: null, adminEmail },
    }),
  ]);

  revalidateAdminDashboard();
  revalidateElectionControl(electionId);
  return { success: true };
}

export async function restoreElection(electionId: string): Promise<ActionResult> {
  const guard = await requireAdminSessionOrError();
  if (!guard.ok) return { success: false, error: guard.error };

  const election = await prisma.election.findUnique({ where: { id: electionId } });
  if (!election) return { success: false, error: "Election not found" };

  const check = canRestore(election.archivedAt);
  if (!check.ok) return { success: false, error: check.reason };

  const adminEmail = adminEmailFromSession(guard.session);
  await prisma.$transaction([
    prisma.election.update({
      where: { id: electionId },
      data: { archivedAt: null, archivedBy: null },
    }),
    prisma.auditLog.create({
      data: { electionId, action: "Restored election", toStatus: null, adminEmail },
    }),
  ]);

  revalidateAdminDashboard();
  revalidateElectionControl(electionId);
  return { success: true };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (Confirms `requireAdminSessionOrError`/`adminEmailFromSession` signatures match — they are the same helpers used in `control/actions.ts`.)

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/admin/actions.ts"
git commit -m "feat: archiveElection/restoreElection server actions"
```

---

## Task 6: Dashboard — split active/archived, RowActions menu, ArchivedSection

**Files:**
- Modify: `app/(admin)/admin/page.tsx`, `app/(admin)/admin/_components/shared.ts`, `app/(admin)/admin/DashboardClient.tsx`, `app/(admin)/admin/_components/ElectionRow.tsx`
- Create: `app/(admin)/admin/_components/RowActions.tsx`, `app/(admin)/admin/_components/ArchivedSection.tsx`

- [ ] **Step 1: Add `archivedAt`/`archivedBy` to the `Election` type**

In `app/(admin)/admin/_components/shared.ts`, update the `Election` type:
```ts
export type Election = {
  id: string;
  name: string;
  division: string;
  status: ElectionStatus;
  scheduledOpen: Date | null;
  scheduledClose: Date | null;
  archivedAt: Date | null;
  archivedBy: string | null;
  _count: { voters: number; votes: number; positions: number; candidates: number };
  votedCount: number;
};
```

- [ ] **Step 2: Select archive fields and split in `page.tsx`**

In `app/(admin)/admin/page.tsx`, add `archivedAt: true, archivedBy: true` to the `select`. After building `electionsWithVoted`, split:
```ts
  const activeElections = electionsWithVoted.filter((e) => e.archivedAt === null);
  const archivedElections = electionsWithVoted.filter((e) => e.archivedAt !== null);

  return (
    <div className="p-6 flex flex-col gap-[18px]">
      <DashboardClient
        elections={activeElections}
        archivedElections={archivedElections}
        globalVoterCount={globalVoterCount}
      />
    </div>
  );
```

- [ ] **Step 3: Create the `RowActions` overflow menu**

`app/(admin)/admin/_components/RowActions.tsx`:
```tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveElection } from "../actions";
import { canArchive } from "@/lib/domain/election-state";
import type { Election } from "./shared";

export function RowActions({
  e,
  onToast,
}: {
  e: Election;
  onToast: (msg: string, ok: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function onClick(ev: MouseEvent) {
      if (ref.current && !ref.current.contains(ev.target as Node)) setOpen(false);
    }
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const archivable = canArchive(e.status, e.archivedAt).ok;
  const itemCls =
    "block w-full text-left px-3 py-[7px] text-[11px] text-white/70 hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:outline-none no-underline";

  function handleArchive() {
    setOpen(false);
    startTransition(async () => {
      const res = await archiveElection(e.id);
      onToast(res.success ? "Election archived" : res.error, res.success);
      if (res.success) router.refresh();
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Election actions"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={isPending}
        onClick={() => setOpen((v) => !v)}
        className="rounded-[5px] border border-white/[0.07] px-[7px] py-[4px] text-white/40 hover:text-white/70 hover:border-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 transition-all"
      >
        <svg style={{ width: 12, height: 12 }} viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-[150px] overflow-hidden rounded-[8px] border border-white/[0.10] bg-[#1a2540] py-1 shadow-lg"
        >
          <Link role="menuitem" href={`/admin/elections/${e.id}/voters`} className={itemCls}>Voters</Link>
          <Link role="menuitem" href={`/admin/elections/${e.id}/candidates`} className={itemCls}>Candidates</Link>
          {(e.status === "OPEN" || e.status === "CLOSED") && (
            <Link role="menuitem" href={`/admin/elections/${e.id}/monitor`} className={itemCls}>Monitor</Link>
          )}
          <Link role="menuitem" href="/admin/results" className={itemCls}>Results</Link>
          <div className="my-1 border-t border-white/[0.06]" />
          <button
            type="button"
            role="menuitem"
            onClick={handleArchive}
            disabled={!archivable || isPending}
            title={archivable ? undefined : canArchive(e.status, e.archivedAt).ok ? "" : "Close or unschedule before archiving"}
            className={`${itemCls} disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            Archive
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Refactor `ElectionRow` to use the menu**

In `app/(admin)/admin/_components/ElectionRow.tsx`: replace the entire `{/* Actions */}` block (the `<div className="flex gap-1 flex-shrink-0">…</div>` with the multiple links) with a single primary Control link + the menu. Add `onToast` to the props and the import for `RowActions`:

```tsx
import { RowActions } from "./RowActions";
```

Change the signature to:
```tsx
export function ElectionRow({ e, onToast }: { e: Election; onToast: (msg: string, ok: boolean) => void }) {
```

Replace the actions block with:
```tsx
      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Link href={`/admin/elections/${e.id}/control`} className={amberBtn}>⚡ Control</Link>
        <RowActions e={e} onToast={onToast} />
      </div>
```
(Keep `amberBtn`; the `ghostBtn`/`emeraldBtn` consts can be removed if now unused — verify with tsc.)

- [ ] **Step 5: Create `ArchivedSection`**

`app/(admin)/admin/_components/ArchivedSection.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { restoreElection } from "../actions";
import { DIVISION_LABELS } from "@/lib/ui/division-labels";
import { fmt, type Election } from "./shared";

export function ArchivedSection({
  elections,
  onToast,
}: {
  elections: Election[];
  onToast: (msg: string, ok: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (elections.length === 0) return null;

  function handleRestore(id: string) {
    startTransition(async () => {
      const res = await restoreElection(id);
      onToast(res.success ? "Election restored" : res.error, res.success);
      if (res.success) router.refresh();
    });
  }

  return (
    <div className="bg-[#1a2540] border border-white/[0.07] rounded-[12px] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 px-[14px] py-[10px] cursor-pointer border-b border-white/[0.07] bg-transparent w-full hover:bg-white/[0.025] transition-colors"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-white/40 flex-1 text-left">Archived</span>
        <span className="text-[10px] bg-white/[0.06] text-white/40 rounded-full px-[7px] py-[1px]">{elections.length}</span>
        <svg className={`w-3 h-3 text-white/40 ml-[6px] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && elections.map((e) => (
        <div key={e.id} className="flex items-center gap-3 px-[14px] py-[10px] border-b border-white/[0.04] last:border-0">
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-white/70 truncate">{e.name}</div>
            <div className="text-[10px] text-white/30 mt-[1px]">
              {DIVISION_LABELS[e.division] ?? e.division} · archived {fmt(e.archivedAt)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleRestore(e.id)}
            disabled={isPending}
            className="text-[10px] text-amber-400 bg-amber-400/[0.08] border border-amber-400/20 rounded-[5px] px-[9px] py-[4px] hover:bg-amber-400/[0.15] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 transition-all disabled:opacity-40"
          >
            Restore
          </button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Wire `DashboardClient` — props, toast, render**

In `app/(admin)/admin/DashboardClient.tsx`:
1. Update the import for shared + add new ones:
```tsx
import { ArchivedSection } from "./_components/ArchivedSection";
import { Toast } from "@/components/admin/ui";
```
2. Change the component signature/props:
```tsx
export default function DashboardClient({
  elections,
  archivedElections,
  globalVoterCount,
}: {
  elections: Election[];
  archivedElections: Election[];
  globalVoterCount: number;
}) {
```
3. Add toast state near the top of the component body:
```tsx
  const [toast, setToast] = useState<{ msg: string; color: "green" | "red" } | null>(null);
  function onToast(msg: string, ok: boolean) {
    setToast({ msg, color: ok ? "green" : "red" });
    setTimeout(() => setToast(null), 2500);
  }
```
4. Pass `onToast` to each `ElectionRow`:
```tsx
          {allOpen && elections.map((e) => <ElectionRow key={e.id} e={e} onToast={onToast} />)}
```
5. After the "All Elections table" block, before the closing `</>`, render the archived section + toast:
```tsx
      <ArchivedSection elections={archivedElections} onToast={onToast} />

      {toast && <Toast msg={toast.msg} color={toast.color} />}
```

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. Fix any unused-const warnings in `ElectionRow.tsx` by removing now-unused button class consts.

- [ ] **Step 8: Commit**

```bash
git add "app/(admin)/admin"
git commit -m "feat: dashboard archive section + row overflow menu"
```

---

## Task 7: Control page — Archive card

**Files:**
- Modify: `app/(admin)/admin/elections/[id]/control/page.tsx`, `app/(admin)/admin/elections/[id]/control/ControlClient.tsx`

- [ ] **Step 1: Select archive fields in `page.tsx`**

In `control/page.tsx`, add `archivedAt: true, archivedBy: true` to the election `select`, and ensure they are passed through to `ControlClient` (the page passes the whole `election` object).

- [ ] **Step 2: Extend the `Election` type in `ControlClient.tsx`**

Add to the local `Election` type:
```ts
  archivedAt: Date | null;
  archivedBy: string | null;
```

- [ ] **Step 3: Import the archive actions + extend dialog type**

Add imports:
```ts
import { archiveElection, restoreElection } from "@/app/(admin)/admin/actions";
import { canArchive } from "@/lib/domain/election-state";
```
Extend `DlgType`:
```ts
type DlgType = "open" | "close" | "reschedule" | "advance" | "archive" | "restore" | null;
```
Add cases to `getDlgConfig`:
```ts
    case "archive":
      return {
        title: "Archive this election?",
        body: "It will be hidden from the active dashboard and public results. You can restore it anytime. This is logged.",
        confirmLabel: "Archive Election",
        confirmVariant: "adminDestructive",
        iconBg: "bg-white/[0.06] text-white/60",
        icon: icons.close,
      };
    case "restore":
      return {
        title: "Restore this election?",
        body: "It will return to the active dashboard. This is logged.",
        confirmLabel: "Restore Election",
        confirmVariant: "adminPrimary",
        iconBg: "bg-amber-400/[0.12] text-amber-400",
        icon: icons.calendar,
      };
```

- [ ] **Step 4: Handle archive/restore in `confirmDlg`**

In the `confirmDlg` transition body, add branches before the final `else`:
```ts
      } else if (dlg === "archive") {
        result = await archiveElection(election.id);
        if (result.success) showToast("Election archived", "amber");
      } else if (dlg === "restore") {
        result = await restoreElection(election.id);
        if (result.success) showToast("Election restored", "green");
```
(Keep the existing branches; `advance` remains the final `else`.)

- [ ] **Step 5: Render the Archive card**

Add a new `Card` after the Audit Trail card (before the `ConfirmDialog`):
```tsx
      {/* ── Archive ── */}
      <Card title="Archive">
        {election.archivedAt ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-white/50">
              Archived{election.archivedBy ? ` by ${election.archivedBy}` : ""} on {fmt(election.archivedAt)}.
              Hidden from the active dashboard and public results.
            </p>
            <Button onClick={() => setDlg("restore")} disabled={isPending} variant="adminPrimary" size="adminMd">
              Restore
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-white/50">
              {canArchive(status, election.archivedAt).ok
                ? "Hide this election from the active dashboard and public results. Reversible."
                : "Close or unschedule the election before it can be archived."}
            </p>
            <Button
              onClick={() => setDlg("archive")}
              disabled={isPending || !canArchive(status, election.archivedAt).ok}
              variant="adminGhost"
              size="adminMd"
            >
              Archive
            </Button>
          </div>
        )}
      </Card>
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add "app/(admin)/admin/elections/[id]/control"
git commit -m "feat: archive/restore control on election Control page"
```

---

## Task 8: `elections/new` chrome cleanup

**Files:**
- Modify: `app/(admin)/admin/elections/new/page.tsx`

- [ ] **Step 1: Remove duplicate chrome**

Remove the inner `<nav>…</nav>` topbar block and change the outer wrapper from `<div className="min-h-screen bg-[#0b1220] font-sans">` to a plain content container consistent with other admin pages, e.g.:
```tsx
  return (
    <div className="p-6">
      {/* breadcrumb */}
      <div className="mb-5 flex items-center gap-2 text-[13px]">
        <Link href="/admin" className="text-white/30 transition-colors hover:text-white/60">Elections</Link>
        <span className="text-white/20">/</span>
        <span className="text-white/50">New Election</span>
      </div>
      <main className="mx-auto max-w-xl">
        {/* ...existing page header + form, unchanged... */}
      </main>
    </div>
  );
```
Keep the existing page header and form markup inside `<main>`; only the outer wrapper and the redundant topbar change.

- [ ] **Step 2: Typecheck + eyeball**

Run: `npx tsc --noEmit`
Expected: no errors. (Manual check happens in Task 11 via `npm run dev`.)

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/admin/elections/new/page.tsx"
git commit -m "refactor: drop duplicate chrome on New Election page"
```

---

## Task 9: Exclude archived from public results

**Files:**
- Modify: `app/results/page.tsx`, `app/api/results/[id]/route.ts`

- [ ] **Step 1: Add `archivedAt: null` to public queries**

Read both files. In `app/results/page.tsx`, find the `prisma.election.findMany`/`findFirst` query that powers the public selector and add `archivedAt: null` to its `where`. In `app/api/results/[id]/route.ts`, find the `prisma.election.findUnique`/`findFirst` and add `archivedAt: null` to the `where` (switch `findUnique` to `findFirst` if combining `id` with `archivedAt`), returning the existing not-found response when null.

- [ ] **Step 2: Add `archivedAt: null` to admin results page**

In `app/(admin)/admin/results/page.tsx`, add `archivedAt: null` to the existing `where: { status: { in: ["OPEN", "CLOSED"] } }`.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/results "app/(admin)/admin/results/page.tsx" "app/api/results"
git commit -m "feat: exclude archived elections from results views"
```

---

## Task 10: Accessibility pass

**Files:**
- Modify: `app/(admin)/admin/layout.tsx`

(The new RowActions/ArchivedSection already include aria + focus-visible from Task 6.)

- [ ] **Step 1: Label the sign-out and raise low-contrast text**

In `app/(admin)/admin/layout.tsx`:
- Add `aria-label="Sign out"` to the sign-out `<button>` and bump its idle color from `text-white/[0.14]` to `text-white/40` (keep the hover state).
- Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 rounded-[4px]` to the sign-out button.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/admin/layout.tsx"
git commit -m "a11y: label sign-out, raise contrast, add focus rings"
```

---

## Task 11: Full verification

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: no errors (fix any with `npm run lint -- --fix`).

- [ ] **Step 2: Unit tests + coverage**

Run: `npm test`
Expected: all pass including the new `canArchive`/`canRestore` cases; coverage threshold (80%) holds.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build succeeds with no type errors.

- [ ] **Step 4: Manual smoke (dev server)**

Run: `npm run dev`, log into `/admin`, then verify:
- Archive a CLOSED or DRAFT election from the row overflow menu → it leaves the active list, appears under "Archived", toast shows.
- Restore it from the Archived section → it returns to the active list.
- On a CLOSED election's Control page, Archive then Restore work with confirm dialog + toast.
- The OPEN/SCHEDULED row's Archive item is disabled; Control page shows the "close/unschedule first" message.
- New Election page renders with a single topbar (no double chrome).
- Public `/results` does not list archived elections.

- [ ] **Step 5: Final commit (if any fixes were needed)**

```bash
git add -A
git commit -m "chore: lint/build fixes for archive + UX refinement"
```

---

## Self-Review Notes

- **Spec coverage:** data model (T1), domain guards (T2), server actions (T5), dashboard split + archived section + row menu (T6), control card (T7), cross-page consistency: labels (T3) + StatusPill (T4) + new-page chrome (T8), public exclusion (T9), states/feedback (toasts in T6/T7), accessibility (T6 menu + T10), tests (T2 + T11). All spec sections mapped.
- **Path note:** spec listed `lib/elections/labels.ts`; plan uses `lib/ui/division-labels.ts` to stay outside the vitest coverage `include` (`lib/elections/**`) and avoid a spurious 0%-covered file.
- **Type consistency:** `Election` gains `archivedAt`/`archivedBy` in both `_components/shared.ts` (T6) and `ControlClient` local type (T7); `ActionResult` matches the control-actions shape; `canArchive(status, archivedAt)` / `canRestore(archivedAt)` signatures used consistently across T2/T5/T6/T7.
