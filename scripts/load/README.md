# Load & correctness tooling

Automated checks for whether the voting system holds up under election-day
conditions. These exercise the **real** code paths (the same `castVerifiedBallot`
transaction and `/api/results` tally the app uses), so the correctness results
transfer 1:1 to production and the capacity numbers are realistic *for the
environment you run them against*.

> ⚠️ Everything here writes real rows and is meant for a **throwaway/test
> database** (`DATABASE_URL`). Never point it at production, and never enable
> `ENABLE_TEST_ENDPOINTS` on a real election instance.

## Prerequisites

- A test Postgres (e.g. `docker compose up -d`) with migrations applied:
  `npx prisma migrate deploy`
- Env: `DATABASE_URL` and `ELECTION_AUDIT_MASTER_KEY` (base64 32-byte) set —
  the seed and harness need the audit key to mint verifiable ballots.
- For the load tests only: [k6](https://k6.io/docs/get-started/installation/)
  installed (`brew install k6`, `choco install k6`, or the apt repo).

## 1. Seed a load-test election

```bash
npm run seed:load                       # 800 SHS voters by default
VOTER_COUNT=3000 DIVISION=JHS npm run seed:load
```

Creates one OPEN, verifiable election and writes
`scripts/load/.data/voters.json`:

```jsonc
{
  "electionId": "clx…",
  "division": "SHS",
  "schoolYear": 2099,
  "positions": [{ "id": "…", "eligibleGrades": [10, 11], "candidateIds": ["…"] }],
  "voters":    [{ "id": "…", "gradeLevel": 11 }]
}
```

Control numbers are namespaced to school-year `2099` so they never collide with
real cohorts. Re-run to get a fresh, fully-unvoted roster.

## 2. Correctness (no k6 needed) — run this first, trust it most

```bash
npm run test:correctness          # default 12 concurrent casts
CONCURRENCY=32 npm run test:correctness
```

Asserts the two election-critical invariants and exits non-zero on any
violation (CI-friendly):

1. **Race** — N concurrent casts for one voter ⇒ exactly one ballot, `hasVoted`
   set once. Proves the `FOR SHARE` + `updateMany` guard.
2. **Reconciliation** — `ballot count == voters who voted`, and no vote points
   at a foreign election's position.

These are environment-independent: a pass is a real guarantee.

## 3. Write-path load (k6) — the election-day spike

```bash
# Build/start the app WITH the guarded test endpoint enabled:
ENABLE_TEST_ENDPOINTS=1 npm run build
ENABLE_TEST_ENDPOINTS=1 npm start            # or: ENABLE_TEST_ENDPOINTS=1 npm run dev

# In another shell, ramp virtual voters (each seeded voter votes once):
VUS=100 k6 run scripts/load/cast-ballots.js
```

Watch p95 `http_req_duration`, `http_req_failed`, and — on the DB — connection
count vs Postgres `max_connections` (the likely first ceiling, since there is no
explicit Prisma `connection_limit`). Re-seed before each run for a clean roster.

## 4. Read/polling load (k6) — the cache check

```bash
VUS=300 DURATION=2m k6 run scripts/load/poll-results.js
```

Public/OPEN is embargoed (cheap). To load the *expensive* cached tally, run
against a CLOSED election, or hit the admin path:

```bash
ADMIN=1 ADMIN_COOKIE="authjs.session-token=…" k6 run scripts/load/poll-results.js
```

(Grab the cookie from a logged-in admin browser session via devtools.) The
single-flight micro-cache (3s TTL) should keep DB vote-scans flat as VUs climb.

## Cleanup

Remove every seeded `[LOAD TEST]` election (cascades to its positions,
candidates, voters, ballots, and votes) when you're done:

```bash
npm run loadtest:clear
```

Scoped by the `[LOAD TEST]` name prefix, so real elections are never touched.

## Realism caveats

- k6 measures **server** capacity over HTTP — it does not run the React UI,
  real devices, or the school network. Synthetic numbers are therefore
  optimistic; production will be no faster.
- Run k6 from a **separate machine** over the real network path for trustworthy
  absolute latency. From localhost the numbers are a floor, not an SLO.
- A green load run is necessary, not sufficient — pair it with a real
  dress-rehearsal mock election on the actual devices/network.
