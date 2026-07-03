# Handoff: Project Status & Future Improvements

Updated: 2026-07-03
Branch: `main` at `6ee39ae`

This file is the working handoff for the project. The staged Next.js 14 → 16 migration
(sections 10–11) and the 2026-07-03 security-hardening pass (section 1) are **complete and
merged to `main`**, as are the audit-logging wrapper (section 5) and OpenTelemetry traces
(section 6). A safe batch of routine dependency bumps also landed (section 8). The active
content of this handoff is the future-improvements roadmap in sections 4, 7, and 8 —
recommended next: **section 7, the Tailwind v4 migration** (see section 3 for the full
sequencing rationale).

---

## 1. Current State

- **Stack:** Next.js 16.2.10 (App Router, Turbopack), React 19.2.7, Auth.js v5 beta,
  Prisma 7 + PostgreSQL 16, Vitest (59 files / 453 tests, 80% coverage gate), Playwright.
- **Framework migration:** complete. Next 14 → 15 → 16 merged via PRs #9–#11; Cache
  Components evaluated and declined (section 11).
- **Security posture:** a full security/optimization/resilience review was run on
  2026-07-03 and all 10 findings were fixed and pushed (`4071ad2..851a6f0`, nine atomic
  commits). Highlights now live on `main`:
  - Admin sessions are revocable: 8h `maxAge`, and the JWT callback re-checks the DB at
    most once per 60s per token (`lib/auth/token-refresh.ts`) — deleted accounts are
    invalidated, role changes propagate.
  - Account management is audited: `AdminAccountLog` model (migration
    `20260703121016_add_admin_account_log`), written atomically inside every mutation in
    `app/(admin)/admin/accounts/actions.ts`, surfaced on the admin history page.
  - Rate limiter hardened (blocked live buckets can no longer be evicted by a key flood),
    admin login throttled per-email in addition to per-IP, receipt verification
    length-capped and per-IP limited, SSE monitor connections capped (100),
    HSTS header added, Postgres bound to `127.0.0.1` in `docker-compose.yml`.
- **Dependencies:** `npm audit` reports 5 moderate advisories, all upstream (Next's
  bundled `postcss`; `@hono/node-server` under Prisma dev tooling). Do not run
  `npm audit fix --force` — it installs breaking downgrades. Re-check after each Next /
  Prisma patch release.

---

## 2. Standing Operational Constraints

These are deliberate design decisions, not bugs. Every future improvement must respect
them or explicitly replace them:

1. **Single-instance deployment.** The rate limiter (`lib/server/rate-limit.ts`), TTL
   cache (`lib/server/ttl-cache.ts`), monitor hub (`lib/server/monitor-hub.ts`),
   broadcast coalescing (`lib/server/monitor-broadcast.ts`), and SSE connection counter
   (`lib/server/sse-connections.ts`) all hold state in one Node process's memory. Do not
   scale horizontally or run rolling deploys during voting until section 4 lands.
2. **Header-sanitizing reverse proxy is a hard deployment requirement.** Per-IP rate
   limits trust `x-forwarded-for`. The per-email admin-login throttle softens the blast
   radius if the proxy is missing, but does not remove the requirement.
3. **Vote anonymity is structural.** `Vote` has no voter FK; `votedAt` is bucketed to the
   hour. Nothing (including telemetry — see section 6) may reintroduce a linkage between
   a voter identity and ballot contents.
4. **Archive is orthogonal to status.** Filter on `archivedAt`; never add an `ARCHIVED`
   status.

---

## 3. Future Improvements — Overview

| # | Improvement | Driver | Size | Risk |
| --- | --- | --- | --- | --- |
| 4 | Multi-instance: Postgres LISTEN/NOTIFY monitor bus | Horizontal scaling / zero-downtime deploys | Medium | Medium |
| 5 | Extract audit logging into a shared wrapper — **done** (see section 5) | Consistency; audit writes are spread across actions | Small–Medium | Low |
| 6 | OpenTelemetry traces — **done** (see section 6) | Production debuggability | Medium | Low (privacy caveats) |
| 7 | Tailwind v4 migration | Build speed, CSS-native config, unblocks `tw-animate-css` | Medium | Low–Medium |
| 8 | ESLint 10 / TypeScript 6 major bumps | Stay current; unblock future tooling upgrades | Small each | Medium (plugin/type-check compat) |

