# halal. — Phase 1 Setup Documentation

> **Project:** halal. — School Election Management System
> **Organization:** OLPS COMELEC
> **Phase:** 1 — Foundation & Project Scaffold
> **Date Completed:** March 29, 2026
> **Status:** ✅ Complete

---

## Overview

This repository contains the **halal.** election management system, built for the Commission on Elections (COMELEC) at Our Lady of Peace School (OLPS). The name derives from the Filipino word for "to elect" or "to choose," reflecting the election theme **VOX POPULI VOX DEI**.

The system replaces manual election processes (paper ballots, hand-tallied counts) with a modern, real-time digital platform that manages student government elections across three divisions — Grade School, Junior High School, and Senior High School.

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 14.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS + shadcn/ui | Latest |
| Component Library | Radix UI (via shadcn) | Latest |
| Database | PostgreSQL | 16 (Alpine) |
| ORM | Prisma | 7.x |
| Auth | NextAuth.js (Auth.js) | Beta |
| Container | Docker + Docker Compose | 29.x |
| Runtime | Node.js | 24.x |

---

## Prerequisites

The following tools must be installed before setting up the project:

| Tool | Minimum Version | Notes |
|------|----------------|-------|
| Node.js | v18.17+ | v24.x used in this project |
| npm | v9+ | v11.x used in this project |
| Git | Any recent | v2.53.0 used |
| Docker | v20+ | v29.3.0 used |
| Docker Compose | v2 (plugin) | Installed via `docker-compose-plugin` on Fedora |

### Fedora-Specific Docker Setup

On Fedora Linux, Docker requires additional setup after install:

```bash
# Enable and start the Docker daemon
sudo systemctl enable docker --now

# Install the Compose v2 plugin
sudo dnf install docker-compose-plugin

# Add your user to the docker group (avoids sudo on every command)
sudo usermod -aG docker $USER

# Apply group change in current shell
newgrp docker

# Verify all three work
docker --version
docker compose version
docker ps
```

---

## Project Structure

```
halal/
├── app/
│   ├── globals.css         # Global styles — Tailwind directives + CSS variables
│   ├── layout.tsx          # Root layout — metadata, font setup
│   └── page.tsx            # Default Next.js landing (placeholder — replaced in Phase 3)
├── components/
│   └── ui/                 # shadcn/ui components (owned by the project, fully editable)
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       ├── dialog.tsx
│       ├── table.tsx
│       └── tabs.tsx
├── lib/
│   ├── prisma.ts           # Prisma client singleton (prevents connection leaks in dev)
│   └── utils.ts            # shadcn utility (cn() classname helper)
├── prisma/
│   ├── schema.prisma       # Full database schema — all 6 models defined
│   └── migrations/
│       └── 20260329075323_init/
│           └── migration.sql   # Initial migration — all tables created
├── public/                 # Static assets (COMELEC logo SVG goes here in Phase 3)
├── .env                    # Environment variables — DO NOT COMMIT
├── .gitignore              # Includes .env
├── docker-compose.yml      # PostgreSQL 16 container definition
├── prisma.config.ts        # Prisma 7 config — connects schema to DATABASE_URL
├── tailwind.config.ts      # Tailwind config with full shadcn color token set
├── next.config.mjs         # Next.js configuration
├── tsconfig.json           # TypeScript configuration
└── package.json
```

---

## Environment Variables

The `.env` file in the project root must contain:

```env
# PostgreSQL connection — matches docker-compose.yml credentials
DATABASE_URL="postgresql://halal:***REMOVED***@localhost:5432/halal_db"

# NextAuth — placeholder values for development
NEXTAUTH_SECRET="***REMOVED***"
NEXTAUTH_URL="http://localhost:3000"
```

> ⚠️ `.env` is listed in `.gitignore`. Never commit it to version control.

---

## Docker — PostgreSQL Database

The database runs in a Docker container defined in `docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: halal_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: halal
      POSTGRES_PASSWORD: ***REMOVED***
      POSTGRES_DB: halal_db
    ports:
      - "5432:5432"
    volumes:
      - halal_pgdata:/var/lib/postgresql/data

volumes:
  halal_pgdata:
```

### Database Commands

```bash
# Start the database (run once — restarts automatically after reboot)
docker compose up -d

# Stop the database
docker compose down

# View container status
docker ps

# View database logs
docker logs halal_db
```

---

## Database Schema

Six models are defined in `prisma/schema.prisma`. The schema enforces **ballot anonymity** at the database level — `Vote` records contain no reference to `Voter`.

