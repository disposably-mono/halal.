# TODO — Code Review Action Items

Generated from the general code review on 2026-06-18. Items are ordered by
severity. **Items 1–4 must be resolved before any real election runs** — 1 and 2
allow direct result tampering, 3 and 4 break the security/anonymity guarantees the
system is built on.

---

## 🔴 CRITICAL

### 1. Harden ballot submission against client-supplied IDs ✅ Implemented
**File:** `app/vote/ballot/actions.ts` (`submitBallot`)

**Problem:** The action builds vote rows directly from the client's `selections`
map and `allPositionIds` array. It never verifies that the positions are ones the
voter is actually eligible for, never checks that a `candidateId` belongs to its
`positionId`, and never dedupes position IDs. The server-side `BallotPage` filters
positions correctly, but the *server action* is the real trust boundary and skips
that filtering.

**Exploits possible via a crafted POST (all bypass the UI):**
- **Unlimited votes for one candidate** — send `allPositionIds = ["pos1","pos1",…]`.
  `createMany` inserts every row, and `/api/results` tallies purely by `candidateId`,
  so the count inflates without bound.
- **Voting in ineligible races** — e.g. a grade-6 student submitting for a grade-9
  governor position.
- **Cross-position vote injection** — assign a candidate ID from a different position;
  it still counts toward that candidate in the results.

**Fix:** Inside `submitBallot`, load the voter's eligible positions + their candidates
server-side (reuse the `BallotPage` query: `electionId`, `isActive`,
`eligibleGrades has gradeLevel`). Iterate over *those* positions only, accept at most
one selection per position, and validate each `candidateId` is in that position's
candidate set. Discard anything the client sent that doesn't match.

---

### 2. Make the double-vote guard atomic ✅ Implemented
**File:** `app/vote/ballot/actions.ts` (`submitBallot`)

**Problem:** The action reads `voter.hasVoted`, then in a *separate* `$transaction`
does `createMany` + `update`. The check is not atomic, so two concurrent submissions
both see `hasVoted = false` and both insert a full ballot. There is no per-voter
unique constraint on `Vote` (by anonymity design), so nothing else catches it.

**Fix:** Make the guard atomic inside the transaction:
```ts
const updated = await tx.voter.updateMany({
  where: { id: session.voterId, hasVoted: false },
  data: { hasVoted: true, votedAt: now },
});
if (updated.count !== 1) throw new AlreadyVotedError(); // rolls back
await tx.vote.createMany({ data: voteData });
```
Only insert votes when the conditional update claimed the row.

---

## 🟠 HIGH

### 3. Cron transition endpoint fails open when `CRON_SECRET` is unset ✅ Implemented
**File:** `app/api/cron/transition-elections/route.ts`

**Problem:** The guard is `if (secret && authHeader !== ...)`. If `CRON_SECRET` is not
configured, the check is skipped entirely and **anyone can open or close any election**
by hitting the URL — directly contradicting the comment that says it "cannot be
triggered anonymously."

**Fix:** Fail closed. In production, if `secret` is missing, return 401 instead of
allowing the request through. Only allow the unauthenticated path in local dev (and
even then, gate it on `NODE_ENV !== "production"`).

---

### 4. Vote anonymity defeatable via timestamp correlation ✅ Implemented
**File:** `app/vote/ballot/actions.ts` (`submitBallot`)

**Problem:** The same `Date` instance is written to both `Voter.votedAt` and every
`Vote.castAt`. Anyone with DB read access can join a voter to their exact ballot by
matching `votedAt === castAt` — trivial in low-traffic windows. This undercuts the
system's headline anonymity guarantee (the `Vote` model deliberately has no `voterId`).

**Fix:** Stop persisting `votedAt` at the same resolution as `castAt`. Options:
store only a coarse bucket for `votedAt` (e.g. truncated to the hour), drop the field,
or add jitter to `castAt`. If full DB access is considered trusted, document that
explicitly so the limitation is known.

---

## 🟡 MEDIUM

### 5. No role-based authorization
**Files:** `app/(admin)/admin/**/actions.ts`, `auth.config.ts`, `lib/server/auth.ts`

**Problem:** `AdminRole` (`COMMISSIONER` / `OFFICER`) exists in the schema and flows
into the session, but is never enforced. Any authenticated admin can open/close
elections, export the full voter roster (PII), and generate result PDFs.

**Fix:** Decide which actions require `COMMISSIONER` (likely open/close and voter
export) and add a role check in the affected server actions, e.g. extend
`requireAdminSessionOrError` with a required-role parameter.

---

### 6. Voter CSV import silently drops duplicates ✅ Implemented
**File:** `lib/domain/voter-import.ts` (`parseVotersCSV`)

**Problem:** Duplicate `studentId` / `voterCode` rows are skipped with `continue`
without being counted in `rejected` or added to `reasons`. The admin sees
"X imported" with no explanation for the gap between rows submitted and rows created.

**Fix:** Track a `skippedDuplicates` count and surface it in the result/reasons so the
admin understands why fewer voters were created than rows supplied.

---

### 7. Admin login form controls aren't accessibility-associated ✅ Implemented
**File:** `app/admin/login/page.tsx`

**Problem:** The `<label>` elements have no `htmlFor`/`id` link to their inputs, so
screen readers can't associate them. The error `<div>` also lacks `role="alert"`, so
it isn't announced. (The voter `/vote` page already does both correctly.)

**Fix:** Add matching `id`/`htmlFor` to each label/input pair and `role="alert"` to the
error container — mirror the pattern already used in `app/vote/page.tsx`.

---

## 🟢 LOW / QoL

### 8. Miscellaneous polish ✅ Addressed
- **Deprecated `useFormState`** in `app/vote/page.tsx` and
  `app/(admin)/admin/elections/[id]/voters/VoterForms.tsx` — deferred until React 19;
  the current installed tree is React 18.3.1 / React DOM 18.3.1.
- **Ties not surfaced** — implemented explicit `isTie` tally/API/PDF state and visible
  `TIE` indicators.
- **Login retry UX** — implemented; failed officer-key attempts stay on step 2 and
  preserve the entered password.
- **`/vote` ARIA wiring** — implemented with `aria-invalid`, `aria-describedby`, and
  an alert error message.
- **Stale CLAUDE.md** — updated to reflect implemented voting, results, live monitor,
  PDF export, and cron transitions.
