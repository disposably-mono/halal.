# Handoff & Next.js 16 Migration Plan

Updated: 2026-07-03
Branch: `main` · Current HEAD: `dce09ab fix(admin-help): accept already-set officer keys shorter than 8 at unlock`

This document is both a state handoff and the **staged plan for migrating this app from
Next.js 14 to Next.js 16**. The migration is the primary forward-looking work; everything
above it is the context a new worker needs before starting.

---

## 1. Why migrate (motivation)

`npm audit --omit=dev` currently reports **5 remaining production vulnerabilities** that
cannot be fixed within the current major range — they all require `npm audit fix --force`
major bumps. The dominant one is Next.js itself: **~18 advisories** against `next@14.2.35`
(RSC/Server-Components DoS, SSRF via WebSocket upgrades, HTTP request smuggling in
rewrites, image-optimizer DoS, cache poisoning, App-Router XSS with CSP nonces). These are
fixed **only in the 15.x / 16.x line** — `14.2.35` is the ceiling of the 14.x branch.
`npm audit fix --force` reports it would install `next@16.2.10`.

The safe, within-range fixes have already been applied (`1044aef`), taking prod-dep vulns
from 13 → 5. The remaining 5 close out with this migration. Secondary motivation: staying on
a supported Next major with security backports.

**This is deferred, not urgent-but-reckless.** The app runs behind a header-sanitizing
reverse proxy (see `CLAUDE.md` → Production Considerations), which blunts some of the
spoofing/DoS surface. Do the migration as a deliberate, tested effort — never a rushed
`--force` on `main`.

---

## 2. Current stack (migration-relevant)

| Package | Installed | Migration relevance |
| --- | --- | --- |
| `next` | `14.2.35` | Target `16.x`. Major bump, codemod-driven. |
| `react` / `react-dom` | `^18` (18.3.1) | Target **React 19**. Next 16's peer range is `^18.2.0 \|\| ^19.0.0`, so 19 is supported but not strictly forced; it is the intended pairing (the Next 15 guide moves the App Router to it). A codebase scan found **no** React-19-removed APIs, so this is essentially a version bump. |
| `next-auth` | `^5.0.0-beta.30` (Auth.js v5) | Confirm the React 19 / Next 16 compatible release; auth + middleware are load-bearing. |
| `@auth/prisma-adapter` | `^2.11.1` | Peer-check against the chosen Auth.js version. |
| `@react-pdf/renderer` | `^4.3.2` | React 19 peer support must be confirmed; may let us drop the `as unknown as ReactElement<DocumentProps>` cast in `app/api/elections/[id]/results-pdf/route.ts`. |
| `radix-ui` | `^1.4.3` | Confirm React 19 peer support. |
| `lucide-react` | `^1.7.0` | Confirm React 19 peer support. |
| `@prisma/client` / `@prisma/adapter-pg` | `^7.6.0` | Framework-agnostic; low risk. |
| `eslint` / `eslint-config-next` | `^8` / `14.2.35` | `next lint` is **removed in 16** (and the `eslint` option in `next.config` is gone) → migrate with the `next-lint-to-eslint-cli` codemod. |
| `engines.node` / TypeScript | *(unset)* / TS 5.x | Next 16 requires **Node 20.9+ (LTS)** and **TypeScript 5.1+**; Node 18 dropped. Pin an explicit floor. Dev host is Node 24. |

**Already done (reduces migration work):**

- `cookies()` / `headers()` are already `await`-ed everywhere (`lib/voter-session.ts`,
  `lib/ballot-confirmation.ts`, `lib/admin-help-access.ts`, `app/vote/actions.ts`,
  `lib/server/rate-limit.ts`, `app/api/ballot-confirmation/route.ts`,
  `app/admin-help/actions.ts`). The async-request-API migration for these is a no-op.
- Most pages already set `export const dynamic = "force-dynamic"`, so Next 15's
  "uncached-by-default" change is low-risk here.
