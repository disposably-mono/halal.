# README.md

````markdown
# 🗳️ halal.

<p align="center">
  <b>School Election Management System</b><br>
  <i>VOX POPULI VOX DEI</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Phase%202%20Complete-success" alt="Status">
  <img src="https://img.shields.io/badge/Stack-Next.js%2014-blue" alt="Stack">
  <img src="https://img.shields.io/badge/DB-PostgreSQL-336791" alt="Database">
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

* 🗳️ **Seamless Voting** — Fast, intuitive, ≤3-step flow.
* 🔐 **Secure by Design** — Anonymous ballots, strict Prisma-level validation.
* 📊 **Real-Time Monitoring** — Live admin tally via Server-Sent Events (SSE).
* ⛔ **Results Embargo** — Prevents mid-election influence by hiding tallies until closure.
* 🎯 **Smart Ballots** — Grade-aware position filtering for JHS/SHS/House Council.
* 🧾 **Zero Manual Work** — Automated tallying, candidate encoding, and CSV exports.

---

## 🟥 System Architecture

```text
Next.js 14 (Full Stack)
├── App Router (Frontend UI)
├── Server Actions (Logic & Auth.js)
├── NextAuth.js (Secure Admin Access)
├── Prisma ORM (@prisma/adapter-pg)
└── PostgreSQL 16 (Dockerized Alpine)
````

* 🟦 Unified TypeScript codebase
* 🐳 Containerized deployment via Docker
* ⚡ Optimized for \~2000 concurrent voters

-----

## 🟦 Core Features

### 🗳️ Voter Experience (Phase 3)

* 🔑 **Control Number Login**: Single-use, structured validation.
* 🧭 **Automatic Detection**: Logic-based division routing.
* 🎯 **Grade-Filtered Ballots**: Automatic filtering (e.g., Grade 7 only sees JHS Governor).
* ⚠️ **Review Modal**: Prevents accidental submissions.
* 📊 **Public Results**: Professional results page accessible post-election.

### 🛠️ Admin Panel (Phase 2 ✅)

* 🔐 **2FA Login**: Password + specific Officer Key for shared accountability.
* 🗂️ **Election Lifecycle**: Create, Draft, Open, and Close election states.
* 👥 **Candidate Management**: Dynamic encoding with position-based soft deletes.
* 📡 **Live Tally Monitor**: Real-time progress tracking for authorized officers.
* 📄 **Database Integrity**: Automatic voter code global uniqueness checks.

-----

## 🟨 Control Number System

Structured, human-readable voter codes designed for the OLPS system:

```text
YY GG S NNN
```

**Example:** `2611A001`

* 🗓️ **Year**: 2026 (Graduation/Current Year)
* 🎓 **Grade**: 11
* 🔤 **Section**: A
* 🔢 **Student \#**: 001

-----

## 🟥 Voting Flow

```text
Enter Code → Validate → Generate Ballot → Select → Review → Submit
```

* 🧱 **Atomic Submission**: No partial votes; the entire ballot is recorded at once.
* 🤍 **Implicit Abstention**: Skipped positions are handled as abstentions without extra clicks.
* 🔒 **One Vote Per Student**: Database constraints prevent re-entry once a code is used.

-----

## 🟦 Results System

| Phase              | Public View      | Admin View      |
| ------------------ | ---------------- | -------------- |
| 🟨 **Voting Open** | ⛔ Locked         | 📡 Live Tally   |
| 🟦 **Election Closed**| ✅ Final Results  | 📊 Full Report  |

* 🏁 Results are labeled **FINAL OFFICIAL RESULTS**.
* 🤍 Abstention data is recorded for audit but hidden from public tallies to maintain focus.

-----

## 🎨 Design System

### 🟦 Visual Language

* **Colors**: Navy (`#1B1F5E`), Gold (`#F5C000`), and Maroon (`#6B1A1A`).
* **Themes**: Dark-mode focused UI using `shadcn/ui` for an institutional, modern feel.
* **Typography**: *Bebas Neue* (Display), *Barlow Condensed* (Headings), and *JetBrains Mono* (Voter Codes).

-----

## 🛠️ Tech Stack

| Layer      | Tech                 | Version |
| ---------- | -------------------- | ------- |
| Framework  | Next.js              | 14.2.35 |
| UI/Styles  | Tailwind + shadcn/ui | Latest  |
| Database   | PostgreSQL           | 16      |
| ORM        | Prisma               | 7.6.0   |
| Auth       | Auth.js (NextAuth)   | 5.0-beta|
| Runtime    | Node.js + Docker     | Latest  |

-----

## 🚧 Development Status

```text
Phase 1: Scaffold & Schema      ██████████ 100%
Phase 2: Admin & Management     ██████████ 100%
Phase 3: Voter Interface        ░░░░░░░░░░ Planned
Phase 4: Real-time & Results    ░░░░░░░░░░ Planned
Phase 5: School Deployment      ░░░░░░░░░░ Planned
```

-----

## ▶️ Local Setup

### 1\. Environment & Containers

```bash
# Start the PostgreSQL container
docker compose up -d

# Install dependencies
npm install
```

### 2\. Database Initialization

```bash
# Generate Prisma Client
npx prisma generate

# Apply migrations
npx prisma migrate dev

# Seed Admin Account (comelec@olps.edu.ph)
npx prisma db seed
```

### 3\. Run Development Server

```bash
npm run dev
```

-----

## 🧠 Key Decisions

* **Dockerized Hosting**: Ensures the school IT can deploy the entire stack on internal hardware easily.
* **No Abstain Button**: Skipping a position is logically treated as an abstention, reducing UI clutter.
* **Prisma Adapter**: Used `@prisma/adapter-pg` to resolve driver compatibility within the Next.js edge runtime.

-----

## 🏁 Closing

\<p align="center"\>
🟦 Integrity \&nbsp;\&nbsp; 🟨 Transparency \&nbsp;\&nbsp; 🟥 Trust
\</p\>

\<p align="center"\>
\<b\>VOX POPULI VOX DEI\</b\>
\</p\>

```
```
