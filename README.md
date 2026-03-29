# halal.

> *Vox Populi Vox Dei*

School Election Management System for the Commission on Elections (COMELEC) of Our Lady of Peace School (OLPS).

## Stack

- **Framework:** Next.js 14 (TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL 16 (Docker)
- **ORM:** Prisma 7
- **Auth:** NextAuth.js (Beta)

## Setup

See `PHASE_1_SETUP.md` for full setup instructions.

## Development
```bash
# Start the database
docker compose up -d

# Start the dev server
npm run dev
```

## Status

- [x] Phase 1 — Foundation & Scaffold
- [ ] Phase 2 — Admin Panel
- [ ] Phase 3 — Voter-Facing Pages
- [ ] Phase 4 — Real-time Results
- [ ] Phase 5 — Deployment
