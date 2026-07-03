# Handoff: Eventual Next.js 16 Migration Plan

Updated: 2026-07-03
Branch: `main`
Current HEAD: `84f6105`

This file is the working handoff for migrating this app from Next.js 14.2 to Next.js 16.
Treat it as an execution plan, not permission to run a forced major upgrade on `main`.

The migration should be staged, reviewable, and reversible:

1. Stabilize the current Next.js 14 baseline.
2. Upgrade Next.js 14 -> 15 with React 19 and async request APIs.
3. Upgrade Next.js 15 -> 16.
4. After the app is stable on 16, evaluate optional Cache Components adoption.

Do not combine those stages into one PR.

---

## 1. Why This Migration Exists

`next@14.2.35` is the ceiling of the current major line in this project, while `npm audit
--omit=dev` has previously reported production advisories that require a Next major upgrade
to clear. The goal is to remove the stale framework security surface without breaking the
school election flows that are security- and data-critical.

This is not a database migration. Do not modify `.env`, seed data, reset a database, or touch
real voter data for this work unless the user explicitly approves it.

The migration is worth doing, but it must be deliberate:

- Authentication, officer-key unlock, ballot submission, receipt verification, audit logs,
  result embargoes, CSV export, PDF export, and cron transitions are all load-bearing.
- The app relies on a header-sanitizing reverse proxy because rate limiting trusts
  `x-forwarded-for`.
- `middleware.ts` protects admin and ballot routes and must be re-tested carefully when
  moving to Next.js 16's `proxy.ts` convention.

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

Migration-relevant files:

```text
package.json
package-lock.json
next.config.mjs
.eslintrc.json
middleware.ts
tsconfig.json
app/**/*
lib/**/*
tests/**/*
```

Current package state:

| Package | Current | Migration note |
| --- | --- | --- |
| `next` | `14.2.35` | Upgrade to 15 first, then 16. |
| `react`, `react-dom` | `^18` | Next 15 moves to React 19. Upgrade both with `@types/react` and `@types/react-dom`. |
| `eslint`, `eslint-config-next` | `^8`, `14.2.35` | Next 16 removes `next lint`; migrate `.eslintrc.json` to the supported ESLint CLI setup. |
| `next-auth` | `^5.0.0-beta.30` | Confirm current Auth.js beta compatibility with React 19 and Next 16 before upgrading. |
| `@auth/prisma-adapter` | `^2.11.1` | Check peer range with the selected Auth.js release. |
| `@react-pdf/renderer` | `^4.3.2` | Verify React 19 peer support; retest results PDF route. |
| `radix-ui` | `^1.4.3` | Verify React 19 peer support. |
| `lucide-react` | `^1.7.0` | Verify React 19 peer support. |
| `prisma`, `@prisma/client` | `^7.6.0` | Low framework risk; do not change schema for this migration. |
| `typescript` | `^5` | Confirm installed version is `>=5.1.0` before Next 16. |
| `@types/node` | `^20` | Compatible with the Next 16 Node floor, but pin runtime files too. |

