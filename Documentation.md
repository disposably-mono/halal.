# halal. — Project Documentation

> **Project:** halal. — School Election Management System
> **Organization:** OLPS COMELEC
> **Current Phase:** 2 — Admin Panel (In Progress)
> **Last Updated:** April 15, 2026

---

## Overview

This repository contains the **halal.** election management system, built for the Commission on Elections (COMELEC) at Our Lady of Peace School (OLPS). The name derives from the Filipino word for "to elect" or "to choose," reflecting the election theme **VOX POPULI VOX DEI**.

The system replaces manual election processes (paper ballots, hand-tallied counts) with a modern, real-time digital platform that manages student government elections across three divisions — Grade School, Junior High School, and Senior High School.

---

## Phase Status

| Phase | Focus | Status |
|-------|-------|--------|
| Phase 1 | Scaffold, schema, Docker, shadcn/ui | ✅ Complete |
| Phase 2 | Admin panel — auth, dashboard, election management | 🔄 In Progress |
| Phase 3 | Voter-facing pages with full COMELEC branding | ⏳ Planned |
| Phase 4 | Real-time SSE tallying, results embargo | ⏳ Planned |
| Phase 5 | Docker full-stack, Nginx, school server deployment | ⏳ Planned |

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 14.2.35 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS + shadcn/ui | Latest |
| Component Library | Radix UI (via shadcn) | Latest |
| Database | PostgreSQL | 16 (Alpine) |
| ORM | Prisma | 7.6.0 |
| DB Adapter | @prisma/adapter-pg | Latest |
| Auth | NextAuth.js (Auth.js) | Beta |
| Container | Docker + Docker Compose | 29.x |
| Runtime | Node.js | 24.x |

---

## Prerequisites

| Tool | Minimum Version | Notes |
|------|----------------|-------|
| Node.js | v18.17+ | v24.x used in this project |
| npm | v9+ | v11.x used in this project |
| Git | Any recent | v2.53.0 used |
| Docker | v20+ | v29.3.0 used |
| Docker Compose | v2 (plugin) | Installed via `docker-compose-plugin` on Fedora |

### Fedora-Specific Docker Setup

```bash
sudo systemctl enable docker --now
sudo dnf install docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version
docker ps
```

---

## Project Structure

```
halal/
├── app/
│   ├── admin/
│   │   ├── login/
│   │   │   └── page.tsx        # Two-step admin login page
│   │   ├── elections/
│   │   │   └── new/
│   │   │       └── page.tsx    # Election creation form
│   │   └── page.tsx            # Admin dashboard — election list
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts    # NextAuth route handler
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/                     # shadcn/ui components (fully owned)
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       ├── dialog.tsx
│       ├── table.tsx
│       └── tabs.tsx
├── lib/
│   ├── prisma.ts               # Prisma client singleton with PrismaPg adapter
│   └── utils.ts
├── prisma/
│   ├── schema.prisma           # Full database schema — 6 models
│   ├── seed.ts                 # Seeds first AdminUser (Commissioner)
│   └── migrations/
│       ├── 20260329075323_init/
│       └── 20260329140513_add_section_eligible_grades_officer_key/
├── types/
│   └── next-auth.d.ts          # Extends Session type with role and id
├── auth.ts                     # Full NextAuth config — Node.js runtime (db + bcrypt)
├── auth.config.ts              # Edge-safe NextAuth config — used by middleware only
├── middleware.ts               # Route protection — redirects unauthenticated to /admin/login
├── prisma.config.ts            # Prisma 7 config — datasource URL + seed command
├── .env                        # Environment variables — DO NOT COMMIT
├── .gitignore
├── docker-compose.yml
├── tailwind.config.ts
├── next.config.mjs
├── tsconfig.json
└── package.json
```

---

## Environment Variables

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
docker compose up -d       # Start
docker compose down        # Stop
docker ps                  # Status
docker logs halal_db       # Logs
```

---

## Database Schema

Six models defined in `prisma/schema.prisma`. Ballot anonymity enforced at the database level — `Vote` records contain no reference to `Voter`.

| Model | Purpose |
|-------|---------|
| `Election` | A single election event for one division (GS / JHS / SHS) |
| `Position` | A position on the ballot. `eligibleGrades` restricts grade-level visibility |
| `Candidate` | A candidate encoded by COMELEC for a specific position |
| `Voter` | An eligible student voter with a unique structured control number |
| `Vote` | An anonymized vote record — no voter reference stored |
| `AdminUser` | A COMELEC officer with admin panel access and unique `officerKey` |

### Enums

```prisma
enum Division       { GS, JHS, SHS }
enum ElectionStatus { DRAFT, SCHEDULED, OPEN, CLOSED }
enum AdminRole      { COMMISSIONER, OFFICER }
```

---

## Prisma Configuration

### prisma.config.ts

Prisma 7 separates the database URL from `schema.prisma`:

```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: 'ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

### Prisma Client (lib/prisma.ts)

Prisma 7.6 requires an explicit database adapter. The `@prisma/adapter-pg` package is used to connect to PostgreSQL:

