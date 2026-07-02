# Admin UX Overhaul Handoff

Updated: 2026-07-02
Branch: `main`
Current base before this handoff update: `af35516 feat(admin): complete ux overhaul phases`

## Shipped

- Phase 0/A/B/1: admin token/chrome foundation, SUPERADMIN oversight, persisted monitor snapshots, responsive shell.
- Phase 2: shared admin primitives split into focused modules, Toast v2, dashboard/control toast migrations.
- Phase 3: refreshed dashboard and election setup flow, searchable candidates/voters, inline new-election validation.
- Seed-position fix: "Seed All Positions" now reseeds when only inactive/removed positions remain.
- Phase 4: Control and monitor refresh.
  - Control uses shared `PageHeader`, `Breadcrumb`, `Field`, tokenized cards, read-only badge, larger lifecycle buttons, and lucide action icons.
  - Monitor polling now returns `error`, `isFetching`, and `refresh`; manual refresh runs immediately and restarts the timer.
  - Monitor replay seeds from `GET /api/elections/[id]/monitor-snapshots` and appends live snapshots without mutating previous snapshots.
  - Monitor header includes `PollingStatus`; replay panel is collapsible for tablet/mobile layouts.
- Phase 5: Results/history refresh.
  - Results uses shared page/empty/card primitives and tested summary helpers for result ordering, status labels, and turnout percent.
  - Login history uses shared header/table/empty patterns through a focused client table component.
- Phase 6: Login/accounts refresh.
  - Login uses tokenized admin background, lucide buttons, non-negative tracking, and tested safe failure-copy mapping.
  - Accounts uses shared header/field primitives and tested account summary copy.
- Post-review fixes:
  - Draft/scheduled monitor deep links redirect back to election control.
  - Mobile control/monitor topbars use responsive wrapping and hide the desktop setup stepper on compact widths.
  - Monitor has one manual Refresh control instead of duplicate header/status buttons.
  - Login/account secret fields include browser autocomplete hints.
  - Playwright is installed/configured for dedicated `e2e/` specs, with a public smoke test.
- Root admin index polish:
  - Dashboard election table controls now use a dedicated dark/gold filter panel so search and status controls do not crowd the top-right corner.
  - `/admin/candidates` is now a searchable/filterable candidate index with boxed division/status controls and collapsible division/election groups.
  - `/admin/voters` is now a searchable/filterable voter index with boxed division/status/vote-state controls, numbered rows, and collapsible division/election groups.
  - Candidate/voter index groups load collapsed by default and show visible "Click to expand" hints.
  - Playwright dev server uses fixed port `3100` to avoid Next dev auto-port drift during e2e runs.

## Verification Run

- `npm run typecheck`
- `npm run lint`
- `npm test` - 34 files, 305 tests passed
- `npm run build`
- `PLAYWRIGHT_HTML_OPEN=never npx playwright test` - 1 Chromium smoke test passed
- Authenticated Chromium probes: login/account autocomplete, draft monitor redirect, mobile control topbar bounds, filter panels, collapsed-by-default groups, expand hints, and desktop/mobile overflow passed.

## New Tests

- `tests/admin/monitor-polling.test.ts`
- `tests/admin/results-summary.test.ts`
- `tests/admin/login-copy.test.ts`
- `tests/admin/account-display.test.ts`
- `tests/admin/monitor-access.test.ts`
- `e2e/public-smoke.spec.ts`
- `tests/admin/candidate-index.test.ts`
- `tests/admin/voter-index.test.ts`

## Notes For Next Worker

- The root `HANDOFF.md` was previously recreated from active code state and prior handoff summary.
- Local branch is `main`; phase work is already on `origin/main` through `af35516`.
- Do not modify `.env` or seed/reset the database without explicit approval.
- If more visual polish is requested, resume with authenticated browser screenshots on desktop and mobile.