Current scripts:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:e2e": "playwright test",
  "test:coverage": "vitest run --coverage"
}
```

`npm run lint` is expected to change during the Next 16 stage because `next lint` is removed.

---

## 4. Current Async Request API Checklist

`cookies()` and `headers()` are already awaited in the important server helpers found during
this handoff:

- `lib/voter-session.ts`
- `lib/ballot-confirmation.ts`
- `lib/admin-help-access.ts`
- `lib/server/rate-limit.ts`
- `app/vote/actions.ts`
- `app/admin-help/actions.ts`
- `app/api/ballot-confirmation/route.ts`

The remaining synchronous `params` / `searchParams` call sites found on 2026-07-03 are:

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

In Stage 1, each should become Promise-based, for example:

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
- Auth.js still reads sessions correctly in `middleware.ts`.
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

Branch:

```bash
git switch main
git pull --rebase
git switch -c chore/next-16-upgrade
```

Run only after Stage 1 has merged.

Recommended command path:

```bash
npx @next/codemod@canary upgrade latest
npm install
```

Expected codemod areas:

- Move supported Turbopack config from `experimental.turbopack` to top-level `turbopack` if
  such config exists later.
- Migrate `next lint` to the ESLint CLI.
- Rename deprecated `middleware.ts` convention to `proxy.ts`.
- Remove stabilized `unstable_` API prefixes if they exist later.
- Remove unsupported `experimental_ppr` segment config if it exists later.

Required manual changes:

1. Runtime floor:

   Add or update the runtime pinning files that exist by then.

   ```json
   {
     "engines": {
       "node": ">=20.9.0"
     }
   }
   ```

   If the repo has Docker, CI, deploy, or `.nvmrc` files at execution time, update them to
   Node `>=20.9.0` too.

2. Lint script:

   `package.json` must no longer contain `"lint": "next lint"`. Use the codemod result or
   set a direct ESLint command, for example:

   ```json
   {
     "scripts": {
       "lint": "eslint ."
     }
   }
   ```

   Keep the command compatible with the config generated by the codemod.

3. ESLint config:

   `.eslintrc.json` may need migration to the supported flat config path generated by the
   codemod. Keep the Next core-web-vitals and TypeScript rules active.

4. Middleware/proxy:

   If the codemod renames `middleware.ts` to `proxy.ts`, verify these points:

   - The exported function is named `proxy`.
   - The matcher still covers `/admin/:path*`, `/vote/ballot/:path*`, and `/vote/confirmed`.
   - The admin login redirect still works.
   - The voter ballot cookie redirect still works.
   - The confirmed-vote cookie deletion still works.

5. Turbopack:

   Next 16 uses Turbopack by default for build. Keep `next build` as the first choice. If
   Turbopack fails because of a real unsupported integration, use `next build --webpack` only
   as a temporary documented fallback and open a follow-up issue.

6. Images:

   Re-check `next/image` use. The current repo uses local SVG/static image paths without
   query strings, so the local image query-string breaking change should not apply. If new
   query-string image URLs exist by then, add explicit `images.localPatterns`.

7. Removed config:

   Confirm `next.config.mjs` does not use removed options:

   - `eslint`
   - `serverRuntimeConfig`
   - `publicRuntimeConfig`
   - AMP config
   - removed `devIndicators` options
   - deprecated `experimental.dynamicIO`
   - deprecated `experimental.useCache`

Verification commands:

```bash
rg -n "\"lint\": \"next lint\"|serverRuntimeConfig|publicRuntimeConfig|next/config|UnsafeUnwrapped|experimental\\.dynamicIO|experimental\\.useCache" .
rg -n "params: \\{ id: string \\}|searchParams: \\{" app
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
PLAYWRIGHT_HTML_OPEN=never npm run test:e2e
npm audit --omit=dev
```

Manual smoke:

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
- If Stage 2 cannot pass without `next build --webpack`, document the Turbopack blocker
  precisely and decide whether a temporary webpack build is acceptable for one release.

Merge gate:

- Typecheck, lint, unit tests, coverage, build, E2E, audit, and manual smoke are recorded.
- Code review has no CRITICAL or HIGH findings.
- Security review is completed because route protection and user input paths are in scope.

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
| Auth.js beta peer or middleware behavior changes | Medium | Admin/voter lockout | Check package peers first; smoke login and ballot redirects on every stage. |
| `middleware.ts` -> `proxy.ts` rename changes route protection | Medium | Protected routes exposed or over-blocked | Verify matcher and redirect behavior manually. |
| React 19 peer breakage in UI/PDF libraries | Medium | UI or PDF rendering failure | Check peer ranges; test PDF and key pages before merge. |
| `next lint` removal breaks CI | High | CI failure | Migrate lint script and config in Stage 2. |
| Turbopack production build exposes bundling issue | Medium | Build failure or runtime issue | Prefer fixing for Turbopack; use `--webpack` only as documented temporary fallback. |
| Image optimizer behavior changes | Low | Broken local images | Re-check `next/image` usage and configure `images.localPatterns` only if needed. |
| Cache Components over-caches sensitive data | Medium | Privacy/security issue | Keep Cache Components as separate stage; do not cache auth/voter/admin-specific data. |
| Rushed dependency `--force` creates hidden peer conflicts | Medium | Hard-to-debug runtime failures | Resolve peers intentionally; avoid `--force` and `--legacy-peer-deps`. |

---

## 12. Current Project State

The app is a Next.js 14.2 App Router project for school elections. It includes:

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
- Within-range audit fixes already applied; framework major upgrade remains.

The next worker should start with Stage 0, update this file if reality has drifted, then
proceed stage by stage.
