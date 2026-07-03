# Handoff: Next.js 16 Migration Status

Updated: 2026-07-03
Branch: `chore/next-16-upgrade`
Base: `main` at merge commit `60cf257`

This file is the working handoff for the staged Next.js migration. Stage 1 has merged, and
Stage 2 has been implemented on `chore/next-16-upgrade`.

Migration status:

1. Baseline and Stage 1: complete. Next.js 14 -> 15 and React 19 merged through PR #9.
2. Stage 2: implemented on this branch. Next.js 15 -> 16, proxy convention, ESLint CLI,
   Node engine floor, and Turbopack build verification are done.
3. Stage 3: still run after this branch is reviewed and merged to `main`.
4. Stage 4: optional Cache Components evaluation remains separate.

Do not fold optional Cache Components work into this branch.

---

## 1. Why This Migration Exists

The original driver was stale Next.js 14 production advisories that required a framework
major upgrade. The app has now moved through Next.js 15 and this branch moves it to
Next.js 16.2.10 without changing the database schema.

This is not a database migration. Do not modify `.env`, seed data, reset a database, or touch
real voter data for this work unless the user explicitly approves it.

The migration is worth doing, but it must be deliberate:

- Authentication, officer-key unlock, ballot submission, receipt verification, audit logs,
  result embargoes, CSV export, PDF export, and cron transitions are all load-bearing.
- The app relies on a header-sanitizing reverse proxy because rate limiting trusts
  `x-forwarded-for`.
- `proxy.ts` protects admin and ballot routes and must be re-tested carefully in review.

---

## 2. Sources To Re-Check Before Starting

Re-read these at execution time because Next.js 16, React 19, codemods, and package peers can
change between handoffs:

- Next.js 15 upgrade guide:
  `https://nextjs.org/docs/app/guides/upgrading/version-15`
- Next.js 16 upgrade guide:
  `https://nextjs.org/docs/app/guides/upgrading/version-16`
- Next.js Cache Components migration guide:
  `https://nextjs.org/docs/app/guides/migrating-to-cache-components`
- Next.js Turbopack reference:
  `https://nextjs.org/docs/app/api-reference/turbopack`
- React 19 upgrade guide:
  `https://react.dev/blog/2024/04/25/react-19-upgrade-guide`

Verified notes as of 2026-07-03:

- The current official Next docs list Next.js 16.2.10 as latest.
- Next.js 15 raises React to 19 and introduces async request-time APIs with temporary sync
  compatibility.
- Next.js 16 removes the sync compatibility for request-time APIs.
- Next.js 16 requires Node.js `>=20.9.0` and TypeScript `>=5.1.0`.
- Next.js 16 uses Turbopack by default for `next dev` and `next build`.
- Next.js 16 removes `next lint`; use ESLint directly.
- Next.js 16 deprecates the `middleware.ts` convention in favor of `proxy.ts`; the codemod
  can perform this rename.
- Cache Components require Next.js 16 and should be a separate follow-up, not part of the
  framework upgrade PR.

---

## 3. Current Repo Inventory

Migration-relevant files after Stage 2:

```text
package.json
package-lock.json
next.config.mjs
eslint.config.mjs
proxy.ts
tsconfig.json
app/**/*
lib/**/*
tests/**/*
```

Current package state:

| Package | Current | Migration note |
| --- | --- | --- |
| `next` | `16.2.10` | Stage 2 upgrade complete. |
| `react`, `react-dom` | `19.2.7` | React 19 upgrade complete. |
| `eslint`, `eslint-config-next` | `9.39.4`, `16.2.10` | ESLint CLI migration complete via `eslint.config.mjs`. |
| `next-auth` | `^5.0.0-beta.30` | Confirm current Auth.js beta compatibility with React 19 and Next 16 before upgrading. |
| `@auth/prisma-adapter` | `^2.11.1` | Check peer range with the selected Auth.js release. |
| `@react-pdf/renderer` | `^4.3.2` | Verify React 19 peer support; retest results PDF route. |
| `radix-ui` | `^1.4.3` | Verify React 19 peer support. |
| `lucide-react` | `^1.7.0` | Verify React 19 peer support. |
| `prisma`, `@prisma/client` | `^7.6.0` | Low framework risk; do not change schema for this migration. |
| `typescript` | `^5` | Meets Next 16's `>=5.1.0` floor. |
| `@types/node` | `^20` | Compatible with the Next 16 Node floor. |
| `engines.node` | `>=20.9.0` | Added for Next 16 runtime support. |