Each item is independently shippable. 5 and 6 are complete. **Recommended order for what's
left: 7 → 8 → 4** — Tailwind v4 and the ESLint/TypeScript majors are pure build-tooling risk
with no external dependency, whereas item 4 (multi-instance) is gated on an actual
second-instance deployment being planned and isn't actionable until then. (The routine
patch/minor dependency bumps that don't need their own evaluation — see section 8 — already
landed and aren't tracked as a roadmap item.)

---

## 4. Multi-Instance: Swap the In-Process Hub for Postgres LISTEN/NOTIFY

**The constraint:** `lib/server/monitor-hub.ts` is an **in-process** pub/sub — a Map of
subscribers living in one Node process's memory. That is correct for the current
**single Docker container** deployment (same assumption as the rate limiter and TTL
cache).

**Where it breaks:** if you ever run **two or more app instances** behind a load
balancer, the model silently degrades. A voter's ballot commits on instance A → A
computes and broadcasts → but an admin whose SSE connection landed on instance B is
subscribed to *B's* hub, which never heard about it. Admins would only see updates from
votes that happened to hit their own instance. No error, just stale monitors — the
nastiest kind of bug.

**The fix — Postgres LISTEN/NOTIFY,** which turns the database into the shared message
bus every instance already connects to:

- On a state change, instead of only calling the local hub, also
  `NOTIFY monitor_channel, '<electionId>'` (a one-line `$executeRaw` in
  `lib/server/monitor-broadcast.ts`, next to the existing `publish()` call).
- Each app instance holds **one dedicated pg connection** running
  `LISTEN monitor_channel`. When *any* instance notifies, *every* instance's listener
  fires, recomputes (or receives) the frame, and pushes to its own locally-connected SSE
  subscribers.

### Implementation notes

- **Dedicated connection, not the pool.** `LISTEN` must run on a long-lived
  `pg.Client`, not the Prisma adapter's `pg.Pool` (pooled connections are recycled and
  the listener dies silently). Create it lazily in a new `lib/server/monitor-bus.ts`,
  park it on `globalThis` (same HMR pattern as `monitor-hub.ts`), and reconnect with
  backoff on `error`/`end` — a dropped listener must self-heal, and a reconnect should
  trigger one catch-up recompute per election with live subscribers.
- **Payload = electionId only.** `NOTIFY` payloads are capped at ~8000 bytes and monitor
  frames are far larger, so each instance recomputes on receipt. The existing
  per-election coalescing in `scheduleMonitorRefresh` already collapses bursts; route the
  listener callback through it so N instances × M votes never stampede the DB.
- **Snapshot writes stay safe.** `recordSnapshot`'s `(electionId, bucket)` unique
  constraint already dedupes concurrent writers, so multiple instances persisting the
  same 30s bucket collapse to one row — no changes needed.
- **Callers don't change.** Keep the `publish`/`subscribe` surface of `monitor-hub.ts`
  intact; `monitor-broadcast.ts` gains the NOTIFY, `monitor-bus.ts` bridges NOTIFY →
  `scheduleMonitorRefresh` → local `publish`. Guard against double-compute on the
  originating instance (it already computed before notifying — e.g. skip self-notifies
  via a per-instance UUID in the payload: `'<electionId>:<instanceId>'`).

### Explicit scope limits

LISTEN/NOTIFY fixes **only the monitor bus**. True multi-instance also needs:

- Rate limiting moved to a shared store (Redis, or a Postgres counter table) — otherwise
  limits multiply by instance count and the per-email login throttle weakens.
- The TTL cache is merely suboptimal multi-instance (N single-flights instead of 1) —
  acceptable to leave.