- The hot polling endpoint `app/api/results/[id]/route.ts` uses a **custom TTL/single-flight
  cache** (`lib/server/ttl-cache.ts`), not Next's `fetch` cache, so it is insulated from
  Next caching-semantics changes.
- A codebase scan (2026-07-03) found **no** React-19-removed API usage — no `forwardRef`,
  `defaultProps`, `propTypes`, `ReactDOM.render`/`findDOMNode`, string refs, `createFactory`,
  or removed TS types (`ReactChild`/`ReactText`/etc.). The React 19 bump is low-risk here.

**Remaining async-API surface — the 9 files still using sync `params` / `searchParams`:**

```text
app/(admin)/admin/page.tsx                                  (searchParams.denied)
app/(admin)/admin/elections/[id]/candidates/page.tsx        (params.id)
app/(admin)/admin/elections/[id]/control/page.tsx           (params.id)
app/(admin)/admin/elections/[id]/monitor/page.tsx           (params.id)
app/(admin)/admin/elections/[id]/voters/page.tsx            (params.id)
app/api/results/[id]/route.ts                               (params.id)
app/api/elections/[id]/monitor-snapshots/route.ts           (params.id)
app/api/elections/[id]/results-pdf/route.ts                 (params.id)
app/api/elections/[id]/voters/export/route.ts               (params.id)
```

Each becomes `params: Promise<{ id: string }>` (or `searchParams: Promise<…>`) plus an
`await`. The `@next/codemod next-async-request-api` transform handles most of this; the list
above is the exact set to verify by hand.

---

## 3. Migration strategy

- **Incremental, one major per branch/PR: 14 → 15 (+React 19) → 16.** Do **not** jump
  straight to 16. Each major has its own codemod and its own failure modes; stepping through
  15 makes breakage bisectable.
- **Codemod-first.** Use `npx @next/codemod@canary upgrade latest` (or pin the target major)
  and the React 19 recipe, then hand-fix what the codemods miss.
- **Verification gate on every stage** (Section 7). No stage merges until typecheck, lint,
  unit tests, build, e2e, and the manual auth/voting/results smoke all pass.
- **The database is not involved.** This upgrade needs no schema/migration changes — do not
  touch `.env`, seed, or the DB.
- **Verify each step against the official upgrade guides at execution time.** The
  version-specific notes below were confirmed on 2026-07-03 against the official guides
  (Next.js `version-15` / `version-16`, React 19 changelog, targeting `next@16.2.9`), but
  canary codemods and the exact removed-API list still shift between releases — re-confirm
  before starting:
  - Next 14→15 upgrade guide + `@next/codemod`
  - Next 15→16 upgrade guide + `@next/codemod`
  - React 18→19 upgrade guide + `codemod react/19/migration-recipe`
  Use the `documentation-lookup` / Context7 flow to pull the current guides before starting.

---

## 4. Pre-flight checklist (before Stage 1)

- [ ] Green baseline on `main`: `npm run typecheck && npm run lint && npm test && npm run build`
      and `PLAYWRIGHT_HTML_OPEN=never npx playwright test`.
- [ ] Record the current `npm audit --omit=dev` output (baseline: 5 vulns) to compare against
      post-migration.
- [ ] Create the branch: `git switch -c chore/next-15-upgrade` (Stage 1) — never work on `main`.
- [ ] Skim the three official upgrade guides (Section 3) and note any breaking changes newer
      than this document.
