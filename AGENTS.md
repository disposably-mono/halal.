# AGENTS.md

Shared instructions for coding agents working in this repository.

## Core Principles

- KISS: simplest working solution; no premature optimization.
- DRY: extract repeated logic when duplication is real.
- YAGNI: no speculative features.
- Immutability is critical: create new objects; do not mutate existing state.
- Keep files small: 200-400 lines typical, 800 lines max.
- Handle errors explicitly: user-friendly messages in UI, detailed logs server-side.
- Validate inputs with schemas at boundaries; fail fast.
- Naming: camelCase for variables/functions, PascalCase for types/components, UPPER_SNAKE for constants, and `is`/`has`/`should` prefixes for booleans.

## Quality And Review

- Keep functions under 50 lines and nesting at 4 levels or less.
- Avoid hardcoded values, magic numbers, and hidden mutation.
- Add or update tests for behavior changes.
- Before commit, run the relevant checks and confirm they pass.
- Use code review after writing or modifying code.
- Security review is mandatory for auth, user input, database access, file operations, external APIs, cryptography, payments, or secrets.
- Block on CRITICAL security or data-loss findings; fix before merging.
- Address HIGH findings; call out MEDIUM risks; note LOW risks.
- Review checklist: readability, naming, function/file length, nesting, error handling, no secrets, tests exist, and coverage stays at or above 80%.

## Security

- Never hardcode secrets; use environment variables or a secret manager.
- Validate all input.
- Prevent SQL injection with parameterized queries or Prisma APIs.
- Prevent XSS and CSRF in user-facing flows.
- Rate-limit sensitive endpoints.
- Do not leak sensitive details in user-visible errors.
- If a secret is exposed, stop, run security review, fix CRITICAL issues, rotate the secret, and review the codebase.

## Testing

- Target at least 80% coverage across unit, integration, and E2E coverage.
- Prefer TDD for behavior changes: write the failing test, confirm it fails, implement, confirm it passes, then refactor.
- Use Arrange-Act-Assert structure and descriptive test names.
- For this project, the standard verification set is:

```bash
npm run typecheck
npm run lint
npm test
npm run test:coverage
```

Run `npm run build` and `npm run test:e2e` when the change touches routing, rendering, auth, deployment behavior, or user flows.

## Development Workflow

1. Research and reuse existing patterns before inventing a new abstraction.
2. Plan complex work before editing.
3. Use TDD for bug fixes and new behavior.
4. Keep commits atomic and conventionally named: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`, `perf:`, or `ci:`.
5. Run checks before committing or pushing.
6. Resolve build and test failures before moving on.
7. For PRs, inspect full commit history and `git diff [base]...HEAD`, then include a summary and test plan.

## Git Workflow

- Use conventional commits: `<type>: <description>`.
- Keep commits focused.
- Prefer explicit staging over `git add -A` when the worktree is mixed.
- Rebase before merge when needed.
- Never force-push shared branches; use `--force-with-lease` only when explicitly appropriate.
- Do not revert user changes unless the user asks.
- Never use destructive commands such as `git reset --hard` or `git checkout --` without explicit approval.

## Repo-Specific Notes

- Current stack is Next.js 16.2, React 19, TypeScript, Prisma 7, PostgreSQL 16, Auth.js, Tailwind CSS, Vitest, and Playwright.
- The Next.js 14 -> 16 migration plan in `HANDOFF.md` is complete on `main`; do not run forced major framework upgrades without going through the same staged approach.
- Do not modify `.env`, seed/reset the database, or touch real voter data without explicit approval.
- Keep voter, receipt, audit, authentication, and rate-limit copy precise. These strings are security- and election-critical.
- The app must run behind a header-sanitizing reverse proxy because rate limiting trusts `x-forwarded-for`.
- Public copy should stay direct, school-specific, and clear.

## Agent Orchestration

- Use planner/architect support for complex features or architectural changes when available.
- Use TDD guidance for bug fixes and new behavior when available.
- Use code review after code changes when available.
- Use security review for auth, user input, DB, file operations, external APIs, crypto, payments, or secrets when available.
- Use build-error resolution help when build or CI failures are not immediately obvious.

## CLI Preferences

- Prefer modern tools: `rg` over `grep`, `bat -pp` over `cat`, `eza` over `ls`, and `fd` over `find` when available.
- Keep commands non-interactive and outputs plain.

## Code Smells To Avoid

- Deep nesting instead of early returns.
- Magic numbers instead of named constants.
- Long functions or files.
- Mutation where immutable updates are practical.
- Generic, leaky, or over-detailed user-facing errors.
- Missing tests for behavior changes.