- The SSE connection cap becomes per-instance — acceptable (document it).

Ship the whole set behind one decision gate: do not run a second instance until the rate
limiter is shared, even if the monitor bus is done.

### Testing

- Unit: bus reconnect/backoff logic with a mocked client; self-notify skip.
- Integration (needs `DATABASE_URL_TEST`): two Node processes, ballot cast via
  `lib/server/cast-ballot.ts` in process A, assert process B's subscriber receives a
  frame.
- Manual: two `next start` instances on different ports against one DB, admin monitor
  open on B, vote through A.

---

## 5. Extract Audit Logging Into a Shared Wrapper

**The problem:** audit writes are hand-rolled inside each server action, spread across:

- `app/(admin)/admin/elections/[id]/control/actions.ts` — `auditLog.create` in four
  lifecycle actions (open, reschedule, advance, recount).
- `lib/server/close-election.ts` and `lib/election-transitions.ts` — close/scheduler
  entries.
- `app/(admin)/admin/actions.ts` — archive/restore entries.
- `app/(admin)/admin/accounts/actions.ts` — five `AdminAccountLog` writes (added
  2026-07-03).

Every author must remember the guard → validate → transaction → mutate → **log** →
revalidate sequence by hand; a forgotten log line is invisible until an incident needs
the trail.

**Status: complete — all four files migrated.** `lib/server/audited-action.ts` exists
and every action file listed above now uses it, all behavior-identical (verified by
existing/new unit tests, full gate green each time):

- `app/(admin)/admin/actions.ts` — `archiveElection`/`restoreElection`, onto the wrapper.
  Verified by the existing `tests/admin/archive-restore-race.test.ts` passing unchanged,
  plus `tests/server/audited-action.test.ts` for the wrapper itself.
- `app/(admin)/admin/elections/[id]/control/actions.ts` — `openElectionNow`,
  `rescheduleElection`, `advanceToScheduled`, `initiateRecount`, and (in a later pass)
  `closeElectionNow` all migrated. `tests/admin/control-lifecycle-actions.test.ts` covers
  row-lock ordering, domain-check passthrough, and the success/broadcast/revalidate paths
  for all five (no test existed for this file before). One deliberate note preserved from
  the original code: `initiateRecount` throws plain `Error` (not
  `TransitionValidationError`) for its three validation failures, because the
  pre-existing behavior always collapsed them to the generic "Recount failed" message
  rather than surfacing the specific reason — the wrapper's generic-error fallback
  reproduces that exactly, so this was left as-is rather than "fixed" as part of a
  behavior-identical migration.
- `lib/server/close-election.ts` — `closeElectionWithCertification`'s transaction body
  was extracted into a new exported `closeElectionCore(tx, electionId, actor,
  allowedStatuses, auditActionOverride)` that takes an already-open `tx` instead of
  opening its own. `closeElectionWithCertification` is now a thin wrapper —
  `prisma.$transaction((tx) => closeElectionCore(...))` — with an unchanged public
  signature and behavior, so its other two callers (`lib/election-transitions.ts`'s cron
  sweep, for both the OPEN→CLOSED and missed-window SCHEDULED→CLOSED cases) needed **zero
  changes**. `closeElectionNow` (the one genuine "admin action" caller) migrated onto
  `auditedAction`, whose `run` does its own row-locked pre-check (reproducing the
  friendly `canManuallyClose` message via `TransitionValidationError`, closing a
  pre-existing TOCTOU gap — the original pre-check ran outside any transaction/lock) and
  then calls `closeElectionCore` on the wrapper's own `tx`. `closeElectionCore` re-locks
  and re-checks status internally too — deliberate, harmless redundancy inside the same
  already-held lock, kept so `closeElectionWithCertification`'s cron-facing contract
  didn't need to change at all.
