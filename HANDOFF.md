# Handoff: Project Status & Future Improvements

Updated: 2026-07-03
Branch: `main` at `851a6f0`

This file is the working handoff for the project. The staged Next.js 14 → 16 migration
(sections 8–9) and the 2026-07-03 security-hardening pass (section 1) are **complete and
merged to `main`**. The active content of this handoff is the future-improvements roadmap
in sections 4–6.

---

## 1. Current State

- **Stack:** Next.js 16.2.10 (App Router, Turbopack), React 19.2.7, Auth.js v5 beta,
  Prisma 7 + PostgreSQL 16, Vitest (55 files / 400 tests, 80% coverage gate), Playwright.
- **Framework migration:** complete. Next 14 → 15 → 16 merged via PRs #9–#11; Cache
  Components evaluated and declined (section 9).
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
| 5 | Extract audit logging into a shared wrapper | Consistency; audit writes are spread across actions | Small–Medium | Low |
| 6 | OpenTelemetry traces | Production debuggability | Medium | Low (privacy caveats) |

Each item is independently shippable. Recommended order: 5 → 6 → 4 (the wrapper cleans up
the code OTel will instrument; the multi-instance bus is only needed when a second
instance is actually planned).

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

**The shape of the fix:** Next.js server actions have no true middleware layer
(`proxy.ts` runs on the Edge runtime and cannot touch Prisma), so "middleware" here means
a **higher-order wrapper**, not HTTP middleware. Add `lib/server/audited-action.ts`:

```ts
export function auditedAction<Args, Result>(opts: {
  capability: Capability;
  audit: (args, session, outcome) => AuditEntry | AdminAccountEntry | null;
  run: (tx, args, session) => Promise<Result>;
}): (args: Args) => Promise<Result>
```

- The wrapper owns: capability guard (`requireCapabilityOrError`), the
  `prisma.$transaction`, writing the audit row **in the same transaction** as the
  mutation (the invariant the accounts actions already establish — keep it), and the
  standard `{ success, error }` result mapping including `TransitionValidationError`
  passthrough.
- The per-action `audit` builder stays pure and unit-testable — the pattern already
  exists in `app/(admin)/admin/accounts/account-log.ts`; generalize it rather than
  inventing a new one.
- **Migrate incrementally**: one actions file per PR, behavior-identical, with the
  existing tests as the safety net. Do not change audit strings — the history UI and any
  operator muscle memory depend on them.
- Row locks (`SELECT ... FOR UPDATE`) and status re-checks inside transactions are
  load-bearing (double-fired cron, concurrent admins). The wrapper must make them easy to
  keep, not hide them.

**Non-goals:** do not unify `AuditLog` (election-scoped) and `AdminAccountLog`
(account-scoped) into one table — they were deliberately separated because the account
log must survive election cascade-deletes and account deletion.

---

## 6. Add OpenTelemetry Traces

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

- Traces visible end-to-end for: a ballot cast (action → transaction → monitor refresh →
  snapshot write), a results poll (cache hit and miss), and a cron sweep.
- Zero PII in spans, enforced by the allowlist helper + a test.
- Overhead measured: no visible latency change on the ballot path with sampling at
  production settings.

---

## 7. Verification Gate (Reusable, for Every PR From This Handoff)

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

## 8. Archive: Next.js 16 Migration (Complete)

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

## 9. Archive: Cache Components Evaluation (Declined 2026-07-03)

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