- [ ] Confirm React-19 peer support for `next-auth`, `@react-pdf/renderer`, `radix-ui`,
      `lucide-react`, `@auth/prisma-adapter` (check each package's releases / peerDeps).

---

## 5. Stage 1 — Next 14 → 15 + React 19

**Branch:** `chore/next-15-upgrade`

### Stage 1 steps

1. Run the upgrade codemod, pinned to the 15 line:
   `npx @next/codemod@canary upgrade 15` (or manually install `next@15`, `react@19`,
   `react-dom@19`, `eslint-config-next@15`, `@types/react@19`, `@types/react-dom@19`).
2. Run the React 19 recipe: `npx codemod@latest react/19/migration-recipe`, and bump
   `@types/react@19` / `@types/react-dom@19`. Per the scan in Section 2 this codebase uses
   none of the removed APIs, so expect this step to be near-empty beyond the version bump and
   any incidental `@types/react@19` type reconciliation.
3. Run the async-request-API codemod: `npx @next/codemod@canary next-async-request-api .`
   Then hand-verify the **9 files** in Section 2 — each `params`/`searchParams` must be a
   Promise and `await`-ed. (cookies/headers are already done.)
4. Bump/verify React-19-sensitive peers: `next-auth`/Auth.js, `@react-pdf/renderer`,
   `radix-ui`, `lucide-react`, `@auth/prisma-adapter`. Resolve peer warnings rather than
   forcing `--legacy-peer-deps`.
5. Review caching: pages are mostly `force-dynamic` already; confirm no route relied on the
   old default caching of GET route handlers / `fetch`. The results polling path uses the
   custom TTL cache and should be unaffected — verify live polling still updates.
6. Middleware + auth: confirm `middleware.ts` (Auth.js `auth()` redirect) and the edge/`jose`
   usage still behave; test both `localhost` and a tunneled host (`trustHost: true`).
7. Opportunistic cleanup: if `@react-pdf/renderer` now ships correct React 19 types, remove
   the `as unknown as ReactElement<DocumentProps>` cast in the PDF route.

**Verify** (Section 7 gate) → open PR → review → merge to `main`.

### Stage 1 rollback

Branch-isolated. If blocked, `git switch main` and discard the branch; the lockfile and
`package.json` on `main` are untouched until merge. DB unaffected.

---

## 6. Stage 2 — Next 15 → 16

**Branch:** `chore/next-16-upgrade` (cut from `main` after Stage 1 merges)

### Stage 2 steps

1. Run the upgrade codemod to 16: `npx @next/codemod@canary upgrade latest`
   (installs `next@16`, `eslint-config-next@16`, and any required React bump).
2. **Turbopack is the default for both `next dev` and `next build` in 16** (no `--turbopack`
   flag needed). Verify the production build under Turbopack. If a custom loader/plugin or
   `@react-pdf` bundling breaks, fall back to webpack for that build while filing a
   follow-up, rather than blocking.
3. **`next lint` is removed in 16** (and the `eslint` option in `next.config` no longer
   exists). Migrate with the official codemod:
   `npx @next/codemod@canary next-lint-to-eslint-cli .` — it rewrites `package.json`
   `scripts.lint` to call ESLint directly and scaffolds the config. Then remove any `eslint`
   block from `next.config.mjs`, and confirm CI and pre-commit hooks call the new command.
4. **Pin runtime versions.** Next 16 requires **Node 20.9+ (LTS)** and **TypeScript 5.1+**
   (Node 18 dropped). Add `engines.node: ">=20.9.0"`, bump the Docker base image, `.nvmrc`,
   and any CI matrix; confirm the installed TypeScript is >= 5.1. Dev host is already Node 24.
5. Confirm async `params`/`searchParams` (done in Stage 1) satisfies 16's stricter
   requirement — no sync fallback remains.
6. Re-check `next.config.mjs` for renamed/removed options flagged by the codemod (image
   `remotePatterns`, experimental flags, headers block).
7. Re-verify middleware/auth and the `runtime = "nodejs"` route
   (`app/api/elections/[id]/monitor-snapshots/route.ts`) on 16.

**Verify** (Section 7 gate) → open PR → review → merge to `main`.

### Stage 2 rollback

Same as Stage 1 — branch-isolated, DB untouched.

---

## 7. Verification gate (run every stage)

Automated:

```bash
npm run typecheck
npm run lint            # after Stage 2, this is the new eslint command
npm test                # currently 36 files / 320 tests
npm run build
PLAYWRIGHT_HTML_OPEN=never npx playwright test
npm audit --omit=dev    # record the delta; expect the Next advisories to clear
```

Manual smoke (authenticated Chromium + voter flow) — these exercise the load-bearing paths
this app cannot regress:

- **2FA admin login**: password + officer key, including the "officer key must belong to a
  *different* admin" rule; on `localhost` and a tunneled host.
- **Voter ballot**: validate control number → grade-filtered ballot → review → submit →
  confirmation; re-submit is blocked (double-vote claim).
- **Results embargo**: public results hidden until `CLOSED`; admin monitor polls live.
- **Receipt verification**: one-time verify shows recorded choices; second attempt reports
  already-verified.
- **PDF + CSV export**: results PDF renders for a closed election; voter CSV export works.
- **Cron transitions**: `/api/cron/transition-elections` still opens/closes on schedule
  (constant-time bearer auth intact).
- **/admin-help unlock**: officer-key gate still opens the help page (floor is 6, policy 8).

---

## 8. Post-migration (Stage 3) cleanup

- [ ] Re-run `npm audit --omit=dev`; confirm the Next advisories are gone and record the new
      count. Address any residual with in-range fixes.
- [ ] Remove workarounds made obsolete by the upgrade (e.g. the react-pdf type cast).
- [ ] Update docs that pin the old stack: `CLAUDE.md` (says "Next.js 14" throughout and in
      "Production Considerations"), `README`, and this file's header/stack table.
- [ ] Delete the migration branches once merged; prune stale worktrees.
- [ ] Re-run the full verification gate one more time on `main`.

---

## 9. Risk register

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| React 19 peer breakage in `next-auth` / `@react-pdf/renderer` / `radix-ui` | Med | Confirm peers in pre-flight; bump to React-19-ready releases; isolate on branch. |
| Auth/middleware regression (2FA, `trustHost` multi-host) | Med | Explicit manual smoke on localhost + tunnel each stage. |
| Turbopack build breakage on Next 16 | Med | Verify build under Turbopack; temporary webpack fallback if a loader breaks. |
| `next lint` removal breaks CI/lint | High (expected) | Planned flat-config migration in Stage 2. |
| Missed async `params` site | Low | Codemod + the explicit 9-file checklist + typecheck. |
| Caching-default change alters polling/results | Low | Pages are `force-dynamic`; results uses custom TTL cache — verify live polling. |

---

## 10. Project state before migration (condensed handoff)

Admin UX overhaul is shipped and on `main`; a code-review pass then landed correctness,
security, and DB fixes. Recent, migration-adjacent work:
- Election-lifecycle correctness (reschedule no longer drops a live election out of `OPEN`;
  lifecycle transitions use `FOR UPDATE` + re-check; atomic receipt-verification burn).
- Authz/frontend robustness (view-capability guards on candidate/control pages; monitor
  polling stops on unmount; **all** `useServerActionForm` consumers surface `submitError`).
- Results/DB (unified tally via `lib/domain/tally.ts`; `groupBy` aggregation; hot-path FK
  indexes migration `20260703011450_add_missing_indexes`; pg pool `max: 40` + timeouts).
- Officer-key policy: create/reset **min 8**; login has no length gate; `/admin-help` unlock
  floor kept at **6** so already-set shorter keys still work.
- Dependencies: within-range `npm audit fix` applied (13 → 5 prod vulns); **Next.js upgrade
  is the remaining item — this document.**

Earlier shipped phases (admin token/chrome foundation, SUPERADMIN oversight, persisted
monitor snapshots, responsive shell, dashboard/setup refresh, searchable candidate/voter
indexes, control/monitor refresh, results/history/login/accounts refresh, receipt
verification with recorded choices, filter panels) remain intact. Full test suite: 36 files,
320 tests.

## 11. Notes for next worker

- Work each major upgrade on its own branch; never `--force` upgrade on `main`.
- Do **not** modify `.env` or seed/reset the database without explicit approval — the
  migration does not require it.
- The edit gate in this repo rejects the first write to each file until facts are presented;
  verify changes actually landed (`rg`) rather than trusting commit messages.
- If more visual polish is requested instead, resume with authenticated browser screenshots
  on desktop and mobile.