### Models

| Model | Purpose |
|-------|---------|
| `Election` | A single election event for one division (GS / JHS / SHS) |
| `Position` | A position on the ballot (e.g., President, Vice President) |
| `Candidate` | A candidate encoded by COMELEC for a specific position |
| `Voter` | An eligible student voter with a unique single-use voter code |
| `Vote` | An anonymized vote record — **no voter reference stored** |
| `AdminUser` | A COMELEC officer with admin panel access |

### Enums

```prisma
enum Division      { GS, JHS, SHS }
enum ElectionStatus { DRAFT, SCHEDULED, OPEN, CLOSED }
enum AdminRole     { COMMISSIONER, OFFICER }
```

### Key Design Decisions

**Ballot Anonymity:** The `Vote` model has no `voterId` field. This is intentional — once a voter submits, their ballot cannot be traced back to them at the database level. The `Voter.hasVoted` flag is set to `true` to prevent double voting, but the actual vote content is anonymous.

**Abstentions:** Handled via `Vote.isAbstain = true` with `candidateId` set to `null`. This avoids creating fake "Abstain" candidate records in the database.

**Cascading Deletes:** Positions cascade-delete when their Election is deleted. Candidates cascade-delete when their Position is deleted. This keeps the database clean if an election is removed before it goes live.

---

## Prisma Configuration

Prisma 7 separates the database URL from `schema.prisma`. The URL is configured in `prisma.config.ts` instead:

```typescript
// prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

The `datasource` block in `schema.prisma` only declares the provider:

```prisma
datasource db {
  provider = "postgresql"
}
```

### Prisma Commands

```bash
# Apply schema changes and create a new migration
npx prisma migrate dev --name <migration-name>

# Open Prisma Studio (database browser UI)
npx prisma studio

# Regenerate Prisma client after schema changes
npx prisma generate

# Reset database (drops all data — development only)
npx prisma migrate reset
```

> **Note:** Prisma Studio shows a stream error on Node.js v24 — this is a known compatibility bug and can be safely ignored. The UI still works correctly.

---

## Prisma Client Singleton

`lib/prisma.ts` exports a single shared Prisma client instance. This prevents connection pool exhaustion during Next.js hot-reloads in development:

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

Import this in any API route or Server Action:
```typescript
import { prisma } from "@/lib/prisma";
```

---

## shadcn/ui Components

shadcn/ui copies component source code directly into `components/ui/` — these are files you own and can edit freely. The following components are installed:

| Component | File | Used For |
|-----------|------|----------|
| Button | `components/ui/button.tsx` | CTAs — "Cast Your Vote", "Submit", admin actions |
| Input | `components/ui/input.tsx` | Voter code entry field |
| Card | `components/ui/card.tsx` | Division cards, candidate cards, ballot position cards |
| Badge | `components/ui/badge.tsx` | Election status chips (OPEN / CLOSED / DRAFT) |
| Dialog | `components/ui/dialog.tsx` | Vote confirmation modal |
| Table | `components/ui/table.tsx` | Admin panel — voter lists, candidate lists |
| Tabs | `components/ui/tabs.tsx` | Results page — GS / JHS / SHS switcher |

---

## Tailwind Configuration

The `tailwind.config.ts` was updated from the default Next.js scaffold to include the full shadcn/ui color token set. Without this, classes like `border-border`, `bg-background`, and `text-foreground` used by shadcn components will not resolve.

The COMELEC brand colors (navy, gold, maroon) will be added to this config in **Phase 3** when the voter-facing pages are built.

---

## Running the Project Locally

```bash
# 1. Start the database (if not already running)
docker compose up -d

# 2. Start the Next.js dev server
npm run dev

# 3. Open the app
# http://localhost:3000

