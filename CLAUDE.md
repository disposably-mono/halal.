# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Database Setup
```bash
# Start the database (PostgreSQL 16)
docker compose up -d

# Seed the database (creates default admin user)
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

### Build & Production
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Admin Credentials (from seed)
- Email: `comelec@olps.edu.ph`
- Password: `comelec2026`
- Officer Key: `***REDACTED***`

## Architecture Overview

**Stack:** Next.js 14 (App Router) + TypeScript + Prisma + PostgreSQL

**System Architecture:**
```
Next.js 14 (Full Stack)
├── App Router (Frontend UI + Server Actions)
├── Authentication (NextAuth.js with 2FA)
├── Prisma 7 ORM
└── PostgreSQL 16 (Docker)
```

### Key Technical Decisions
- **Real-time:** Server-Sent Events (SSE) for live tally (not yet implemented)
- **Auth:** NextAuth.js Credentials provider with bcrypt + officer key (2FA)
- **Database:** Prisma 7 with PostgreSQL adapter (`@prisma/adapter-pg`)
- **UI:** Tailwind CSS + shadcn/ui (Radix Nova style)
- **Containerization:** Docker Compose for local dev/production parity
- **Server Actions:** Used for admin mutations (no separate REST API)
- **Anonymity:** `Vote` model has no `Voter` foreign key (DB-level privacy)

### Next.js 14 App Router Structure
```
app/
├── layout.tsx                 # Root layout with fonts & providers
├── page.tsx                   # Public homepage
├── globals.css                # Tailwind + design tokens
├── admin/                     # Admin panel (protected by middleware)
│   ├── login/page.tsx        # 2FA login form
│   ├── page.tsx              # Dashboard (elections list)
│   └── elections/
│       ├── new/
│       │   ├── page.tsx      # Election creation form
│       │   └── actions.ts    # Server Action: createElection()
│       ├── [id]/
│       │   ├── candidates/
│       │   │   ├── page.tsx  # Candidate management UI
│       │   │   └── actions.ts # CRUD Server Actions
│       │   ├── voters/
│       │   │   ├── page.tsx  # Voter management + CSV import
│       │   │   └── actions.ts # voter import & controls
│       │   └── (other pages)
├── api/
│   └── auth/[...nextauth]/route.ts  # NextAuth handler
└── (voter-facing pages not yet implemented) # Phase 3
```

### Authentication Flow
1. Admin visits `/admin/login`
2. Submits email + password + officer key (all required)
3. `auth.ts` checks:
   - Email exists in `AdminUser`
   - Password matches `passwordHash` (bcrypt)
   - Officer key matches `officerKey` (bcrypt)
4. On success, sets session with `role` (COMMISSIONER/OFFICER)
5. `middleware.ts` protects all `/admin/*` routes using NextAuth's `auth()` redirect

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

```
Phase 1  ██████████  Complete (Foundation & Scaffold)
Phase 2  █████░░░░░  In Progress (Admin Panel)
Phase 3  ░░░░░░░░░░  Planned (Voter-Facing Pages)
Phase 4  ░░░░░░░░░░  Planned (Real-Time Results)
Phase 5  ░░░░░░░░░░  Planned (Deployment)
```

## Key Features to Understand

### Control Number System
- Format: `YY GG S NNN` (e.g., `2611A001`)
- Components: Year | Grade | Section | Student #
- Self-validating, human-readable, single-use

### Voting Flow
```
Enter Code → Validate → Generate Ballot → Select → Review → Submit
```
- Atomic submission (no partial votes)
- Skipped positions = implicit abstentions
- One vote per student (DB enforced)

### Results System
| Phase              | Public View     | Admin View     |
| ------------------ | --------------- | -------------- |
| Voting Open        | ⛔ Locked        | 📡 Live        |
| Election Closed    | ✅ Final Results | 📊 Full Access |

**Key Design Decisions:**
- ❌ No explicit abstain button (cleaner UX)
- ⛔ Results embargo during voting (prevents influence)
- 🔐 2FA admin auth (shared + personal accountability)
- 📡 SSE for lightweight real-time

## Important Code Locations

### Core Configuration
- `prisma/schema.prisma` - Database schema & relationships
- `prisma/migrations/` - Migration history (auto-generated)
- `prisma/seed.ts` - Database seeder (run with `npx prisma db seed`)
- `auth.ts` - NextAuth configuration + credentials provider + 2FA logic
- `auth.config.ts` - NextAuth callbacks & page overrides
- `middleware.ts` - Admin route protection (`/admin/*`)
- `tailwind.config.ts` - Design tokens + brand colors + custom font families
- `components.json` - shadcn/ui configuration (Radix Nova style)

### Data Layer
- `lib/prisma.ts` - Global PrismaClient singleton with PostgreSQL adapter
- `prisma.config.ts` - Prisma config for TypeScript

### Server Actions (Backend Logic)
- `app/admin/elections/new/actions.ts` - `createElection()`
- `app/admin/elections/[id]/candidates/actions.ts` - Candidate CRUD
- `app/admin/elections/[id]/voters/actions.ts` - Voter import + control number generation
- `app/api/auth/[...nextauth]/route.ts` - NextAuth route handler
- `app/api/elections/[id]/voters/export/route.ts` - CSV export

### Frontend Pages
- `app/admin/login/page.tsx` - Admin 2FA login form
- `app/admin/page.tsx` - Dashboard (elections list)
- `app/admin/elections/new/page.tsx` - Create election form
- `app/admin/elections/[id]/candidates/page.tsx` - Manage candidates for an election
- `app/admin/elections/[id]/voters/page.tsx` - Import voters, generate control numbers
- `app/page.tsx` - Public homepage (placeholder until Phase 3)
- `app/layout.tsx` - Root layout with fonts

### UI Components (shadcn/ui)
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/card.tsx`
- `components/ui/badge.tsx`
- `components/ui/table.tsx`
- `components/ui/tabs.tsx`
- `components/ui/dialog.tsx`

### Constants & Business Logic
- `app/admin/elections/lib/constants.ts` - `DIVISION_POSITIONS`, `DIVISION_GRADE_RANGE`
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
File: `app/admin/elections/lib/constants.ts`

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

### AdminUser Model
- `email`: Unique, used for login
- `passwordHash`: Bcrypt-hashed password
- `officerKey`: Bcrypt-hashed unique personal key (2FA)
- `role`: `COMMISSIONER` or `OFFICER` (future: role-based permissions)
- `lastLogin`: Timestamp for audit

## Testing Status

**Current:** No test suite configured.

**If adding tests**, suggest:
- **Unit:** Ballot generation logic (control number parsing, grade eligibility)
- **Integration:** Voting flow (validate → submit → prevent re-vote)
- **E2E:** Playwright for complete admin + voter journeys

**Recommended Stack:**
- Jest or Vitest + `@testing-library/react`
- `@prisma/client` with test database
- MSW for API mocking if needed

**Test Database:**
Use separate `DATABASE_URL_TEST` and `npx prisma migrate deploy` against test DB.

## Environment Configuration

### Required `.env` Variables
```bash
DATABASE_URL="postgresql://user:pass@host:5432/db"
NEXTAUTH_SECRET="random-32+char-string-for-jwt-signing"
NEXTAUTH_URL="http://localhost:3000"  # Match deployment URL
```

### Development `.env` (already configured)
- Uses PostgreSQL on `localhost:5432` with user `halal`
- `NEXTAUTH_SECRET` is a dev placeholder (change in production!)
- Docker compose sets up the DB automatically

### Production Considerations
- Generate strong `NEXTAUTH_SECRET` with `openssl rand -base64 32`
- Use managed PostgreSQL (RDS, Supabase, etc.)
- Set `NEXTAUTH_URL` to production domain
- Harden `AdminUser.officerKey` - unique per officer in production
- Enable HTTPS (NextAuth requires secure cookies in production)

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
- **Node:** Requires Node.js 18+ (Next.js 14 requirement)
- **Port:** Configurable via `PORT` env (default: 3000)
- **Database:** Managed PostgreSQL (configure `DATABASE_URL`)
- **Migrations:** Run `npx prisma migrate deploy` in production after deploy
- **Prisma Studio:** Disable/remove in production (admin-only tool)

## Implementation Notes & Future Work

### Phase 3: Voter-Facing Pages (Not Yet Implemented)
- Vote entry page: control number input → validation
- Ballot page: grade-filtered positions, implicit abstentions
- Review modal: highlight unselected positions
- Submission: atomic `Vote` records for all positions
- Confirmation page: "Your vote has been cast"

### Phase 4: Real-Time Results (Not Yet Implemented)
- SSE endpoint for live tally
- Admin dashboard charts (Chart.js or Recharts)
- Public results page (embargoed until election CLOSED)
- CSV export for official results

### Gotchas & Pitfalls
- **Prisma Client reload:** Changes to schema require `npx prisma generate` before TypeScript recognizes new fields
- **Middleware path matching:** `middleware.ts` only protects `/admin/*`; public pages need no auth
- **Anonymous voting:** Cannot trace votes back to voters by design; audits rely on `voterCode` consumption flag
- **Division inference:** When parsing control numbers, ensure grade falls within known ranges; reject invalid
- **Server Actions:** Must be colocated in `app/` directory (cannot import from `src/` or elsewhere)

### Codebase Conventions
- **Path aliases:** `@/*` maps to project root (Next.js default)
- **Component style:** Client components use `"use client"`; pages default to server
- **Styling:** All shadcn/ui components use Tailwind classes; extend `tailwind.config.ts` for brand colors
- **Dates:** Store as UTC in PostgreSQL; convert to local timezone only in UI
- **CSV imports:** Voter import expects columns: `studentId,gradeLevel,section,division` (verify actual implementation)
- **Election status transitions:** No built-in guardrails; admins manually change status (DRAFT → SCHEDULED → OPEN → CLOSED)

---

**Repository:** github.com/disposably-mono/halal

**Motto:** VOX POPULI VOX DEI