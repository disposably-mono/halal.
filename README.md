Here’s a **clean, GitHub-ready `README.md` (plaintext)** aligned with your PRD v3.1, including consistent branding, tone, and structure:

---

# halal.

**School Election Management System**
**VOX POPULI VOX DEI**

---

## Overview

**halal.** is a web-based Election Management System built for the Commission on Elections (COMELEC) of Our Lady of Peace School (OLPS).

It replaces manual election processes with a secure, automated, and fully digital platform — enabling efficient voter management, real-time tallying, and transparent results publication.

The system delivers two distinct experiences:

* **Voter Interface** — fully branded, emotionally resonant, aligned with COMELEC identity
* **Admin Panel** — clean, utilitarian, and optimized for operational control

---

## Product Vision

> *The voice of the people is the voice of God.*

halal. modernizes student elections while preserving institutional identity and integrity.

It is designed to:

* Eliminate manual vote counting
* Enforce one-vote-per-student integrity
* Provide real-time operational visibility to COMELEC
* Deliver a seamless and accessible voting experience
* Publish official results transparently after election closure

---

## Core Features

### Voter Experience

* Control number-based authentication (no accounts required)
* Division-specific ballots (GS, JHS, SHS)
* Grade-aware ballot filtering (e.g., governor positions)
* Simple, fast voting flow (≤ 3 steps)
* Implicit abstention system (no explicit abstain button)
* Confirmation modal for incomplete ballots
* Public results page (available after election closes)

---

### Admin Panel

* Two-factor authentication (password + officer key)
* Election lifecycle management (Draft → Scheduled → Open → Closed)
* Candidate encoding with position ordering and eligibility rules
* CSV-based voter upload with auto-generated control numbers
* Real-time tally monitor (including abstentions)
* Manual election override controls
* Exportable results (PDF-ready)

---

### System Integrity

* Anonymous voting (no voter-to-vote linkage)
* Atomic vote submission (all-or-nothing)
* Server-side validation for all actions
* Rate-limited authentication endpoints
* Results embargo until polls close

---

## Tech Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Frontend   | Next.js 14 (React)                  |
| Language   | TypeScript                          |
| Styling    | Tailwind CSS + shadcn/ui            |
| Backend    | Next.js API Routes + Server Actions |
| Database   | PostgreSQL 16                       |
| ORM        | Prisma 7                            |
| Auth       | NextAuth.js (Auth.js)               |
| Realtime   | Server-Sent Events (SSE)            |
| Deployment | Docker + Nginx                      |
| Runtime    | Node.js 24                          |

---

## Architecture Highlights

### Unified Full-Stack

* Single Next.js application (frontend + backend)
* Type-safe logic across the entire system
* Simplified deployment (single container stack)

---

### Database Design

Key principles:

* **Strict anonymity** — Vote table has no voter reference
* **Structured voter identity** — control number system
* **Grade-aware ballot logic** — enforced at query level

Core entities:

* Election
* Position
* Candidate
* Voter
* Vote
* AdminUser

---

### Control Number Format

```
YY GG S NNN
```

Example:

```
2611A001
```

Meaning:

* Year: 2026
* Grade: 11
* Section: A
* Student #: 001

---

## Voting Flow

1. Student enters control number
2. System validates eligibility and status
3. Ballot is dynamically generated based on:

   * Division
   * Grade level
4. Student selects candidates (optional per position)
5. Submission triggers:

   * Review modal (if incomplete)
   * Final confirmation
6. Vote is recorded atomically

---

## Results System

* **During Voting**

  * Public page: placeholder (embargo active)
  * Admin panel: live tally (SSE)

* **After Closing**

  * Public results unlocked
  * Labeled: **FINAL OFFICIAL RESULTS**
  * Abstentions excluded from public view

---

## Design System

### Color Palette

| Token  | Hex     | Role       |
| ------ | ------- | ---------- |
| Navy   | #1B1F5E | Primary    |
| Gold   | #F5C000 | Accent     |
| Maroon | #6B1A1A | Secondary  |
| White  | #FFFFFF | Surface    |
| Light  | #F4F4F8 | Background |
| Dark   | #2A2A2A | Text       |
| Mid    | #5A5A7A | Muted      |

