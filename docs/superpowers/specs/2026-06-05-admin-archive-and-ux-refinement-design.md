# Admin UX Refinement + Election Archiving — Design

**Date:** 2026-06-05
**Status:** Approved

## Goal

Two related pieces of work on the admin panel (`app/(admin)/admin/`):

1. **Archive elections** — let admins archive (and restore) elections so finished or
   abandoned ones leave the active workspace without being deleted.
2. **UI/UX refinement** — dashboard polish, cross-page consistency, better
   states/feedback, and accessibility improvements.

## Decisions (locked)

- **Archive model:** separate `archivedAt` flag on `Election`, orthogonal to the
  `DRAFT → SCHEDULED → OPEN → CLOSED` status lifecycle. Reversible (restore).
- **Archivable statuses:** `CLOSED` and `DRAFT` only. `OPEN`/`SCHEDULED` are blocked.
- **Archive controls:** dashboard row (overflow menu) + per-election Control page, with
  an "Archived" collapsible section on the dashboard.
- **Public results:** archiving a CLOSED election also removes it from the public results
  page/selector (archive = fully retire).

## 1. Data Model

Add to `model Election` in `prisma/schema.prisma`:

```prisma
archivedAt DateTime?
archivedBy String?
```

- Migration name: `add_election_archive`.
- Regenerate Prisma client.
- No change to existing relations or cascade rules.

## 2. Domain Logic — `lib/domain/election-state.ts` (pure, unit-tested)

```ts
export function canArchive(status: ElectionStatus, archivedAt: Date | null): ValidationResult
export function canRestore(archivedAt: Date | null): ValidationResult
```