- `app/(admin)/admin/accounts/actions.ts` — all five actions (`createAdmin`,
  `updateAdminRole`, `resetAdminPassword`, `resetAdminOfficerKey`, `deleteAdmin`)
  migrated, including `isolationLevel: Serializable` + `mapError` (P2002 duplicate-email
  for `createAdmin`; P2034 serialization-conflict for both `createAdmin` and
  `resetAdminOfficerKey`). New `tests/admin/accounts-actions.test.ts` (26 tests; no test
  existed for this file before) mocks `bcryptjs` with fast tagged stand-ins so the suite
  doesn't pay real cost-12 hashing time. Two disclosed, deliberate behavior changes here
  (not silent regressions):
  - **Transaction duration:** `createAdmin`/`resetAdminOfficerKey` used to `bcrypt.hash`
    *before* opening their transaction; since `auditedAction`'s `run` always executes
    inside an already-open transaction, hashing now happens inside it, extending a
    Serializable transaction by ~tens of ms. Accepted: these are rare, low-concurrency,
    admin-only actions, not the ballot-casting hot path.
  - **Uniform error safety net:** `updateAdminRole`, `resetAdminPassword`, and
    `deleteAdmin` previously had no catch-all around their transaction at all (an
    unexpected DB error propagated uncaught); `createAdmin`/`resetAdminOfficerKey` only
    caught two specific error codes and rethrew everything else. All five now get
    `auditedAction`'s uniform net — an unexpected error is logged and returns a friendly
    generic message instead of crashing. This is exactly the class of gap section 5 exists
    to close, not a regression.

**The shape actually implemented** (adjusted from the original sketch below during
implementation — see note):

```ts
export function auditedAction<Args extends unknown[]>(opts: {
  name: string; // console.error log tag on unexpected failure
  capability: Capability;
  errorMessage: string; // generic fallback message
  isolationLevel?: Prisma.TransactionIsolationLevel;
  run: (tx: Prisma.TransactionClient, session: Session, ...args: Args) => Promise<void>;
  mapError?: (error: unknown) => string | null; // recognize e.g. P2002/P2034 → friendly message
}): (...args: Args) => Promise<ActionResult>
```

- The wrapper owns: capability guard (`requireCapabilityOrError`), the
  `prisma.$transaction` (with optional isolation level), and the standard
  `{ success, error }` result mapping, including `TransitionValidationError` passthrough
  and an optional `mapError` hook for recognized Prisma errors (unique-constraint,
  serialization conflict) that need a friendlier message than the generic fallback.
- **Deviation from the original sketch:** the audit write itself stays inside the
  caller's `run` callback rather than being pulled out into a separate `audit` builder
  parameter. `AuditLog` and `AdminAccountLog` have different shapes and are deliberately
  not unified (see Non-goals below), so a generic `audit(args, session, outcome) =>
  AuditEntry | AdminAccountEntry` parameter would need a runtime discriminant anyway —
  no simpler than just calling `tx.auditLog.create(...)` or
  `tx.adminAccountLog.create(...)` directly inside `run`, right next to the row lock and
  mutation it's paired with. This also directly serves the "row locks and status
  re-checks must stay easy to keep, not hidden" requirement: `run` is exactly the
  guard → validate → mutate → log sequence, in one place, per action.
- The per-action audit-row *builders* (e.g. `app/(admin)/admin/accounts/account-log.ts`)
  are unaffected and still called from inside `run`.
- **Migrate incrementally**: one actions file per PR, behavior-identical, with the
  existing tests as the safety net. Do not change audit strings — the history UI and any
  operator muscle memory depend on them.
- Row locks (`SELECT ... FOR UPDATE`) and status re-checks inside transactions are
  load-bearing (double-fired cron, concurrent admins). They stay inside `run`, unchanged.

**Non-goals:** do not unify `AuditLog` (election-scoped) and `AdminAccountLog`
(account-scoped) into one table — they were deliberately separated because the account
log must survive election cascade-deletes and account deletion.

---

## 6. Add OpenTelemetry Traces

**Status: implemented.** All items below are done and merged:

- `instrumentation.ts` (bootstrap, gated behind `OTEL_EXPORTER_OTLP_ENDPOINT`) +
  `@vercel/otel` + `@prisma/instrumentation` for Prisma query spans.
