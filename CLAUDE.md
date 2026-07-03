# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

For shared coding-agent standards, also read `AGENTS.md`. For current project handoff
and the staged Next.js 16 migration plan, read `HANDOFF.md`.

## Common Development Commands

### Database Setup
```bash
# Start the database (PostgreSQL 16)
docker compose up -d

# Seed the database (creates paired bootstrap admin accounts)
npx prisma db seed
```

### Development
```bash
# Start the Next.js dev server (http://localhost:3000)
npm run dev
```

### Database Management
```bash
# Open Prisma Studio (GUI database browser)
npx prisma studio

# Create a new migration after schema changes
npx prisma migrate dev --name descriptive_name

# Regenerate Prisma Client after schema updates
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Code Quality
```bash
# Run ESLint
npm run lint

# Fix lint errors (if autofixable)
npm run lint -- --fix
```

### Testing
```bash
# One-shot unit test run (Vitest)
npm test

# Watch mode
npm run test:watch

# Coverage report (HTML in ./coverage/, 80% threshold enforced)
npm run test:coverage
```

### Build & Production
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Admin Credentials (from seed)
The seed admin is created from `.env` — never hardcode the values here.
See your local `.env` (or `.env.example` for the variable names):
- Email: `$SEED_ADMIN_EMAIL`
- Password: `$SEED_ADMIN_PASSWORD`
- Officer Key: `$SEED_ADMIN_OFFICER_KEY`
- A second bootstrap officer is configured with the matching `SEED_SECOND_ADMIN_*`
  variables. Login requires an officer key belonging to a different admin account.

## Architecture Overview

**Stack:** Next.js 16.2 (App Router) + React 19 + TypeScript + Prisma 7 + PostgreSQL 16.
The Next.js 14 -> 16 migration described in `HANDOFF.md` is complete on `main`; do not run
forced major framework upgrades without going through the same staged approach.

**System Architecture:**
```
Next.js 16.2 (Full Stack)
├── App Router (Frontend UI + Server Actions)
├── Authentication (NextAuth.js with 2FA)
├── Prisma 7 ORM
└── PostgreSQL 16 (Docker)
```

### Key Technical Decisions
- **Live updates:** The admin monitor subscribes once to a server push stream
  (`GET /api/elections/[id]/monitor/stream`, Server-Sent Events) — no polling.
  The public results page still polls `/api/results/[id]` every 30s. Both read
  paths are side-effect free; snapshot history is written only by the server on
  election-state changes (see **Server-owned live monitor** below).
- **Auth:** NextAuth.js Credentials provider with bcrypt + officer key (2FA)
- **Database:** Prisma 7 with PostgreSQL adapter (`@prisma/adapter-pg`)
- **UI:** Tailwind CSS + shadcn/ui (Radix Nova style)
- **Containerization:** Docker Compose for local dev/production parity
- **Server Actions:** Used for admin mutations (no separate REST API)
- **Anonymity:** `Vote` model has no `Voter` foreign key (DB-level privacy)

### App Router Structure
The admin panel lives in a `(admin)` route group so it gets its own chrome
(`app/(admin)/admin/layout.tsx`) without affecting public routes. Most client
pages are decomposed into colocated `_components/` directories plus a thin
`*Client.tsx` shell. The legacy `app/admin/login/page.tsx` is the only page still
outside the route group.

```
app/
├── layout.tsx                      # Root layout with fonts & providers
├── page.tsx                        # Public homepage (division status cards)
├── globals.css                     # Tailwind + design tokens
├── about/ creator/ officers/       # Public info pages
├── results/                        # Public results (embargoed until CLOSED)
│   ├── page.tsx · ResultsClient.tsx · _components/
├── vote/                           # Voter-facing flow
│   ├── actions.ts                  # validateCode / submitBallot
│   ├── ballot/ (BallotClient + _components/) · confirmed/
├── admin/login/page.tsx            # 2FA login form (outside route group)
├── (admin)/admin/                  # Protected admin panel (proxy.ts)
│   ├── layout.tsx                  # Topbar + sidebar chrome
│   ├── page.tsx · DashboardClient.tsx · _components/   # Dashboard + archive
│   ├── actions.ts                  # archiveElection / restoreElection (lifecycle transitions live in elections/[id]/control/actions.ts)
│   ├── candidates/ voters/ results/ # Global cross-election admin views
│   └── elections/
│       ├── new/ (page.tsx + actions.ts)        # createElection()
│       └── [id]/
│           ├── candidates/ (page + actions)    # Position/candidate CRUD
│           ├── voters/ (page + VoterForms + actions)  # CSV import + controls
│           ├── control/ (ControlClient + actions)     # Status transitions + archive
│           └── monitor/ (MonitorClient + _components/) # Live tally (polling)
└── api/
    ├── auth/[...nextauth]/route.ts             # NextAuth handler
    ├── results/[id]/route.ts                   # Tally API (admin + public)
    ├── elections/[id]/voters/export/route.ts   # CSV export
    ├── elections/[id]/results-pdf/route.ts     # PDF export
    └── cron/transition-elections/route.ts      # Scheduled open/close
