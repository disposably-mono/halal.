# halal.

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
