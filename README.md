# halal.

**halal.** is a school election platform built for the **Our Lady of Peace School Commission on Elections (OLPS COMELEC)**. Its name comes from the Filipino word *halal*, meaning "to elect."

The platform supports the full election lifecycle: preparing candidates and voter rosters, issuing one-time control numbers, casting anonymous ballots, monitoring turnout, and publishing final results.

> *VOX POPULI VOX DEI* - The voice of the people is the voice of God.

## What It Does

### For Students

- Opens the correct ballot using a Student ID and election-specific Control Number
- Shows only positions available to the voter's grade level and division
- Allows a final review before the ballot is submitted
- Treats skipped positions as abstentions
- Prevents an accepted Control Number from being used again
- Keeps public results unavailable until the election has closed
- Provides a public voter guide at `/voter-help`
- Prints a one-time anonymous receipt and verifies ballot inclusion at `/verify`

### For COMELEC Officers

- Guides election setup through **Candidates -> Voters -> Control**
- Supports division-specific positions and grade eligibility
- Imports voter rosters from CSV or accepts individual registrations
- Generates structured, unique Control Numbers
- Schedules elections or opens and closes them manually
- Displays live turnout, tally, replay, and momentum views
- Exports voter rosters and official results according to officer permissions
- Archives completed elections without removing their records
- Records election actions and successful two-officer admin sign-ins
- Freezes a certified tally at closing and records Canvasser-initiated recounts
- Provides a key-protected officer guide at `/admin-help`

## Election Workflow

```text
Commissioner creates an election
              |
              v
1. Candidates -> 2. Voters -> 3. Control
              |
              v
Students cast one ballot while polls are open
              |
              v
Canvassing Head closes and exports results
              |
              v
Final results become publicly available
```

## Access and Roles

Admin access requires an officer's own email and password, followed by an Officer Key belonging to a **different** COMELEC account. The verifying officer is recorded in the admin login history, but the key itself is never stored in that history.

| Role | Access |
| --- | --- |
| **COMELEC Super-admin** | Manages admin accounts, credentials, roles, and login history. Does not operate elections. |
| **Commissioner** | Creates elections; manages candidates and voter rosters; schedules, opens, archives, and restores elections. |
| **Canvassing Head** | Monitors voting, closes elections, and exports official results. |
| **Officer** | Read-only access to the dashboard and live election monitoring. |

Permissions are enforced on the server. Hiding an action in the interface is not the authorization boundary.

## Ballot Privacy

Voter records contain eligibility information and whether a Control Number has been used. Ballot selections are stored separately and do not include a Student ID, Control Number, or voter-record reference.

New-format votes are grouped under anonymous ballot records. A receipt proves that the grouped ballot remains present and unchanged, but public verification never reveals its choices. Receipt codes are shown once and cannot be recovered because only their hashes are stored.

Operational logs identify officers performing administrative actions. They do not contain student ballot choices or plaintext passwords and Officer Keys.

## Technology

| Layer | Technology |
| --- | --- |
| Framework | Next.js 14 with the App Router |
| Language | TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma 7 |
| Authentication | Auth.js / NextAuth |
| Interface | React, Tailwind CSS, and shadcn/ui |
| Validation | Zod |
| Testing | Vitest |
| PDF generation | React PDF |

## Local Development

### Prerequisites

- Node.js 20.19 or newer
- npm
- Docker with Docker Compose, or an existing PostgreSQL database

### Setup

1. Clone the repository.

   ```bash
   git clone https://github.com/disposably-mono/halal..git
   cd halal.
   ```

2. Install dependencies.

   ```bash
   npm install
   ```

3. Create the local environment file and replace every `CHANGE_ME` value.

   ```bash
   cp .env.example .env
   ```

4. Start PostgreSQL.

   ```bash
   docker compose up -d db
   ```

5. Apply database migrations and create the paired bootstrap accounts.

   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

6. Start the development server.

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000). The admin login is available at [http://localhost:3000/admin/login](http://localhost:3000/admin/login).

The seed requires two accounts with different emails and Officer Keys. This is intentional: either account needs another officer's key to complete admin sign-in.

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma |
| `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Credentials used by the local Docker database |
| `NEXTAUTH_SECRET` | Secret used to sign authentication and voter-session tokens |
| `NEXTAUTH_URL` | Public application URL used by Auth.js |
| `ELECTION_AUDIT_MASTER_KEY` | Base64-encoded 32-byte key used to encrypt election audit keys |
| `SEED_ADMIN_*` | Bootstrap Super-admin credentials |
| `SEED_SECOND_ADMIN_*` | Bootstrap verification Officer credentials |
| `CRON_SECRET` | Bearer token protecting scheduled election transitions |

Generate strong local secrets instead of reusing the example values:

```bash
openssl rand -base64 32
```

Never commit `.env`, real officer credentials, voter rosters, or exported election records.

Back up `ELECTION_AUDIT_MASTER_KEY` before creating elections. Changing or losing it without re-encrypting every election audit key makes existing receipt verification and recounts unavailable. Audit operations fail closed when the key cannot be decrypted.

## Useful Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Run the production build |
| `npm run typecheck` | Check TypeScript types |
| `npm run lint` | Run ESLint |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npx prisma studio` | Inspect the local database |

## Project Layout

```text
app/
  (admin)/admin/       Protected dashboard and election operations
  admin/login/         Two-officer admin sign-in
  vote/                Voter access, ballot, and confirmation
  results/             Public final results
  voter-help/          Public voting guide
  admin-help/          Officer-key-protected administration guide
  api/                 Auth, exports, results, and scheduler endpoints
components/            Shared public and administration UI
lib/                   Domain rules, authentication, validation, and utilities
prisma/                Database schema, migrations, and seed
tests/                 Authentication and election-domain tests
```

## Security Notes

- Passwords and Officer Keys are hashed with bcrypt.
- Admin sign-in requires credentials from two different officer accounts.
- Role capabilities are checked by server actions and protected routes.
- Voter access uses a short-lived, signed HTTP-only session cookie.
- Verifiable elections use AES-256-GCM encrypted election keys and versioned HMAC-SHA-256 ballot commitments.
- Closing a verifiable election atomically freezes a signed tally snapshot for later recount comparison.
- Election transitions validate roster and candidate readiness.
- The scheduler endpoint requires `Authorization: Bearer <CRON_SECRET>`.
- Production deployments should use HTTPS, managed secrets, regular backups, and restricted database access.
- The app must sit behind a reverse proxy that overwrites the `x-forwarded-for` header with the real client address; per-IP rate limits are otherwise bypassable via header spoofing.

## Project Status

halal. is under active development for OLPS COMELEC operations. Election procedures, role assignments, deployment controls, and data-retention practices should still be reviewed by the authorized school election body before production use.

---

Built for **OLPS COMELEC**.