Current scripts:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:e2e": "playwright test",
  "test:coverage": "vitest run --coverage"
}
```

`next lint` is no longer used. `eslint.config.mjs` extends Next core-web-vitals and
TypeScript configs, ignores generated output, and keeps the new
`react-hooks/set-state-in-effect` rule off to avoid unrelated UI refactors in the framework
upgrade branch.

---

## 4. Async Request API Checklist

Complete as of Stage 2. `cookies()` and `headers()` are awaited in:

- `lib/voter-session.ts`
- `lib/ballot-confirmation.ts`
- `lib/admin-help-access.ts`
- `lib/server/rate-limit.ts`
- `app/vote/actions.ts`
- `app/admin-help/actions.ts`
- `app/api/ballot-confirmation/route.ts`

The Stage 1 synchronous `params` / `searchParams` call sites were migrated to Promise-based
access:

```text
app/(admin)/admin/page.tsx                                  searchParams.denied
app/(admin)/admin/elections/[id]/candidates/page.tsx        params.id
app/(admin)/admin/elections/[id]/control/page.tsx           params.id
app/(admin)/admin/elections/[id]/monitor/page.tsx           params.id
app/(admin)/admin/elections/[id]/voters/page.tsx            params.id
app/api/results/[id]/route.ts                               params.id
app/api/elections/[id]/monitor/stream/route.ts              params.id
app/api/elections/[id]/monitor-snapshots/route.ts           params.id
app/api/elections/[id]/results-pdf/route.ts                 params.id
app/api/elections/[id]/voters/export/route.ts               params.id
```

The expected pattern is now:

```ts
type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ControlPage({ params }: PageProps) {
  const { id } = await params;
  // Use id instead of params.id below.
}
```

For route handlers, use the same pattern:

```ts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
}
```

Do not leave any `UnsafeUnwrapped*` temporary sync casts behind. Next.js 16 removes that
compatibility path.

---

## 5. Stage 0: Pre-Flight Baseline

Branch:

```bash
git switch main
git pull --rebase
git switch -c chore/next-migration-preflight
```

Run and record the current baseline:

```bash
node --version
npm --version
npm ci
npx next info
npm audit --omit=dev
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
PLAYWRIGHT_HTML_OPEN=never npm run test:e2e
```

Expected result:

- All checks pass on `main` before package upgrades begin.
- The audit output is saved in the PR description or commit notes for comparison.
- Any failing baseline check is fixed or documented before moving to Next 15.

Pre-flight package checks:

```bash
npm view next version
npm view next@15 version
npm view next@16 version
npm view react version
npm view react-dom version
npm view next-auth version peerDependencies
npm view @auth/prisma-adapter version peerDependencies
npm view @react-pdf/renderer version peerDependencies
npm view radix-ui version peerDependencies
npm view lucide-react version peerDependencies
```

If peer ranges conflict, pick compatible package versions deliberately. Do not use
`--force` or `--legacy-peer-deps` as the default path.

Pre-flight code searches:

```bash
rg -n "cookies\\(|headers\\(|draftMode\\(|params|searchParams" app lib
rg -n "useFormState|ReactDOM.render|findDOMNode|defaultProps|propTypes|forwardRef" app lib tests
rg -n "next lint|eslint|serverRuntimeConfig|publicRuntimeConfig|next/config|middleware|proxy" .
rg -n "next/image|<Image" app
```

Use these results to update this file if the checklist has drifted.

Commit only documentation or baseline fixes in Stage 0:

```bash
git add HANDOFF.md
git commit -m "docs: plan next 16 migration"
```

---

## 6. Stage 1: Next.js 14 -> 15 And React 19

Branch:

```bash
git switch main
git pull --rebase
git switch -c chore/next-15-upgrade
```

Recommended command path:

```bash
npx @next/codemod@canary upgrade 15
npx codemod@latest react/19/migration-recipe
npx @next/codemod@canary next-async-request-api .
npm install
```

Manual fallback if the upgrade codemod cannot target 15 cleanly:

```bash
npm install next@15 react@19 react-dom@19 eslint-config-next@15
npm install --save-dev @types/react@19 @types/react-dom@19
npx @next/codemod@canary next-async-request-api .
```

Required hand checks after codemods:

- `package.json`: `next`, `react`, `react-dom`, `eslint-config-next`,
  `@types/react`, and `@types/react-dom` are on the intended major versions.
- `package-lock.json`: no unexpected package downgrades.
- The 10 files in Section 4 use async `params` / `searchParams`.
- No `UnsafeUnwrappedCookies`, `UnsafeUnwrappedHeaders`, or `UnsafeUnwrappedDraftMode`
  imports remain.
- No React 19 codemod leftovers remain.
- Auth.js still reads sessions correctly in `proxy.ts`.
- Server actions still return the same user-facing errors.
- `app/api/elections/[id]/results-pdf/route.ts` still renders a PDF under React 19.
- `app/api/elections/[id]/monitor/stream/route.ts` still streams admin monitor updates.

Useful verification commands during Stage 1:

```bash
rg -n "UnsafeUnwrapped|cookies\\(\\)\\.|headers\\(\\)\\.|draftMode\\(\\)\\." app lib
rg -n "params: \\{ id: string \\}|searchParams: \\{" app
npm run typecheck
npm run lint
npm test
npm run build
PLAYWRIGHT_HTML_OPEN=never npm run test:e2e
npm audit --omit=dev
```

Manual smoke required before merging Stage 1:

- Admin login with password and officer key.
- Failed admin login and wrong officer key copy.
- SUPERADMIN-only `/admin/accounts` guard.
- Voter control-number validation.
- Grade-filtered ballot rendering.
- Ballot review and submission.
- Double-vote prevention.
- Confirmation page and receipt verification.
- Public results hidden before election close.
- Admin monitor live updates.
- Results PDF generation for a closed election.
- Voter CSV export.
- `/api/cron/transition-elections` with valid and invalid bearer token.
- `/admin-help` unlock with existing officer-key policy.

Rollback:

- Because this is branch-isolated, do not revert `main`.
- If the upgrade is blocked, leave notes in the PR and abandon the branch.

Merge gate:

- Typecheck, lint, unit tests, coverage, build, E2E, audit, and manual smoke are recorded.
- Code review has no CRITICAL or HIGH findings.
- Security review is completed because auth, middleware, user input, and export routes are
  in scope.

---

## 7. Stage 2: Next.js 15 -> 16

Status: implemented on `chore/next-16-upgrade`.

Commands used:

```bash
npx @next/codemod@canary upgrade latest --yes
npx @next/codemod@canary next-lint-to-eslint-cli . --force
npm install --save-dev eslint@9.39.4
```

Implemented changes:

- Upgraded `next` to `16.2.10`.
- Kept React at `19.2.7`.
- Renamed `middleware.ts` to `proxy.ts`; the exported function is `proxy`.
- Preserved proxy matcher coverage for `/admin/:path*`, `/vote/ballot/:path*`, and
  `/vote/confirmed`.
- Replaced `next lint` with `eslint .`.
- Added `eslint.config.mjs` and removed `.eslintrc.json`.
- Pinned `engines.node` to `>=20.9.0`.
- Kept `next build` on the default Next 16 Turbopack path; no webpack fallback is used.
- Accepted Next 16's `tsconfig.json` changes: `jsx: "react-jsx"` and
  `.next/dev/types/**/*.ts` in `include`.
- Updated the `jose` import hardening test to read `proxy.ts`.

Verification recorded on 2026-07-03:

```bash
npm run typecheck                           # pass
npm run lint                                # pass, 8 warnings
npm test                                    # pass, 50 files / 371 tests
npm run test:coverage                       # pass, branches 82.24%
npm run build                               # pass, Next.js 16.2.10 (Turbopack)
PLAYWRIGHT_HTML_OPEN=never npm run test:e2e # pass, 1 Chromium smoke test
npm audit --omit=dev                        # fails with 5 moderate advisories
```

Audit status:

- `npm audit --omit=dev` still reports 5 moderate vulnerabilities.
- Remaining advisories are through `@hono/node-server` under Prisma dev tooling and
  Next's bundled `postcss`.
- `npm audit fix --force` would install breaking/downgrade versions, so do not run it
  blindly.

Known warnings:

- `npm run lint` exits 0 but reports existing warnings in load scripts, one test mock, and
  NextAuth type augmentation.
- Playwright passes but the dev server logs a Next 16 `allowedDevOrigins` warning for
  `127.0.0.1` HMR access.

Manual smoke still recommended before merge:

Run the same manual smoke list from Stage 1. Pay extra attention to:

- Admin middleware/proxy redirects.
- Ballot cookie redirects.
- Admin monitor stream.
- PDF generation under Turbopack build output.
- Production start after build:

```bash
npm run build
npm run start
```

Rollback:

- Branch-isolated. Do not revert `main`.
- No database changes were made.

Merge gate:

- Typecheck, lint, unit tests, coverage, build, E2E, audit, and manual smoke are recorded.
- Code review should focus on `proxy.ts`, ESLint config, package versions, and the audit
  decision.
- Security review should focus on route protection and user input paths.

---

## 8. Stage 3: Post-Next-16 Stabilization

Branch:

```bash
git switch main
git pull --rebase
git switch -c chore/next-16-stabilization
```

Tasks:

- Re-run `npm audit --omit=dev` and record the new production vulnerability count.
- Remove any temporary webpack fallback if Turbopack is fixed.
- Remove any obsolete React 18 or Next 14 comments/workarounds.
- Update docs that mention the old stack:
  - `README.md`
  - `CLAUDE.md`
  - `AGENTS.md`, if present
  - this `HANDOFF.md`
- Re-run the full verification gate on `main`.
- Delete merged upgrade branches or stale worktrees.

Verification:

```bash
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
PLAYWRIGHT_HTML_OPEN=never npm run test:e2e
npm audit --omit=dev
```

---

## 9. Stage 4: Optional Cache Components Evaluation

Do not include this in the Next 16 upgrade PR. Cache Components change rendering and caching
semantics, so treat them as a separate feature migration after the app is already stable on
Next 16.

Branch:

```bash
git switch main
git pull --rebase
git switch -c chore/cache-components-evaluation
```

First pass:

```bash
rg -n "export const dynamic|export const revalidate|fetchCache|unstable_cache|cacheLife|cacheTag|use cache" app lib
```

Expected current hotspots:

- Many pages use `export const dynamic = "force-dynamic"`.
- Results polling uses the custom TTL/single-flight cache in `lib/server/ttl-cache.ts`.
- Election results and admin monitor behavior are correctness-sensitive.

Evaluation steps:

1. Read the current Cache Components guide.
2. Enable `cacheComponents: true` only on the evaluation branch.
3. Remove route segment configs one area at a time.
4. Let development/build errors identify uncached dynamic data.
5. Add `use cache`, `cacheLife`, `cacheTag`, or `<Suspense>` only where the guide and app
   behavior require it.
6. Do not cache voter-specific, admin-specific, receipt, auth, or election-control data
   unless the data ownership and invalidation rules are explicit.
7. Run all automated checks and the full manual smoke suite.

Non-goals:

- Do not rewrite the app's data model.
- Do not replace the custom results TTL cache unless a separate design proves it is safer.
- Do not change public election copy as part of the caching migration.

Decision gate:

- If Cache Components add complexity without measurable benefit, close the branch with notes.
- If they improve build/runtime behavior safely, open a separate PR with a narrow scope and a
  detailed test plan.

---

## 10. Verification Gate For Every Migration PR

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

Manual:

- Admin login succeeds with password plus officer key.
- Admin login fails with user-friendly copy for invalid credentials.
- Officer-key rule still requires a different admin where applicable.
- SUPERADMIN-only pages redirect or deny correctly.
- Voter control-number validation works.
- Ballot shows the correct grade-filtered choices.
- Abstention flow still works.
- Ballot review and submit still work.
- Double-vote prevention still blocks repeat submission.
- Confirmation page displays receipt information.
- Receipt verification works once and then reports already verified.
- Public results stay hidden until the election is closed.
- Admin monitor shows live totals and replay snapshots.
- Results PDF renders.
- Voter CSV export downloads.
- Cron transition route opens/closes elections with valid bearer auth only.
- `/admin-help` unlock still works with existing officer-key policy.
- The app behaves behind the expected reverse proxy or tunnel host.

Review:

- Run code review after each code-changing stage.
- Run security review for Stage 1, Stage 2, and any Cache Components PR.
- Block on CRITICAL findings.
- Fix HIGH findings before merge.
- Document MEDIUM and LOW findings in the PR.

---

## 11. Risk Register

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Missed async `params` or `searchParams` usage | Medium | Build/runtime failure on Next 16 | Use codemod, Section 4 checklist, `rg`, and typecheck. |
| Auth.js beta peer or proxy behavior changes | Medium | Admin/voter lockout | Check package peers first; smoke login and ballot redirects on every stage. |
| `proxy.ts` route protection regression | Medium | Protected routes exposed or over-blocked | Verify matcher and redirect behavior manually. |
| React 19 peer breakage in UI/PDF libraries | Medium | UI or PDF rendering failure | Check peer ranges; test PDF and key pages before merge. |
| ESLint CLI config drift | Medium | CI/lint failure | Keep `eslint.config.mjs` and `package.json` lint script in sync. |
| Turbopack production build exposes bundling issue | Medium | Build failure or runtime issue | Prefer fixing for Turbopack; use `--webpack` only as documented temporary fallback. |
| Image optimizer behavior changes | Low | Broken local images | Re-check `next/image` usage and configure `images.localPatterns` only if needed. |
| Cache Components over-caches sensitive data | Medium | Privacy/security issue | Keep Cache Components as separate stage; do not cache auth/voter/admin-specific data. |
| Rushed dependency `--force` creates hidden peer conflicts | Medium | Hard-to-debug runtime failures | Resolve peers intentionally; avoid `--force` and `--legacy-peer-deps`. |

---

## 12. Current Project State

The app is a Next.js 16.2 App Router project for school elections. It includes:

- Public landing, about, officers, creator, privacy, voter help, admin help, vote, verify,
  and results pages.
- Admin dashboard, accounts, candidates, voters, election control, live monitor, history,
  results, and login flows.
- Auth.js v5 beta with Prisma adapter.
- Prisma 7 and PostgreSQL 16.
- Vitest and Playwright test coverage.
- Security-sensitive rate limiting, receipt verification, audit logging, and cron election
  transitions.

Migration-adjacent shipped work before this handoff:

- Election lifecycle fixes around open/reschedule behavior.
- Atomic receipt-verification burn.
- Admin capability guards.
- Monitor polling cleanup.
- Unified tally logic in `lib/domain/tally.ts`.
- Missing FK indexes migration.
- Officer-key policy cleanup.
- Framework major upgrade work is implemented on `chore/next-16-upgrade`; residual audit
  advisories remain documented in Stage 2.

The next worker should review this branch, run the manual smoke checks, then merge it and
continue with Stage 3 stabilization on `main`.
