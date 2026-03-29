# 🗳️ halal.

<p align="center">
  <b>School Election Management System</b><br>
  <i>VOX POPULI VOX DEI</i>
</p>

<p align="center">
  🟦 Built for OLPS COMELEC &nbsp;•&nbsp; 🟨 Secure Voting &nbsp;•&nbsp; 🟥 Real-Time Results
</p>

---

## 🟦 Overview

**halal.** is a web-based Election Management System designed for the **Commission on Elections (COMELEC)** of Our Lady of Peace School.

It replaces manual election workflows with a **secure, automated, and transparent digital platform** — built for reliability, simplicity, and institutional trust.

---

## 🟨 Highlights

* 🗳️ **Seamless Voting** — fast, intuitive, ≤3-step flow
* 🔐 **Secure by Design** — anonymous ballots, strict validation
* 📊 **Real-Time Monitoring** — live admin tally via SSE
* ⛔ **Results Embargo** — prevents mid-election influence
* 🎯 **Smart Ballots** — grade-aware position filtering
* 🧾 **Zero Manual Work** — automated tallying & exports

---

## 🟥 System Architecture

```text
Next.js (Full Stack)
├── App Router (Frontend UI)
├── Server Actions / API Routes
├── Authentication (NextAuth)
├── Prisma ORM
└── PostgreSQL (Docker)
```

* 🟦 Unified TypeScript codebase
* 🐳 Containerized deployment
* ⚡ Optimized for ~2000 concurrent voters

---

## 🟦 Core Features

### 🗳️ Voter Experience

* 🔑 Control number login (single-use)
* 🧭 Automatic division detection
* 🎯 Grade-filtered ballots (JHS governors)
* ⚠️ Review modal for incomplete ballots
* ✅ Instant confirmation after voting
* 📊 Public results (post-election only)

---

### 🛠️ Admin Panel

* 🔐 2FA login (password + officer key)
* 🗂️ Election lifecycle management
* 👥 Candidate encoding system
* 📥 CSV voter import + control number generation
* 📡 Live tally monitor (with abstentions)
* 📄 Exportable official results

---

## 🟨 Control Number System

Structured, human-readable voter codes:

```
YY GG S NNN
```

**Example:** `2611A001`

* 🗓️ Year: 2026
* 🎓 Grade: 11
* 🔤 Section: A
* 🔢 Student #: 001

✔ Self-validating
✔ Easy to distribute
✔ Impossible to reuse

---

## 🟥 Voting Flow

```text
Enter Code → Validate → Generate Ballot → Select → Review → Submit
```

* 🧱 Atomic submission (no partial votes)
* 🤍 Skipped positions = implicit abstentions
* 🔒 One vote per student (DB enforced)

---

## 🟦 Results System

| Phase              | Public View     | Admin View     |
| ------------------ | --------------- | -------------- |
| 🟨 Voting Open     | ⛔ Locked        | 📡 Live        |
| 🟦 Election Closed | ✅ Final Results | 📊 Full Access |

* 🏁 Labeled **FINAL OFFICIAL RESULTS**
* 🤍 Abstentions hidden from public

---

## 🎨 Design System

### 🟦 Colors

* Navy `#1B1F5E` — Primary
* Gold `#F5C000` — Accent
* Maroon `#6B1A1A` — Secondary

### ✍️ Typography

* Bebas Neue — Display
* Barlow Condensed — Headings
* DM Sans — Body
* JetBrains Mono — Codes

### 🎭 Visual Language

* 🌊 Ribbon motifs
* ☀️ Subtle sun-ray accents
* 🧱 Minimal, institutional UI
* 🟥🟦🟨 Philippine-inspired palette

---

## 🛠️ Tech Stack

| Layer      | Tech                 |
| ---------- | -------------------- |
| Frontend   | Next.js 14           |
| Language   | TypeScript           |
| Styling    | Tailwind + shadcn/ui |
| Backend    | Next.js API Routes   |
| Database   | PostgreSQL           |
| ORM        | Prisma               |
| Auth       | NextAuth.js          |
| Realtime   | SSE                  |
| Deployment | Docker               |

---

## 🚧 Development Status

```
Phase 1  ██████████  Complete
Phase 2  █████░░░░░  In Progress
Phase 3  ░░░░░░░░░░  Planned
Phase 4  ░░░░░░░░░░  Planned
Phase 5  ░░░░░░░░░░  Planned
```

---

## ▶️ Local Setup

```bash
docker compose up -d
npm run dev
```

### Prisma

```bash
npx prisma studio
npx prisma migrate dev --name init
npx prisma generate
```

---

## 🧠 Key Decisions

* ❌ No abstain button → cleaner UX
* ⛔ Results embargo → protects voter independence
* 🔢 Structured codes → human + system readable
* 🔐 2FA admin auth → shared + personal accountability
* 📡 SSE → lightweight real-time updates

---

## 🔮 Future Scope

* 🗂️ Election archive
* 📘 About COMELEC page
* 🧑‍💼 Officers directory

---

## 🔗 Repository

```
github.com/disposably-mono/halal
```

---

## 🏁 Closing

<p align="center">
  🟦 Integrity &nbsp;&nbsp; 🟨 Transparency &nbsp;&nbsp; 🟥 Trust
</p>

<p align="center">
  <b>VOX POPULI VOX DEI</b>
</p>

---