```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter, log: ["query"] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

> **Why the adapter?** Prisma 7.6 defaults to its new "client" engine which requires either a driver adapter or `accelerateUrl`. The `engineType = "library"` generator option exists but is silently ignored in 7.6. Using `@prisma/adapter-pg` is the stable solution for self-hosted PostgreSQL.

### Prisma Commands

```bash
npx prisma migrate dev --name <name>   # Apply schema changes
npx prisma generate                    # Regenerate client
npx prisma db seed                     # Run seed script
npx prisma studio                      # Database browser (localhost:5555)
npx prisma migrate reset               # Reset database — dev only
```

> **Note:** Prisma Studio shows a stream error on Node.js v24 — cosmetic only, safely ignored.

---

## Authentication

### Architecture

NextAuth Beta (Auth.js v5) is split into two files to support both the Node.js runtime (API routes, server actions) and the Edge runtime (middleware):

| File | Runtime | Purpose |
|------|---------|---------|
| `auth.config.ts` | Edge-safe | Route authorization logic only — no db or bcrypt imports |
| `auth.ts` | Node.js | Full auth config — credentials provider, bcrypt, Prisma |
| `middleware.ts` | Edge | Uses `auth.config.ts` to protect `/admin` routes |

> **Why the split?** `middleware.ts` runs on the Edge runtime which does not support Node.js modules like `crypto`. Importing `auth.ts` (which pulls in `pg` via Prisma) into middleware causes a build error. The split keeps middleware edge-compatible.

### Two-Step Login Flow

Admin login requires two factors submitted together in a single `signIn` call:

1. **Step 1 (client-side):** Collect email + password. Advance to step 2 without a server round-trip — this avoids leaking whether an email exists.
2. **Step 2:** Collect officer key. Submit all three fields together. Both factors are verified server-side in `authorize()`.

If either factor fails, the full error is shown and the form resets to step 1. This prevents an attacker from knowing which factor was wrong.

### Session

- Strategy: JWT
- Expiry: 2 hours (`maxAge: 7200`)
- Custom fields: `session.user.role`, `session.user.id` (extended via `types/next-auth.d.ts`)

### Default Seed Credentials

Created by `npx prisma db seed`:

| Field | Value |
|-------|-------|
| Email | `comelec@olps.edu.ph` |
| Password | `comelec2026` |
| Officer Key | `***REMOVED***` |
| Role | `COMMISSIONER` |

> ⚠️ Change these before any production or UAT deployment.

---

## Admin Panel — Pages Built (Phase 2 Progress)

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Login | `/admin/login` | ✅ Done | Two-step form — credentials then officer key |
| Dashboard | `/admin` | ✅ Done | Lists all elections with status badges, voter/vote counts |
| New Election | `/admin/elections/new` | ✅ Done | Creates election, redirects to candidates page |
| Candidates | `/admin/elections/[id]/candidates` | ⏳ Next | Encode candidates per position with grade eligibility |
| Voters | `/admin/elections/[id]/voters` | ⏳ Planned | CSV upload, control number generation, export |

---

## Running the Project Locally

```bash
# 1. Start the database
docker compose up -d

# 2. Start the dev server
npm run dev

# 3. Open the app
# http://localhost:3000/admin/login

# 4. (Optional) Open database browser
npx prisma studio
# http://localhost:5555
```

---

## Issues Encountered & Resolved

| Issue | Cause | Resolution |
|-------|-------|------------|
| `docker compose: unknown command` | Compose v2 plugin not installed on Fedora | `sudo dnf install docker-compose-plugin` |
| `docker: permission denied` | User not in docker group | `sudo usermod -aG docker $USER` then `newgrp docker` |
| Prisma `url` property error | Prisma 7 moved DB URL out of `schema.prisma` | Configured in `prisma.config.ts` instead |
| `border-border` class not found | shadcn Nova preset didn't add color tokens | Manually added full shadcn token set to `tailwind.config.ts` |
| `Unknown font: Geist` | shadcn init modified `layout.tsx` with unresolvable font | Replaced with clean `layout.tsx` using no custom font |
| Prisma Studio stream error | Known Node.js v24 compatibility bug | Cosmetic — safely ignored |
| `version` attribute warning | `version` key obsolete in Compose v2 | Removed `version: '3.8'` from `docker-compose.yml` |
| Database migration drift | Remote changes missing locally | Manually created `20260329140513_add_section_eligible_grades_officer_key` |
| `"prisma"` seed block outside JSON root | Appended after closing `}` in `package.json` | Moved inside root object as a proper key |
| Prisma seed config ignored | Prisma 7 moved seed config to `prisma.config.ts` | Added `seed` to `migrations` block in `prisma.config.ts` |
| `PrismaClient` not exported (ts-node) | ts-node type resolution issue | Switched seed to import `{ prisma }` from `lib/prisma.ts` |
| `PrismaClientConstructorValidationError` | Prisma 7.6 defaults to "client" engine requiring an adapter | Added `@prisma/adapter-pg`; rewrote `lib/prisma.ts` to use `PrismaPg` |
| `engineType = "library"` silently ignored | Prisma 7.6 bug — option exists but has no effect | Resolved by using the pg adapter instead |
| Edge runtime `crypto` error in middleware | `middleware.ts` imported `auth.ts` which pulled in `pg` | Split NextAuth into `auth.config.ts` (edge-safe) and `auth.ts` (Node.js); middleware uses only `auth.config.ts` |
| `pg-native` warning | `pg` looks for optional native binding | Harmless — `pg-native` is not installed and not needed |

---

## What's Next — Phase 2 (Remaining)

1. **Candidate encoder** (`/admin/elections/[id]/candidates`) — add/edit candidates per position, set grade eligibility for JHSSCT Governor positions
2. **Voter management** (`/admin/elections/[id]/voters`) — CSV upload, auto-generate structured control numbers, export as CSV/PDF
3. **Election control** — manual open/close buttons, status management

---

## Security Reminders

- `.env` is not committed to source control
- `officerKey` and `passwordHash` are bcrypt-hashed at rest
- All ballot data remains anonymized — `Vote` records contain no `voterId`
- Two-factor admin login: shared credentials + unique per-officer key
- Session cookies use JWT strategy with 2-hour rolling expiry

---

*Last updated: March 30, 2026 — Phase 2 in progress.*