```

### Authentication Flow
1. Admin visits `/admin/login`
2. Submits email + password + officer key (all required)
3. `auth.ts` checks:
   - Email exists in `AdminUser`
   - Password matches `passwordHash` (bcrypt)
   - Officer key matches `officerKey` (bcrypt) — and the matched key must belong to a
     *different* admin account than the one logging in (shared 2FA accountability)
4. On success, sets session with `role` — one of `SUPERADMIN`, `COMMISSIONER`,
   `CANVASSER`, or `OFFICER`. Authorization is capability-based: roles map to
   capabilities in `lib/auth/permissions.ts` (`ROLE_CAPABILITIES`), and every
   guard/UI gate derives from that single source of truth.
5. `proxy.ts` protects all `/admin/*` routes using NextAuth's `auth()` redirect

> **Multi-host auth:** `auth.config.ts` sets `trustHost: true`, so callback URLs and
> cookies use the requesting host (`X-Forwarded-Host`) rather than a fixed
> `NEXTAUTH_URL`. Login works on `localhost` and tunneled hosts (e.g. ngrok) with no
> config change. The login form calls `signIn(..., { redirect: false })` then
> `router.push("/admin")` (relative), so it stays on whatever host the browser is on.

### Database Patterns
- **Global Prisma Client:** `lib/prisma.ts` uses singleton pattern with `globalThis` to prevent dev HMR issues
- **PostgreSQL Adapter:** Uses `@prisma/adapter-pg` to connect via `DATABASE_URL`
- **Cascade Delete:** All `Election` relations have `onDelete: Cascade`. `Vote` FKs are explicit:
  - `Vote.electionId` → `Cascade` — election delete clears its votes
  - `Vote.positionId` → `Cascade` — position removal takes its votes with it
  - `Vote.candidateId` → `Restrict` — never silently lose cast votes; the `removeCandidate`
    server action pre-checks vote count and short-circuits before the DB rejects.
- **Anonymous Voting:** `Vote` intentionally lacks `voterId` to guarantee anonymity; linked only via `electionId` + implicit `voterCode` consumption
- **Control Number Format:** `YYGGSNNN` (e.g., `2611A001`) - year, grade, section, student number
- **Archiving:** `Election.archivedAt` / `archivedBy` are an orthogonal soft-retire flag,
  independent of `status`. Archived elections are hidden from the active dashboard and from
  public results, but remain in the DB and are restorable. Never conflate archive with the
  status lifecycle.

### Server Actions Pattern
- Located in `app/.../actions.ts` files adjacent to the UI they serve
- Use `"use server"` directive
- Accept `FormData` or typed parameters
- Return `void` or redirect via `next/navigation`
- Called from page components with `"use client"` event handlers

### shadcn/ui Setup
- Component source: `components/ui/*.tsx`
- Radix Nova style variants (see `components.json`)
- Custom colors defined in `tailwind.config.ts`:
  - `navy: #1B1F5E`
  - `navy-deep: #0f1235`
  - `gold: #F5C000`
  - `maroon: #6B1A1A`

## Project Status

The admin UX overhaul, receipt verification, election monitoring, archive flows,
permission guards, and audit-oriented results work are shipped on `main`. The
Next.js 14 -> 16 framework migration (see `HANDOFF.md`) is also complete on `main`.

## Key Features to Understand

### Control Number System
- Format: `YY GG S NNN` (e.g., `2611A001`)
- Components: Year | Grade | Section | Student #
- Self-validating, human-readable, single-use

### Voting Flow
```
Enter Code → Validate → Generate Ballot → Select → Review → Submit
```
- Atomic submission guard with server-side eligible position validation
- Skipped positions = implicit abstentions
- One vote per student (atomic server-side `hasVoted` claim)

### Results System
| Phase              | Public View     | Admin View     |
| ------------------ | --------------- | -------------- |
| Voting Open        | ⛔ Locked        | 📡 Live        |
| Election Closed    | ✅ Final Results | 📊 Full Access |

**Key Design Decisions:**
- ❌ No explicit abstain button (cleaner UX)
- ⛔ Results embargo during voting (prevents influence)
- 🔐 2FA admin auth (shared + personal accountability)
- 📡 Push-based live admin monitor (SSE); polling public final results

## Important Code Locations

### Core Configuration
- `prisma/schema.prisma` - Database schema & relationships
- `prisma/migrations/` - Migration history (auto-generated)
- `prisma/seed.ts` - Database seeder (run with `npx prisma db seed`)
- `auth.ts` - NextAuth configuration + credentials provider + 2FA logic
- `auth.config.ts` - NextAuth callbacks & page overrides
- `proxy.ts` - Admin route protection (`/admin/*`)
- `tailwind.config.ts` - Design tokens + brand colors + custom font families
- `components.json` - shadcn/ui configuration (Radix Nova style)

### Data Layer
- `lib/prisma.ts` - Global PrismaClient singleton with PostgreSQL adapter
- `prisma.config.ts` - Prisma config for TypeScript
- `lib/api/results-types.ts` - Shared wire types for the results API

### Server-owned live monitor
The server — not the browser — owns live tally state and history. A vote commit
or lifecycle transition is the only thing that produces a new frame:
- `lib/server/results-aggregate.ts` - The single "compute once" primitive
  (`computeResultsAggregate` pushes counting into the DB via `groupBy`/`count`;
  `computeAdminMonitorPayload` builds the full admin frame). Shared by the
  read route and the broadcaster so a tally is shaped in exactly one place.
- `lib/server/monitor-broadcast.ts` - `scheduleMonitorRefresh(electionId)`:
  computes the frame once, persists a bucketed snapshot, and broadcasts. Coalesces
  vote bursts (one compute in flight per election + one trailing recompute) so N
  votes never trigger N concurrent scans. Fire-and-forget; never throws.
- `lib/server/monitor-hub.ts` - In-process pub/sub + latest-frame cache. Fans one
  computed frame out to every connected SSE stream. Single-process scope (matches
  the Docker deployment); swap for Redis/LISTEN-NOTIFY to go multi-instance.
- `lib/server/monitor-snapshots.ts` - Bounded replay-timeline persistence
  (one row per 30s bucket; server-written only).
- `app/api/elections/[id]/monitor/stream/route.ts` - SSE endpoint. Sends an
  initial frame on connect (so idle elections still render), then pushes on every
  broadcast. Read-only; auth via the session cookie.
- Callers that trigger a refresh: `lib/server/cast-ballot.ts` (ballot commit),
  `app/(admin)/admin/elections/[id]/control/actions.ts` (open/close), and
  `app/api/cron/transition-elections/route.ts` (scheduled open/close).

### Domain Logic (pure, unit-tested — `tests/domain/`)
- `lib/domain/election-state.ts` - Status-transition + archive/restore guards (`canArchive`, `canRestore`, …)
- `lib/domain/control-number.ts` - Control-number parse/validate
- `lib/domain/ballot.ts` - Grade-filtered ballot construction
- `lib/domain/tally.ts` - Vote tallying
- `lib/domain/voter-import.ts` - CSV parsing for voter import

### Server Actions (Backend Logic)
- `app/(admin)/admin/actions.ts` - Archive and restore actions (status/lifecycle transitions live in `elections/[id]/control/actions.ts`)
- `app/(admin)/admin/elections/new/actions.ts` - `createElection()`
- `app/(admin)/admin/elections/[id]/candidates/actions.ts` - Candidate CRUD
- `app/(admin)/admin/elections/[id]/voters/actions.ts` - Voter import + control number generation
- `app/(admin)/admin/elections/[id]/control/actions.ts` - Scheduling and status controls
- `app/vote/actions.ts` - Voter code validation
- `app/vote/ballot/actions.ts` - Atomic ballot submission
- `app/api/cron/transition-elections/route.ts` - Scheduled status transitions
- `app/api/auth/[...nextauth]/route.ts` - NextAuth route handler
- `app/api/results/[id]/route.ts` - Tally API (admin + public, archive-aware)
- `app/api/elections/[id]/voters/export/route.ts` - CSV export

### Frontend Pages
- `app/admin/login/page.tsx` - Admin 2FA login form
- `app/(admin)/admin/page.tsx` - Dashboard (active and archived elections)
- `app/(admin)/admin/elections/new/page.tsx` - Create election form
- `app/(admin)/admin/elections/[id]/candidates/page.tsx` - Manage candidates for an election
- `app/(admin)/admin/elections/[id]/voters/page.tsx` - Import voters, generate control numbers
- `app/(admin)/admin/elections/[id]/monitor/page.tsx` - Live monitor
- `app/vote/page.tsx` - Voter login
- `app/vote/ballot/page.tsx` - Grade-filtered ballot
- `app/results/page.tsx` - Public results
- `app/page.tsx` - Public homepage
- `app/layout.tsx` - Root layout with fonts

### Shared UI Components
- `components/ui/*.tsx` - shadcn/ui primitives (button, input, card, badge, table, tabs, dialog)
- `components/admin/ui.tsx` - Admin-specific primitives: `Card`, `StatusPill`, `ConfirmDialog`, `Toast`, `FlowTrack`, admin form inputs, etc.
- `app/(admin)/admin/_components/` - Dashboard pieces: `ElectionRow`, `RowActions` (portalled overflow menu), `ArchivedSection`, `AttnCard`, `StatusPill` (re-export)

### Constants & Business Logic
- `lib/elections/constants.ts` - `DIVISION_POSITIONS`, `DIVISION_GRADE_RANGE`
- `lib/ui/division-labels.ts` - Shared `DIVISION_LABELS` / `DIVISION_ORDER` (single source)
- `lib/utils.ts` - `cn()` helper for Tailwind class merging

## Design System

**Colors:**
- Navy `#1B1F5E` — Primary
- Gold `#F5C000` — Accent
- Maroon `#6B1A1A` — Secondary

**Typography:**
- Bebas Neue — Display
- Barlow Condensed — Headings
- DM Sans — Body
- JetBrains Mono — Codes

## Business Logic & Constants

### Division & Position Configuration
File: `lib/elections/constants.ts`

Exports:
- `DIVISION_POSITIONS`: Defines the position hierarchy per division (GS, JHS, SHS, HC)
- `DIVISION_GRADE_RANGE`: Min/max grade levels per division

**Key Rules:**
- JHS has 4 governor positions (`eligibleGrades: [6]`, `[7]`, `[8]`, `[9]`) that only appear on ballots for those specific grades
- SHS General Secretary & Treasurer are for grade 10; most others for grade 11
- GS positions mostly grade 5 with some grade 4 & 3 (PRO Officers)
- HC (House Council) for grades 10-11 (separate from regular SHS election)

### Control Number Validation
Format: `YYGGSNNN` (9 characters total)
- `YY`: Year (e.g., `26` for 2026)
- `GG`: Grade as 2-digit number (e.g., `11`)
- `S`: Section letter (A–H)
- `NNN`: Student number, zero-padded (001–999)

**Validation Steps:**
1. Parse grade level from control number
2. Derive division from grade (see `DIVISION_GRADE_RANGE`)
3. Check `Voter.voterCode` exists and `hasVoted === false`
4. Mark `hasVoted = true` on submission (prevent double-vote)
5. Generate ballot showing only positions eligible for voter's grade

### Election Status Lifecycle
```
DRAFT → SCHEDULED → OPEN → CLOSED
```
- **DRAFT:** Admin creating positions/candidates; not visible to voters
- **SCHEDULED:** Future election with scheduled open/close times; voters still cannot vote
- **OPEN:** Active voting period; ballots available; results hidden from public
- **CLOSED:** Voting ended; public results released; admin sees full data
- **Archived (orthogonal):** `archivedAt`/`archivedBy` flag, independent of status. Only
  `DRAFT` and `CLOSED` elections can be archived (`OPEN`/`SCHEDULED` are blocked by
  `canArchive`). Archive/restore is available from the dashboard row overflow menu and the
  Control page, writes an `AuditLog` entry, and hides the election from the active dashboard
  and public results.

### AdminUser Model
- `email`: Unique, used for login
- `passwordHash`: Bcrypt-hashed password
- `officerKey`: Bcrypt-hashed unique personal key (2FA)
- `role`: one of `SUPERADMIN`, `COMMISSIONER`, `CANVASSER`, or `OFFICER`.
  Capability-based permissions are defined in `lib/auth/permissions.ts`
  (`ROLE_CAPABILITIES`): SUPERADMIN manages accounts only; CANVASSER owns results
  (close/export/recount); COMMISSIONER owns election setup (lifecycle, voters,
  candidates); OFFICER has authenticated read access only.
- `lastLogin`: Timestamp for audit

## Testing

**Stack:** Vitest 4 + v8 coverage for unit/integration checks, plus Playwright for E2E smoke tests.

```bash
npm test              # one-shot run
npm run test:watch    # watch mode
npm run test:coverage # coverage report (HTML in ./coverage/)
npm run test:e2e      # Playwright end-to-end tests
```

**What's covered:** domain rules, auth helpers, admin helpers, server utilities, UI helpers,
and selected admin/voter workflows. Thresholds are enforced at 80% via `vitest.config.ts`;
the current suite is 36 files / 320 tests.

**Coverage gaps to respect:**
- Server actions with real Prisma writes still need a dedicated test database harness.
- React component tests are limited; broad UI confidence comes from Playwright smoke tests and manual browser checks.
- Add focused tests when changing election lifecycle, permissions, receipt verification, tallying, rate limits, or auth.

When adding DB-backed integration or E2E tests, use a separate `DATABASE_URL_TEST` and run `npx prisma migrate deploy` against it.

## Environment Configuration

### Required `.env` Variables
```bash
DATABASE_URL="postgresql://user:pass@host:5432/db"
NEXTAUTH_SECRET="random-32+char-string-for-jwt-signing"
# NEXTAUTH_URL is OPTIONAL. auth.config.ts sets `trustHost: true`, so the host is
# derived from each request. Leave it unset to support multiple hosts at once
# (localhost + tunnels like ngrok); set it only to pin auth to one origin.
# NEXTAUTH_URL="http://localhost:3000"
```

### Development `.env` (already configured)
- Uses PostgreSQL on `localhost:5432` with user `halal`
- `NEXTAUTH_SECRET` is a dev placeholder (change in production!)
- Docker compose sets up the DB automatically

### Production Considerations
- Generate strong `NEXTAUTH_SECRET` with `openssl rand -base64 32`
- Use managed PostgreSQL (RDS, Supabase, etc.)
- `NEXTAUTH_URL` is optional (`trustHost: true` derives the host from the request); set it only to pin auth to a single production origin
- Harden `AdminUser.officerKey` - unique per officer in production
- Enable HTTPS (NextAuth requires secure cookies in production)
- **Run behind a header-sanitizing reverse proxy.** The per-IP rate limiter
  (`lib/server/rate-limit.ts`) trusts `x-forwarded-for`, which is client-spoofable.
  The proxy in front of the app MUST overwrite `x-forwarded-for` with the real
  peer address — without it, the IP-keyed limits (admin login, officer-key unlock)
  are trivially bypassable.

## Deployment

### Local (Docker Compose)
```yaml
# docker-compose.yml
postgres:16-alpine on localhost:5432
Volume: halal_pgdata (persists between restarts)
```

### Production Considerations
- **Build:** `npm run build` outputs `.next/` static assets
- **Start:** `npm start` runs `next start` (production server)
- **Node:** Use Node.js >=20.9.0 (Next.js 16's runtime floor, pinned via `engines.node` in `package.json`).
- **Port:** Configurable via `PORT` env (default: 3000)
- **Database:** Managed PostgreSQL (configure `DATABASE_URL`)
- **Migrations:** Run `npx prisma migrate deploy` in production after deploy
- **Prisma Studio:** Disable/remove in production (admin-only tool)

## Implementation Notes & Future Work

### Implemented Voting Flow
- Vote entry page: student ID + control number validation
- Ballot page: server-side grade-filtered positions, implicit abstentions
- Review modal: highlights unselected positions before submission
- Submission: atomic voter claim plus anonymous `Vote` rows
- Confirmation page: "Your vote has been cast"

### Implemented Results Flow
- `/api/results/[id]` powers public final results (read-only, micro-cached)
- Public results are embargoed until the election is `CLOSED`
- Admin monitor streams turnout, position tallies, momentum, and replay data
  over SSE (`/api/elections/[id]/monitor/stream`); the tally is computed once on
  the server per state change and fanned out to every connected admin
- Official results PDF export is available for closed elections
- Scheduled open/close transitions run through the cron endpoint

### Gotchas & Pitfalls
- **Prisma Client reload:** Changes to schema require `npx prisma generate` before TypeScript
  recognizes new fields (e.g. after the `archivedAt` migration).
- **Proxy path matching:** `proxy.ts` only protects `/admin/*`, `/vote/ballot/*`, and `/vote/confirmed`; public pages need no auth
- **Anonymous voting:** Cannot trace votes back to voters by design; audits rely on `voterCode` consumption flag
- **Division inference:** When parsing control numbers, ensure grade falls within known ranges; reject invalid
- **Server Actions:** Must be colocated in `app/` directory (cannot import from `src/` or elsewhere)
- **Portalled menus:** The dashboard row overflow menu (`RowActions`) renders via a `createPortal`
  to `document.body` with fixed positioning — the `All Elections` card uses `overflow-hidden`, so an
  in-flow absolute menu would be clipped. Keep dropdowns/popovers portalled inside that card.
- **Archive vs status:** Archiving is orthogonal to the status lifecycle — filter on `archivedAt`
  where you want only active elections; don't add an `ARCHIVED` status.

### Codebase Conventions
- **Path aliases:** `@/*` maps to project root (Next.js default)
- **Component style:** Client components use `"use client"`; pages default to server
- **Styling:** All shadcn/ui components use Tailwind classes; extend `tailwind.config.ts` for brand colors
- **Dates:** Store as UTC in PostgreSQL; convert to local timezone only in UI
- **CSV imports:** Voter import expects columns: `studentId,gradeLevel,section`
- **Election status transitions:** Enforced by the server actions in
  `app/(admin)/admin/elections/[id]/control/actions.ts` and the cron endpoint,
  both gated by the pure guards in `lib/domain/election-state.ts`
  (`canManuallyOpen`, `canAdvanceToScheduled`, `canReschedule`, …). These enforce
  the `DRAFT → SCHEDULED → OPEN → CLOSED` lifecycle and refuse transitions on
  archived elections.
- **Test-only endpoint:** `app/api/test/cast-ballot` exists for load testing but is
  double-gated — it returns 404 unless `ENABLE_TEST_ENDPOINTS=1` **and**
  `NODE_ENV !== "production"` (see `lib/server/test-endpoints.ts`), so it is invisible
  on a real deployment.

---

**Repository:** github.com/disposably-mono/halal

**Motto:** VOX POPULI VOX DEI