- `canArchive`: fail if `archivedAt` is set ("Already archived"); fail if status is
  `OPEN` ("Close the election before archiving") or `SCHEDULED` ("Unschedule the election
  before archiving"); otherwise ok (`DRAFT`/`CLOSED`).
- `canRestore`: fail if `archivedAt` is null ("Election is not archived"); else ok.

These are pure functions added to the existing module and covered by Vitest tests in the
existing `lib/domain` suite (keeps the 80% coverage gate green).

## 3. Server Actions — `app/(admin)/admin/actions.ts`

Return type matches control actions: `type ActionResult = { success: true } | { success: false; error: string }`.

```ts
export async function archiveElection(electionId: string): Promise<ActionResult>
export async function restoreElection(electionId: string): Promise<ActionResult>
```

Each:
1. `requireAdminSessionOrError()` guard.
2. Load election; 404 → error.
3. Run `canArchive` / `canRestore` guard.
4. `$transaction`: update `archivedAt`/`archivedBy` (now + admin email, or null/null on
   restore) **and** create an `AuditLog` row (`action: "Archived election"` /
   `"Restored election"`, `toStatus: null`).
5. `revalidateAdminDashboard()` + `revalidateElectionControl(electionId)`.

`requireAdminSessionOrError` / `adminEmailFromSession` are reused from `lib/server/auth`.

## 4. Dashboard — `app/(admin)/admin/page.tsx` + `_components`

- Query selects `archivedAt` (and `archivedBy` for the archived list).
- Split into `activeElections` (archivedAt == null) and `archivedElections`.
- **Stats grid, attention strip, and "All Elections" table use `activeElections` only.**
- New collapsible **Archived** section at the bottom (mirrors the "All Elections"
  collapsible toggle): each archived election shows name, division, archived date, and a
  **Restore** button. Collapsed by default. Empty → section hidden (no empty card needed
  since it only renders when count > 0).
- `shared.ts` `Election` type gains `archivedAt: Date | null` (+ `archivedBy` on the
  archived variant).

### `ElectionRow` refactor (`_components/ElectionRow.tsx`)
- Keep one primary contextual action visible: **⚡ Control**.
- Move Voters, Candidates, Monitor/Results, and **Archive** into a new accessible overflow
  menu.
- Remove the duplicated Results link (currently rendered under two separate conditions).

### New `RowActions` menu component (`_components/RowActions.tsx`)
- Icon-only "⋯" trigger button with `aria-label="Election actions"`, `aria-haspopup`,
  `aria-expanded`.
- Menu panel `role="menu"`; items `role="menuitem"`.
- Closes on outside click and `Escape`; `focus-visible` ring on trigger and items.
- Archive item calls `archiveElection` via a transition; shows a toast on result.

### New `ArchivedSection` component (`_components/ArchivedSection.tsx`)
- Collapsible list + Restore buttons (calls `restoreElection`), toast feedback.

## 5. Control Page — `app/(admin)/admin/elections/[id]/control/`

- `page.tsx` query selects `archivedAt`/`archivedBy`; passes to `ControlClient`.
- New **"Archive Election"** `Card` in `ControlClient.tsx`:
  - If not archived and status is `DRAFT`/`CLOSED`: show **Archive** button →
    `ConfirmDialog` → `archiveElection` → `Toast`.
  - If archived: show archived metadata (who/when) + **Restore** button → `restoreElection`
    → `Toast`.
  - If `OPEN`/`SCHEDULED` and not archived: card shows a disabled/explanatory state
    ("Close or unschedule before archiving").
- Reuses existing `Card`, `ConfirmDialog`, `Toast`, `Button` admin variants.

## 6. Cross-Page Consistency

- **New `lib/elections/labels.ts`** exporting `DIVISION_LABELS` and `DIVISION_ORDER`.
  Replace the 5 duplicate declarations (`shared.ts`, `results/page.tsx`, `voters/page.tsx`,
  `candidates/page.tsx`, `ControlClient.tsx`). `_components/shared.ts` re-exports from it so
  existing imports keep working.
- **Single `StatusPill`:** canonical version lives in `components/admin/ui.tsx`. The
  dashboard `_components/StatusPill.tsx` becomes a thin re-export (or is replaced at call
  sites) so both surfaces render identically.
- **`elections/new/page.tsx`:** remove the redundant inner `<nav>` topbar and
  `min-h-screen bg-[#0b1220]` wrapper (the admin layout already provides chrome). Use a
  breadcrumb consistent with other admin pages and wrap the form in the shared `Card`.

## 7. States, Feedback & Accessibility

- Archive/restore everywhere give `Toast` feedback; archive uses `ConfirmDialog` first.
- aria-labels on icon-only controls (overflow trigger, layout "Sign out", any icon button).
- `focus-visible` rings on interactive elements that lack them.
- Keyboard-dismissable overflow menu (Escape + outside click).
- Raise the lowest-contrast **text** (`text-white/[0.14]`, `text-white/20` used for real
  content like the "Closed" pill label and nav section headers) toward WCAG AA contrast;
  leave purely decorative low-opacity elements as-is.

## 8. Public Results Exclusion

- Exclude archived elections from the public results data source and selector:
  - `app/results/page.tsx` (and/or its data query) and `app/api/results/[id]/route.ts` —
    add `archivedAt: null` to the relevant `where` clauses.
  - Admin `results/page.tsx` continues to show active (non-archived) only as well.

## 9. Testing

- **Vitest unit tests** for `canArchive` / `canRestore` (all branches) added to the
  existing `lib/domain` test file. Coverage gate (80%) stays green.
- Server actions and React components remain untested, consistent with the current project
  posture (no test DB / jsdom harness yet) — documented, not blocking.

## Out of Scope

- Hard-delete of elections (archive is the soft-retire mechanism; delete is unchanged).
- Bulk archive/restore.
- Role-based restrictions on who can archive (any admin can).
- Migrating other admin pages' layouts beyond the consistency items listed.

## File Touch List

**New:**
- `lib/elections/labels.ts`
- `app/(admin)/admin/_components/RowActions.tsx`
- `app/(admin)/admin/_components/ArchivedSection.tsx`
- Vitest cases in the existing `lib/domain` election-state test file.

**Modified:**
- `prisma/schema.prisma` (+ migration)
- `lib/domain/election-state.ts`
- `app/(admin)/admin/actions.ts`
- `app/(admin)/admin/page.tsx`
- `app/(admin)/admin/DashboardClient.tsx`
- `app/(admin)/admin/_components/shared.ts`
- `app/(admin)/admin/_components/ElectionRow.tsx`
- `app/(admin)/admin/_components/StatusPill.tsx`
- `app/(admin)/admin/elections/[id]/control/page.tsx`
- `app/(admin)/admin/elections/[id]/control/ControlClient.tsx`
- `app/(admin)/admin/elections/new/page.tsx`
- `app/(admin)/admin/results/page.tsx`
- `app/(admin)/admin/voters/page.tsx`
- `app/(admin)/admin/candidates/page.tsx`
- `app/results/page.tsx`
- `app/api/results/[id]/route.ts`
- `components/admin/ui.tsx` (canonical StatusPill, if adjusted)
- `app/(admin)/admin/layout.tsx` (sign-out aria-label / focus states)
