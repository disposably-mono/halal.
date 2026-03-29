# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Database Setup
```bash
# Start the database
docker compose up -d
```

### Start Development Server
```bash
# Start the dev server
npm run dev
```

### Prisma Commands
```bash
# Open Prisma Studio (database admin UI)
npx prisma studio

# Create a new migration
npx prisma migrate dev --name <migration_name>

# Generate Prisma client after schema changes
npx prisma generate
```

### Linting
```bash
# Run ESLint
npm run lint
```

### Build & Production
```bash
# Build for production
npm run build

# Start production server
npm start
```

## Architecture Overview

**Stack:** Next.js 14 (TypeScript) with App Router

**System Architecture:**
```
Next.js (Full Stack)
├── App Router (Frontend UI)
├── Server Actions / API Routes
├── Authentication (NextAuth)
├── Prisma ORM
└── PostgreSQL (Docker)
```

### Key Technical Decisions
- **Real-time updates:** Server-Sent Events (SSE) for live tally
- **Auth:** NextAuth.js with 2FA for admin panel
- **Database:** PostgreSQL 16 with Prisma 7 ORM
- **Styling:** Tailwind CSS + shadcn/ui components
- **Containerization:** Docker for consistent deployment

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

### Database
- `prisma/schema.prisma` - Database schema
- `prisma/migrations/` - Migration files

### App Structure
- `app/` - Next.js 14 App Router pages and layouts
- `components/` - Reusable UI components (shadcn/ui based)
- `lib/` - Utilities, Prisma client, auth config
- `app/api/` - API routes and server actions

### Authentication
- NextAuth.js configured in `lib/auth.ts` (or similar)
- Admin 2FA via officer key (check schema for `officerKey`)

### Voting & Results
- Ballot generation: likely in `app/vote/` or `app/ballot/`
- Real-time tally: SSE endpoint in `app/api/tally/` or similar
- Results embargo logic: check middleware or page conditions

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

## Notes for Development

1. **Grade-aware ballots:** JHS governors only appear on ballots for grades 7-10
2. **Division detection:** Auto-detects voter's division from control number
3. **Two-phase results:** Public only sees final results after election closes
4. **Performance:** Optimized for ~2000 concurrent voters
5. **Security:** Anonymous ballots, strict validation, no reuse of control numbers

## Testing Status
No test suite is currently configured. If adding tests, consider:
- Unit tests for ballot generation logic
- Integration tests for voting flow
- API tests for results tallying

## Environment Configuration
- `.env` file required for:
  - Database connection string
  - NextAuth secret
  - Any third-party services

## Deployment
Docker-based deployment. See Dockerfile and docker-compose.yml for configuration.

---

**Repository:** github.com/disposably-mono/halal

**Motto:** VOX POPULI VOX DEI