# halal. — School Election Management System

**halal.** (Filipino for *to elect*) is a high-integrity, web-based election management platform built specifically for the **Our Lady of Peace School (OLPS) Commission on Elections (COMELEC)**.

Aligned with the theme *VOX POPULI VOX DEI* (The voice of the people is the voice of God), this system digitizes the entire election lifecycle — from candidate encoding and voter registration to real-time automated tallying and official results publication.

---

## 🚀 Project Vision

- **Eliminate Manual Errors** — Replace paper-based tallying with real-time automated results
- **Division-Aware Logic** — Handles complex eligibility rules for Grade School, Junior High, Senior High, and House Council
- **Uncompromising Integrity** — Ensures one-vote-per-student through database-level constraints while maintaining absolute ballot anonymity
- **User-Centric Design** — High-fidelity branded voter interface and a utilitarian 2FA-protected admin panel

---

## 🛠 Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL 16 |
| **ORM** | Prisma 7.6 (with `@prisma/adapter-pg`) |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Auth** | Auth.js (NextAuth Beta) — 2FA with personal Officer Keys |
| **Runtime** | Node.js 24 + Docker |

---

## ✨ Key Features

### 🗳 Voter Experience

- **Smart Ballots** — Automatically filters positions based on the voter's grade level
- **Dual-Factor Auth** — Student ID + unique `YYGGSNNN` format control number required
- **Implicit Abstentions** — Skipped positions auto-recorded as abstentions without an "Abstain" button
- **Branded Interface** — Deep navy and gold aesthetic reflecting OLPS COMELEC identity
- **Public Results** — Results page published after polls close, no login required

### 🛡 Admin Management

- **Two-Step Login** — Shared credentials + unique personal Officer Key
- **Candidate Encoder** — "Seed All" loads division-specific positions instantly from PRD constants
- **Voter Management** — Bulk CSV upload with automated grade-range validation and global deduplication
- **Election Control** — Manual open/close, schedule override, and full audit trail per election
- **Live Tally Monitor** — Real-time turnout and tally tracking with replay and momentum charting
- **PDF Export** — Official formatted results PDF for closed elections
- **Snap Elections** — Native support via position soft-deletion and re-activation

---

## 🏗 Project Structure

```
app/
  (admin)/admin/     — Protected admin dashboard and election management routes
  admin/login/       — Two-step admin login (outside admin layout)
  vote/              — Voter authentication and ballot
  results/           — Public results page with embargo
  about/             — About OLPS COMELEC page
  creator/           — About the creator page
  api/               — Results, voter export, PDF, and cron endpoints
lib/                 — Prisma client, voter session JWT, election transitions, PDF
prisma/              — Schema, migrations, seed
```

---

## 🚦 Development Status

| Phase | Focus | Status |
| :--- | :--- | :--- |
| Phase 1 | Scaffold, schema, Docker, shadcn/ui | ✅ Complete |
| Phase 2 | Admin panel — auth, dashboard, election management | ✅ Complete |
| Phase 3 | Voter-facing pages with full COMELEC branding | ✅ Complete |
| Phase 4 | Live tally, results embargo, election controls, PDF export | ✅ Complete |
| Phase 5 | Docker full-stack, Nginx, school server deployment, UAT | ⏳ Planned |

---

## 💻 Quick Start

### Prerequisites

- Node.js v24.x
- Docker & Docker Compose
- npm v11.x

### Setup

1. **Clone the repo:**

    ```bash
    git clone https://github.com/disposably-mono/halal.git
    cd halal
    ```

2. **Configure environment:**

    ```bash
    cp .env.example .env
    # Fill in all values in .env before continuing
    ```

3. **Start the database:**

    ```bash
    docker compose up -d
    ```

4. **Install dependencies and sync DB:**

    ```bash
    npm install
    npx prisma migrate dev
    npx prisma db seed
    ```

5. **Run the development server:**

    ```bash
    npm run dev
    ```

    App at `http://localhost:3000` — DB browser at `http://localhost:5555` (`npx prisma studio`)

---

## 🔒 Security Notes

- Never commit `.env` — use `.env.example` as the template
- Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`
- Generate `DB_PASSWORD` with `openssl rand -hex 24`
- The `/api/cron/transition-elections` endpoint requires a `CRON_SECRET` bearer token

---

**OLPS COMELEC** — *VOX POPULI VOX DEI*