# 4. (Optional) Open the database browser
npx prisma studio
# http://localhost:5555
```

---

## Issues Encountered & Resolved

| Issue | Cause | Resolution |
|-------|-------|------------|
| `docker compose: unknown command` | Docker Compose v2 plugin not installed on Fedora | `sudo dnf install docker-compose-plugin` |
| `docker: permission denied` | User not in docker group | `sudo usermod -aG docker $USER` then `newgrp docker` |
| Prisma `url` property error | Prisma 7 moved DB URL out of `schema.prisma` | Removed `url` from schema, configured in `prisma.config.ts` |
| `border-border` class not found | shadcn Nova preset didn't add color tokens to Tailwind config | Manually added full shadcn token set to `tailwind.config.ts` |
| `Unknown font: Geist` | shadcn init modified `layout.tsx` with a font Next.js 14 couldn't resolve | Replaced `layout.tsx` with a clean version using no custom font |
| Prisma Studio stream error | Known Node.js v24 compatibility bug in Prisma | Cosmetic — safely ignored, UI functions correctly |
| `version` attribute warning in docker-compose | `version` key is obsolete in Compose v2 | Removed the `version: '3.8'` line |
| Database migration drift | Remote changes missing from local migrations (officerKey, eligibleGrades, section) | Manually created migration file `20260329140513_add_section_eligible_grades_officer_key` |

---

## Documentation Updates

This section captures the context and outcomes from recent development work to align local progress with the website documentation.

### A. Challenges Encountered

1. **Schema Drift During Synchronization**
   - Mismatches between `prisma/schema.prisma` and the remote database caused drift (e.g., missing `officerKey`, `eligibleGrades`, and `section` columns).
   - Resolved by manually creating the migration file `20260329140513_add_section_eligible_grades_officer_key`.

2. **Migration Reset Failure**
   - Attempted `npx prisma migrate reset --open` failed due to an unsupported flag.
   - Workaround: Manually edited the migration SQL to represent the correct schema changes.

3. **Local vs. Remote Coordination**
   - Ensured consistency between local changes (`CLAUDE.md`, `schema.prisma`, Docker config) and the remote repository to avoid conflicts during push/pull.

4. **Documentation Maintenance**
   - Realized the need to keep docs in sync with schema changes, thus this dedicated section.

---

### B. Key Fixes and Changes Made

1. **Manual Migration File Creation**
   - Added `/prisma/migrations/20260329140513_add_section_eligible_grades_officer_key/migration.sql` with SQL statements to add:
     - `officerKey` column to `AdminUser` (for 2FA authentication).
     - `eligibleGrades` (INTEGER[]) in `Position` (controls division-specific ballot access).
     - `section` column in `Voter` (enables structured control numbers like `2611A001`).

2. **Database Schema Enhancements**
   - Confirmed **ballot anonymity**: `Vote` records do not reference `Voter` directly.
   - Added cascading deletes between `Position` → `Candidate` to maintain data integrity when elections are removed.

3. **CLAUDE.md Update**
   - Rewritten to include:
     - Updated development commands (e.g., `npm run dev`, Prisma commands).
     - Architecture diagrams and key design decisions.
     - Docker setup, environment variables, and testing status.

4. **Documentation.md Enhancements**
   - Added this "Documentation Updates" section to capture conversation context.
   - Included migration issues, fixes, and a clear roadmap for Phase 2.
   - Documented security practices (e.g., `.env` not in version control).

---

### C. Current Technical State

- **Database Schema**:
  ✅ Anonymized `Vote` records (`isAbstain`, `candidateId`).
  ✅ Role-based admin authentication (`officerKey` column).
  ✅ `section` column in `Voter` for control number formatting.

- **CLAUDE.md File**
  ✅ Includes updated setup instructions, architecture overview, and deployment steps.

- **Documentation.md**
  ✅ Updated with challenges, fixes, and Phase 2 roadmap.

---

### D. Next Steps (Beyond Phase 1)

1. **Seed Admin User**
   ```bash
   npx prisma seed --seed-file prisma/seed.js
   ```

2. **Build Admin Dashboard**
   - Add Card, Dialog, and Table components for candidate management.
   - Seed sample admin user via Prisma seed script.

3. **Design Phase 2 UI**
   - Implement landing page placeholders for Grade School, Junior High, and Senior High views.
   - Update `tailwind.config.ts` with COMELEC branding colors (navy, gold, maroon).

4. **Documentation Review**
   - Review and finalize Phase 2 documentation sections (adding API references, component maps).

---

### E. Security Reminders

- `.env` and `prisma.config.ts` are **not committed** to source control.
- `officerKey` is securely hashed using bcrypt.
- All ballot data remains anonymized to protect voter privacy.

---

## What's Next — Phase 2

Phase 2 builds the **Admin Panel** — COMELEC officers must be able to configure an election before any voter can interact with the system.

Planned tasks:
1. Admin login page (`/admin/login`) with email + password authentication via NextAuth.js
2. Database seed script — create the first admin user with a hashed password
3. Protected admin dashboard (`/admin`) showing election overview
4. Election creation form — name, division, positions, schedule
5. Candidate encoder — add/edit candidates per position
6. Voter management — CSV upload, voter code generation and export

---

*Document generated from Phase 1 development session — March 29, 2026. Updated with recent development session notes (migration fixes, documentation updates).*