- `lib/server/otel.ts` — the `withSpan` helper + span-attribute allowlist (see below;
  this is the "unit-testable attribute-allowlist helper" this section called for),
  covered by `tests/server/otel.test.ts`.
- Custom spans on all five call sites listed in the adoption path, plus the
  `auditedAction` wrapper (every admin action now gets an `admin_action.<name>` span
  with an `admin.role` attribute for free, per the note in step 3 below).
- `lib/prisma.ts`'s `SLOW_QUERY_MS` console logger was deliberately **left in place**
  (per step 2's "keep both until the trace pipeline is trusted") — removing it is a
  future cleanup once traces have been observed against a real collector in production.

**Overhead measured (closes the gap from the first pass at this section).** Verified
end-to-end against a real local OTLP/HTTP collector (a throwaway Node HTTP server
accepting `POST /v1/traces`, run manually — not part of the repo): with
`OTEL_EXPORTER_OTLP_ENDPOINT` pointed at it and `OTEL_EXPORTER_OTLP_PROTOCOL=http/json`
(the default `http/protobuf` also exports successfully — 200 OK — but a JSON receiver is
easier to eyeball for a one-off check), `instrumentation.ts`'s `register()` plus nested
`withSpan` calls (mirroring the real `monitor.schedule_refresh` /
`monitor.compute_and_broadcast` parent/child shape) produced exactly the expected span
names at the collector, batched and delivered successfully. Measured overhead per
`withSpan` call (Node `process.hrtime`, 20k/2k-iteration loops around a trivial
async no-op):
- Tracing off (default — no SDK registered, `@opentelemetry/api`'s no-op tracer):
  **~1.7µs/call**, indistinguishable from a raw `await` with no span at all.
- Tracing on (real SDK registered, spans recorded and queued for export):
  **~145µs/call**.

Both are 2–3 orders of magnitude below a single Postgres round-trip (low
single-digit milliseconds even on a fast local connection), which dominates every
instrumented call site (`castVerifiedBallot`'s transaction, `computeResultsAggregate`'s
queries, etc.) — so per the Definition of Done's "no visible latency change on the
ballot path," the overhead is not visible in practice. This was a manual, one-off
verification (a throwaway script + receiver, not a committed test) since there is no
OTLP collector wired into local dev/CI by default and adding one is out of scope here —
re-run the same check against a real collector (Tempo/Jaeger) before leaning on this
signal for a specific production SLA.

**The driver:** production issues (slow tallies on election day, a wedged monitor
refresh, pool exhaustion) are currently debugged from `console.error` lines and the
custom slow-query log in `lib/prisma.ts`. Distributed traces make the request →
server-action → transaction → broadcast chain visible.

### Adoption path

1. **Bootstrap:** add `instrumentation.ts` at the repo root (first-class in Next 16) and
   register via `@vercel/otel` (works self-hosted; exports OTLP) or the raw
   `@opentelemetry/sdk-node` if more control is needed. Export to any OTLP collector
   (Grafana Tempo / Jaeger in a compose sidecar for local use); configure endpoint +
   sampling via env, default **off** when `OTEL_EXPORTER_OTLP_ENDPOINT` is unset so dev
   and CI stay unaffected.
2. **Prisma spans:** enable Prisma tracing (`@prisma/instrumentation`) so each query
   becomes a child span. This supersedes the ad-hoc `SLOW_QUERY_MS` logger in
   `lib/prisma.ts` eventually — keep both until the trace pipeline is trusted, then
   remove the custom logger.
3. **Custom spans on the paths that matter** (thin `startActiveSpan` wrappers; if
   section 5's `auditedAction` wrapper exists, instrument it once and every admin action
   gets a span for free):
   - `castVerifiedBallot` (the transaction, with `election.id` only),
   - `computeResultsAggregate` / `computeAdminMonitorPayload`,
   - `scheduleMonitorRefresh` (queue-wait vs compute time),
   - cron sweep (`applyScheduledTransitions`),
   - results route cache hit/miss.

### Privacy constraints (non-negotiable, see section 2.3)

Span attributes and events must **never** contain: `voterCode` / control numbers,
`studentId`, receipt codes or hashes, officer keys, password material, or per-candidate
selections tied to a request. Allowed: election IDs, position IDs, aggregate counts,
durations, admin **role** (not email) on admin-action spans. Add a unit-testable
attribute-allowlist helper rather than relying on reviewer vigilance, and document the
rule in the instrumentation module header.

### Definition of done

- [x] Traces visible end-to-end for: a ballot cast (action → transaction → monitor
  refresh → snapshot write), a results poll (cache hit and miss), and a cron sweep.
  `ballot.cast_transaction` → (fire-and-forget) `monitor.schedule_refresh` →
  `monitor.compute_and_broadcast` (child span, snapshot write inside it) is the traced
  chain for a vote; `results.get_aggregate` (with `cache.hit`) is the results-poll span;
  `cron.transition_sweep` is the cron span. Confirmed against a real local OTLP
  collector — see "Overhead measured" above for the parent/child export verification.
- [x] Zero PII in spans, enforced by the allowlist helper (`lib/server/otel.ts`) + a
  test (`tests/server/otel.test.ts`, including a case that asserts PII-shaped keys like
  `voterCode`/`studentId`/`officerKey` are rejected).
- [x] Overhead measured: ~1.7µs/call with tracing off, ~145µs/call with a real SDK
  registered and exporting — both negligible next to a single Postgres round-trip. See
  "Overhead measured" above for methodology.

---

## 7. Tailwind v4 Migration

**The driver:** three things converge here, none individually urgent:

- `tw-animate-css` has been a `package.json` dependency since the dropdown-animation work
  (PR #18) but **does nothing** — it's the Tailwind v4-only replacement for
  `tailwindcss-animate`, ships `@utility`/`@property` rules that only Tailwind v4's engine
  understands, and was never imported or registered as a plugin in this v3 project.
  Confirmed empirically: the compiled dev CSS output contains zero occurrences of
  `.animate-in` / `.fade-in-0` / `.zoom-in-95`. This means `components/ui/dialog.tsx`,
  `components/admin/confirm-dialog.tsx`, and `components/admin/toast-view.tsx` — which all
  reference those classes via `data-open:animate-in data-open:fade-in-0 ...` — currently
  have **no entrance/exit animation at all**; the classes are silently dead. (PR #18's
  dropdown animations for `ThemedSelect`/`RowActions` sidestepped this by hand-writing real
  `dropdown-in`/`dropdown-out` keyframes directly in `tailwind.config.ts` instead of relying
  on the package — that still works fine post-migration, or can be ported into `@theme`.)
- Tailwind v4's CSS-first `@theme` config replaces `tailwind.config.ts`, which would let
  `tw-animate-css` (or any equivalent) work as intended, removes the need to hand-roll
  keyframes for every new animation, and drops the `content: [...]` glob list in favor of
  automatic content detection.
- Build speed: v4's Oxide (Rust) engine is materially faster than v3's JS pipeline — a
  bigger win once this project's Tailwind surface grows past the current admin/public/ballot
  theme set.

**Not urgent:** the specific dead-class bug above can be fixed today, without upgrading
anything, the same way PR #18 fixed the dropdown case — hand-written keyframes in
`tailwind.config.ts` (`theme.extend.keyframes`/`animation`) plus `data-[state=open]:`/
`data-[state=closed]:` Tailwind v3 arbitrary-attribute variants (native since v3.4, no
plugin needed). Do that first if the dead animations need fixing before this migration is
scheduled.

### Adoption path (mirror the Next.js migration's staged approach — section 10)

1. **Baseline**: screenshot the four public pages, the admin dashboard/filter groups, the
   ballot flow, and the results page (light + the ballot-paper theme) before touching
   anything, so visual regressions are easy to spot. This project's design system leans
   heavily on hard-coded hex tokens (`navy`, `navy-deep`, `gold`, `maroon`,
   `admin-bg`/`admin-surface`/`admin-raised`/`admin-overlay`, `ballot-bg`/`ballot-paper`/
   etc. in `tailwind.config.ts`) plus custom font-family CSS vars — the highest-risk
   regression surface is these tokens silently resolving differently, not missing utility
   classes (v4's codemod handles those).
2. **Run the codemod**: `npx @tailwindcss/upgrade` against this repo. Expect it to rewrite
   `tailwind.config.ts`'s `theme.extend` into an `app/globals.css` `@theme` block,
   swap the PostCSS plugin (`tailwindcss` → `@tailwindcss/postcss`), and flag anything it
   can't auto-migrate.
3. **Re-verify shadcn/Radix Nova components**: `components.json` and `components/ui/*.tsx`
   were generated against the v3 shadcn CLI; check whether shadcn's v4 component variants
   changed anything import-path- or class-name-wise (the `cn()` helper, `class-variance-authority`
   usage, Radix primitives themselves are unaffected — those aren't Tailwind-version-coupled).
4. **Wire up `tw-animate-css` properly** (or keep the hand-rolled keyframes from PR #18 —
   either works under v4; don't do both for the same animation).
5. **Full verification gate** (section 9) plus the manual visual smoke pass from step 1,
   comparing against the baseline screenshots.

### Definition of done

- [ ] `tailwind.config.ts` retired in favor of `@theme` in `app/globals.css` (or confirmed
  intentionally kept, if the codemod recommends a hybrid setup).
- [ ] All brand/admin/ballot color tokens and custom font families render identically to
  the pre-migration baseline screenshots.
- [ ] `tw-animate-css`'s utilities resolve for real (or the PR #18 hand-rolled keyframes are
  confirmed to still work) — `Dialog`/`ConfirmDialog`/`Toast` actually animate open/close
  for the first time.
- [ ] Full verification gate (section 9) green; no visual regressions in the manual smoke
  pass.

---

## 8. Other Major Dependency Upgrades to Evaluate

**Status: the safe batch already landed** (patch/minor bumps, all within existing
`package.json` semver ranges, no version-range edits needed): `@auth/prisma-adapter`,
`@prisma/adapter-pg`, `@prisma/client`, `prisma` (kept in lockstep at 7.8.0),
`@react-pdf/renderer`, `@vitest/coverage-v8`, `lucide-react`, `next-auth`
(`5.0.0-beta.30` → `5.0.0-beta.31`), `pg`, `radix-ui`, `shadcn` (the CLI, not a runtime
dependency), `tailwind-merge`, `@types/node` (patch within the `^20` range), and `vitest`.
Verified with the full gate (typecheck/lint/453 tests/coverage/build) plus a live
dev-server smoke test: admin login (next-auth), the `ThemedSelect` Radix dropdown
(radix-ui), icon rendering (lucide-react), and the PR #18 filter-group toggle all still
work with zero page errors.

**Left deliberately untouched — each needs its own evaluation, not a drive-by bump:**

- **ESLint 9 → 10** (major). `eslint-config-next` is pinned to `16.2.10`; confirm it (and
  any other ESLint plugins in use) declare ESLint 10 support before jumping — flat-config
  major version bumps have a history of breaking plugin compatibility. Check
  `eslint-config-next`'s own release notes for a matching Next 16.2.x + ESLint 10 combo
  before attempting.
- **TypeScript 5.9 → 6.0** (major, very recent release as of this writing). Likely
  low-risk for a codebase this consistently typed (TS majors are usually stricter checks
  plus removed deprecated APIs, not breaking syntax changes), but run a dedicated
  `tsc --noEmit` pass across the whole repo first, and re-check `eslint-config-next`'s
  type-aware rules and `next.config.mjs` against it before merging.
- **`tailwindcss` 3 → 4** — already tracked as its own staged migration; see section 7.

**Not worth chasing:**

- `@types/node`'s npm "latest" (major v26) — this project's `engines.node` floor is
  `>=20.9.0`; jumping the *types* package to a major ahead of the actual Node runtime
  would describe APIs that may not exist at runtime. Stay on the `^20` range and take
  patches only (already current as of the batch above).
- `next-auth`'s npm "latest" dist-tag (`4.24.14`) — misleading; npm's `latest` tag points
  at the last stable v4 release because v5 is still in beta and untagged. This project is
  intentionally on the actively-developed v5 beta line (`auth.ts`/`auth.config.ts` target
  v5's APIs) — that tag is not a real upgrade candidate, let alone a downgrade one.

Re-run `npm outdated` periodically; re-file this section's "safe batch" the same way each
time one accumulates (same-day patch/minor bumps, full gate, brief smoke test) rather than
holding routine bumps hostage to the majors above.

---

## 9. Verification Gate (Reusable, for Every PR From This Handoff)

Automated:

```bash
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
PLAYWRIGHT_HTML_OPEN=never npm run test:e2e
npm audit --omit=dev
```

Manual smoke (full list — run all of it for auth/infra changes, the relevant subset
otherwise):

- Admin login succeeds with password plus officer key; fails with friendly copy;
  officer-key rule still requires a different admin.
- SUPERADMIN-only pages redirect or deny correctly; role demotion takes effect within
  ~60s (token refresh).
- Account mutations appear in the history page's Account changes section.
- Voter control-number validation; grade-filtered ballot; abstention flow; review and
  submit; double-vote prevention; confirmation page with receipt.
- Receipt verification works once, then reports already verified; rate-limit copy shows
  after hammering.
- Public results hidden until CLOSED; admin monitor live updates over SSE (and replay
  snapshots survive a refresh).
- Results PDF renders; voter CSV export downloads.
- `/api/cron/transition-elections` with valid and invalid bearer token.
- `/admin-help` unlock with existing officer-key policy.
- App behaves behind the expected reverse proxy or tunnel host.

Review: run code review after each code-changing stage; security review for anything
touching auth, voting, exports, or telemetry. Block on CRITICAL, fix HIGH before merge,
document MEDIUM/LOW in the PR.

---

## 10. Archive: Next.js 16 Migration (Complete)

Kept for the record; details live in git history and PRs #9–#11.

- **Stage 1** (PR #9): Next 14 → 15, React 19, async request APIs (`params`,
  `searchParams`, `cookies()`, `headers()` all Promise-based; no `UnsafeUnwrapped*`
  casts remain).
- **Stage 2** (PR #10): Next 15 → 16.2.10. `middleware.ts` → `proxy.ts` (exported
  function `proxy`; matcher covers `/admin/:path*`, `/vote/ballot/:path*`,
  `/vote/confirmed`). `next lint` → ESLint CLI with `eslint.config.mjs`. Turbopack for
  dev and build (no webpack fallback). `engines.node >=20.9.0`.
- **Stage 3** (PR #11): doc cleanup, audit re-check, branch cleanup.
- Do not run forced major framework upgrades in the future without repeating this staged
  approach (baseline → codemods → hand checks → full gate → manual smoke per stage).

## 11. Archive: Cache Components Evaluation (Declined 2026-07-03)

Evaluated on `chore/cache-components-evaluation` (never merged). Enabling
`cacheComponents: true` surfaced build failures on **18 of 31 routes (58%)** — each one
`next build` correctly identifying that the page reads session cookies, live election
status, or `new Date()` before request-bound data access, i.e. exactly the behavior these
pages are supposed to have. Fixing it would mean `<Suspense>`-wrapping nearly every page,
auditing 14+ `new Date()` call sites, rewriting route-handler error handling (Cache
Components signal bail-out by *throwing*, which existing `try/catch` blocks would
swallow), and validating the SSE stream against a caching model whose docs don't address
streaming responses. Benefit is minimal: no meaningful public static content exists; the
results page already has a bespoke TTL/single-flight cache; the monitor is inherently
live.

**Decision: do not adopt Cache Components.** Revisit only if genuine public static/ISR
content emerges, or a later Next.js release narrows the constraints for auth-gated apps.