---

### Typography

* **Display** — Bebas Neue
* **Headings** — Barlow Condensed
* **Body** — DM Sans
* **Codes** — JetBrains Mono
* **Tagline** — Playfair Display (Italic)

---

### Visual Identity

* Ribbon / wave motifs
* Sun-ray halo accents
* Strong compressed typography
* Minimal rounding, no heavy shadows
* Institutional, formal aesthetic

---

## Project Status

**Version:** 3.1
**Status:** Active Development

### Progress

* Phase 1 — Setup & Architecture ✅ Complete
* Phase 2 — Admin Panel 🔄 In Progress
* Phase 3 — Voter Interface ⏳ Planned
* Phase 4 — Real-time & Results ⏳ Planned
* Phase 5 — Deployment & UAT ⏳ Planned

---

## Local Development

### Start Services

```bash
docker compose up -d
npm run dev
```

### Prisma Tools

```bash
npx prisma studio
npx prisma migrate dev --name <migration>
npx prisma generate
```

---

## Key Design Decisions

* No abstain button → abstentions are implicit
* Results embargo → prevents voter influence
* Structured voter codes → human-readable + self-validating
* Admin 2FA → shared credentials + individual accountability
* SSE over WebSockets → simpler, lightweight real-time updates

---

## Future Scope

* Election archive system
* About COMELEC page
* Officer directory page

---

## Repository

```
github.com/disposably-mono/halal
```

---

## License

Private — Internal use for OLPS COMELEC

---

## Closing

**halal.** is not just a system — it is an institutional tool designed to uphold trust, efficiency, and transparency in student governance.

---

**VOX POPULI VOX DEI**
# halal.

> [cite_start]**VOX POPULI VOX DEI** [cite: 17]

[cite_start]**halal.** (styled in lowercase) is a web-based Election Management System purpose-built for the **Commission on Elections (COMELEC)** of **Our Lady of Peace School (OLPS)**. [cite: 16] [cite_start]It digitizes the manual, error-prone processes of voter registration and tallying across three divisions: Grade School, Junior High, and Senior High. [cite: 11, 13]

[cite_start]The name is derived from the Filipino word "to elect," reflecting the core mission of capturing the people's voice with modern integrity. [cite: 17]

---

## 🛠 Technology Stack

[cite_start]The project utilizes a unified **TypeScript** codebase to ensure type safety and reduce context-switching across the stack. [cite: 30, 32]

| Layer | Technology | Version | Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend** | [cite_start]Next.js (App Router) [cite: 30] | [cite_start]14.2.35 [cite: 193] | [cite_start]Full-stack React framework with server components. [cite: 30] |
| **Styling** | [cite_start]Tailwind CSS + shadcn/ui [cite: 30] | [cite_start]Latest [cite: 30] | [cite_start]Utility-first CSS with accessible component primitives. [cite: 30] |
| **Database** | [cite_start]PostgreSQL [cite: 30] | [cite_start]16 (Alpine) [cite: 30] | [cite_start]Relational database ideal for election integrity. [cite: 30] |
| **ORM** | [cite_start]Prisma [cite: 30] | [cite_start]7.6.0 [cite: 193] | Type-safe client. [cite_start]Uses `prisma.config.ts` for URLs. [cite: 30, 47] |
| **Auth** | [cite_start]NextAuth.js [cite: 30] | [cite_start]Beta [cite: 30] | [cite_start]Admin session management with 2FA officer keys. [cite: 30, 167] |
| **Real-time** | [cite_start]SSE [cite: 30] | [cite_start]N/A [cite: 30] | [cite_start]Lightweight push for live tallies (Admin only during polls). [cite: 30] |

---

## ✨ Key Features (v3.1 Updates)

[cite_start]The latest version (v3.1) finalizes critical voting logic and security requirements requested by COMELEC. [cite: 6, 7]

