# halal. — School Election Management System

**halal.** (Filipino for *to elect*) is a high-integrity, web-based election management platform built specifically for the **Our Lady of Peace School (OLPS) Commission on Elections (COMELEC)**.

Aligned with the theme *VOX POPULI VOX DEI* (The voice of the people is the voice of God), this system digitizes the entire election lifecycle—from candidate encoding and voter registration to real-time automated tallying.

---

## 🚀 Project Vision

* **Eliminate Manual Errors:** Replace paper-based tallying with real-time automated results.
* **Division-Aware Logic:** Handles complex eligibility rules for Grade School, Junior High, Senior High, and House Council.
* **Uncompromising Integrity:** Ensures one-vote-per-student through database-level constraints while maintaining absolute ballot anonymity.
* **User-Centric Design:** Features a high-fidelity, branded voter interface and a utilitarian, 2FA-protected admin panel.

---

## 🛠 Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL 16 |
| **ORM** | Prisma 7.6 (with `@prisma/adapter-pg`) |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Auth** | Auth.js (NextAuth Beta) with 2FA Officer Keys |
| **Real-time** | Server-Sent Events (SSE) |
| **Runtime** | Node.js 24 + Docker |

---

## ✨ Key Features

### 🗳 Voter Experience

* **Smart Ballots:** Automatically filters positions based on the voter's grade level (e.g., Grade 6 students only see the Freshman Governor position).
* **Secure Authentication:** Unique `YYGGSNNN` format control numbers generated per student.
* **Implicit Abstentions:** A neutral review process that records unselected positions as abstentions without requiring an "Abstain" button.
* **Branded Interface:** Deep navy and gold aesthetic reflecting OLPS COMELEC identity.

### 🛡 Admin Management

* **Two-Step Login:** Requires both shared credentials and a unique personal Officer Key.
* **Candidate Encoder:** "Seed All" functionality to instantly load division-specific positions from PRD constants.
* **Voter Management:** Bulk CSV upload with automated grade-range validation and global deduplication.
* **Snap Elections:** Native support for mid-term vacancy elections via position soft-deletion and re-activation.
* **Live Monitor:** Real-time turnout and tally tracking (including abstentions) for COMELEC officers.

---

## 🏗 Project Structure

* `/app/admin` — Protected admin dashboard and election management routes.
* `/app/vote` — Protected voter-facing ballot and authentication logic.
* `/app/api` — Backend endpoints for CSV exports and real-time result streams.
* `/prisma` — Type-safe schema definitions and migration history.
* `/components/ui` — Accessible UI components powered by Radix UI.

---

## 🚦 Development Status

* **Phase 1: Foundation** ✅ Complete
* **Phase 2: Admin Control & Logic** ✅ Complete
* **Phase 3: Voter Interface & Branding** ⏳ In Progress
* **Phase 4: Real-time Tallies & Controls** 📅 Planned
* **Phase 5: Deployment & UAT** 📅 Planned

---

## 💻 Quick Start

### Prerequisites

* Node.js v24.x
* Docker & Docker Compose
* npm v11.x

### Setup

1. **Clone the repo:**

    ```bash
    git clone github.com/disposably-mono/halal.git
    cd halal
    ```

2. **Start the database:**

    ```bash
    docker compose up -d
    ```

3. **Install dependencies & Sync DB:**

    ```bash
    npm install
    npx prisma migrate dev
    npx prisma db seed
    ```

4. **Run the development server:**

    ```bash
    npm run dev
    ```

    Access the app at `http://localhost:3000` and the database browser at `http://localhost:5555`.

---

**OLPS COMELEC** — *VOX POPULI VOX DEI*