* [cite_start]**Structured Control Numbers:** Replaces random alphanumeric codes with a human-readable `YYGGSNNN` format (e.g., `2611A001`). [cite: 8, 77, 78]
* [cite_start]**Grade-Level Ballot Filtering:** JHS Governor positions are restricted; voters only see candidates eligible for their specific grade. [cite: 8, 67, 68]
* [cite_start]**Implicit Abstentions:** No explicit "Abstain" button is provided. [cite: 8, 43] [cite_start]If a voter skips a position, they are prompted with a neutral confirmation modal before the system records an implicit abstention. [cite: 116, 121]
* [cite_start]**Results Embargo:** Public tallies are hidden until the election status is **CLOSED** to prevent mid-election influence. [cite: 8, 128]
* [cite_start]**Officer Key 2FA:** Admin login requires shared credentials plus a unique, personal **officerKey** hashed at rest. [cite: 8, 134, 171]
* [cite_start]**Ballot Anonymity:** Vote records contain no voter references, ensuring ballots cannot be traced back to individuals at the database level. [cite: 40, 41]

---

## 🚀 Development

### Initial Environment
[cite_start]Development is primarily conducted on **Fedora Linux** using **Docker Compose v2**. [cite: 29, 193]

```bash
# 1. Start the PostgreSQL container
[cite_start]docker compose up -d [cite: 204]

# 2. Sync database schema
[cite_start]npx prisma migrate dev [cite: 208]

# 3. Launch the development server
[cite_start]npm run dev [cite: 205]
```

### Essential Commands
* [cite_start]**Database Browser:** `npx prisma studio` (available at localhost:5555) [cite: 206]
* [cite_start]**Generate Client:** `npx prisma generate` (run after schema changes) [cite: 209]
* [cite_start]**Reset DB:** `npx prisma migrate reset` (Caution: drops all data) [cite: 210]

---

## 📅 Status & Roadmap

| Phase | Focus | Status |
| :--- | :--- | :--- |
| **Phase 1** | [cite_start]**Foundation:** Next.js scaffold, Prisma schema, Docker setup. [cite: 56] | [cite_start]**Complete** [cite: 4, 183] |
| **Phase 2** | [cite_start]**Admin Panel:** 2FA Auth, Candidate Encoder, Voter Management. [cite: 56] | [cite_start]**Up Next** [cite: 4, 184] |
| **Phase 3** | [cite_start]**Voter Experience:** Branded Landing, Ballot UI, Voter Login. [cite: 56] | [cite_start]Planned [cite: 56] |
| **Phase 4** | [cite_start]**Real-time Engine:** SSE tallies, results embargo, status controls. [cite: 56] | [cite_start]Planned [cite: 56] |
| **Phase 5** | [cite_start]**Handoff:** Nginx config, School IT deployment, UAT. [cite: 56] | [cite_start]Planned [cite: 56] |

---

> [cite_start]**Note:** Prisma Studio may show a cosmetic stream error on Node v24; this can be safely ignored as functionality is unaffected. [cite: 193, 201]

**OLPS COMELEC** | **v3.1** | [cite_start]**Private Repository** [cite: 196, 229]# halal.

> [cite_start]**VOX POPULI VOX DEI** [cite: 17, 26]

[cite_start]**halal.** (styled in lowercase) is a web-based Election Management System built specifically for the **Commission on Elections (COMELEC)** of **Our Lady of Peace School (OLPS)**[cite: 16, 17]. [cite_start]It digitizes the manual voting process across the Grade School (GS), Junior High School (JHS), and Senior High School (SHS) divisions to ensure integrity, transparency, and efficiency[cite: 11, 21].

-----

## 🛠 Technology Stack

[cite_start]The project uses a unified **TypeScript** codebase to reduce context-switching and ensure type safety across the entire stack[cite: 30, 32].

  * [cite_start]**Frontend & API:** [Next.js 14.2.35](https://nextjs.org/) (App Router & Server Actions) [cite: 30, 193]
  * [cite_start]**Language:** [TypeScript 5.x](https://www.typescriptlang.org/) [cite: 30]
  * [cite_start]**Styling:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Nova preset) [cite: 30, 193]
  * [cite_start]**Database:** [PostgreSQL 16](https://www.postgresql.org/) (running in Docker Alpine) [cite: 30]
  * [cite_start]**ORM:** [Prisma 7.6.0](https://www.prisma.io/) (configured via `prisma.config.ts`) [cite: 30, 49, 193]
  * [cite_start]**Authentication:** [NextAuth.js (Beta)](https://authjs.dev/) with two-step Admin 2FA [cite: 30, 134, 167]
  * [cite_start]**Real-time:** Server-Sent Events (SSE) for live tally updates [cite: 30, 129]
  * [cite_start]**Runtime:** [Node.js 24.x](https://nodejs.org/) with [npm 11.x](https://www.npmjs.com/) [cite: 30, 193]
  * [cite_start]**Deployment:** Docker 29.x + Nginx [cite: 30, 193]

-----

## ✨ Key Features (v3.1 Updates)

[cite_start]The latest version (3.1) introduces critical voting logic and security enhancements[cite: 6, 7]:

  * [cite_start]**Structured Control Numbers:** Replaced random codes with a self-validating `YY-GG-S-NNN` format (e.g., `2611A001`) for human-readable voter identification[cite: 8, 77, 78, 82].
  * [cite_start]**Grade-Level Filtering:** Automatic ballot filtering for grade-restricted positions, such as JHSSCT Governors[cite: 8, 66, 68, 152].
  * [cite_start]**Implicit Abstentions:** Removed the explicit "Abstain" button; skipped positions are automatically recorded as abstentions upon voter confirmation[cite: 8, 42, 116, 121].
  * [cite_start]**Results Embargo:** Public results are hidden during active voting to prevent influencing voters; only the Admin Monitor has access to live tallies[cite: 8, 128, 131, 160].
  * [cite_start]**Admin 2FA:** Enhanced security requiring both shared credentials and a unique, personal **Officer Key** for all COMELEC admins[cite: 7, 39, 134, 169].

-----

## 🚀 Development

### Initial Setup

[cite_start]Ensure you are using **Docker Compose v2** (plugin) and have the Docker daemon enabled[cite: 193, 201].

```bash
# Start the PostgreSQL container
[cite_start]docker compose up -d [cite: 204]

# Install dependencies
[cite_start]npm install [cite: 30]

# Initialize the database
[cite_start]npx prisma migrate dev [cite: 208]

# Start the development server
[cite_start]npm run dev [cite: 205]
```

### Database Operations

  * [cite_start]**Open DB Browser:** `npx prisma studio` (Localhost: 5555) [cite: 206]
  * [cite_start]**Generate Client:** `npx prisma generate` [cite: 209]
  * [cite_start]**Reset Data:** `npx prisma migrate reset` (Dev only) [cite: 210]

-----

## 📅 Project Roadmap

| Phase | Focus | Status |
| :--- | :--- | :--- |
| **Phase 1** | [cite_start]Project Scaffold, Prisma Schema, Tailwind/shadcn, Docker Config [cite: 56] | [cite_start]**Complete** [cite: 4, 183] |
| **Phase 2** | [cite_start]**Admin Panel:** Auth (2FA), Candidate Encoding, Voter Management [cite: 56] | [cite_start]**Up Next** [cite: 4, 184] |
| **Phase 3** | [cite_start]**Voter Experience:** Branded Landing, Ballot Page, Voter Login [cite: 56, 188] | Planned |
| **Phase 4** | [cite_start]**Real-time Engine:** SSE Tallies, Lifecycle Controls, Results Embargo [cite: 56] | Planned |
| **Phase 5** | [cite_start]**Deployment:** Nginx Config, UAT, School IT Server Handoff [cite: 56] | Planned |

-----

## 🔒 Security & Privacy

  * [cite_start]**Ballot Anonymity:** Vote records contain no voter references; they are linked only to candidates and positions[cite: 40, 41, 175].
  * [cite_start]**Session Management:** Admin sessions use signed JWTs with a 2-hour rolling expiry and `httpOnly` flags[cite: 173, 175].
  * [cite_start]**Integrity:** Vote submission is atomic via database transactions to prevent partial or duplicate votes[cite: 154, 158, 175].

-----

[cite_start]**Repository:** [github.com/disposably-mono/halal](https://www.google.com/search?q=https://github.com/disposably-mono/halal) (Private) [cite: 30, 195]
