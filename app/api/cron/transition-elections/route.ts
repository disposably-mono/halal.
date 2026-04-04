/**
 * app/api/cron/transition-elections/route.ts
 *
 * Vercel Cron Job endpoint — called on a schedule defined in vercel.json.
 * Checks all elections and applies any overdue SCHEDULED→OPEN / OPEN→CLOSED
 * transitions.
 *
 * Secured with a CRON_SECRET env var so it cannot be triggered anonymously
 * from the public internet.
 *
 * vercel.json schedule: { "path": "/api/cron/transition-elections", "schedule": "* * * * *" }
 * (every minute on Vercel Pro; every hour on Hobby — adjust as needed)
 */

import { NextRequest, NextResponse } from "next/server";
import { applyScheduledTransitions } from "@/lib/election-transitions";

export const runtime = "nodejs"; // needs Prisma
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // ── Auth check ─────────────────────────────────────────────────────────────
  // Vercel forwards the secret as the Authorization header when you set
  // CRON_SECRET in your project environment variables.
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Run transitions ────────────────────────────────────────────────────────
  try {
    const result = await applyScheduledTransitions();

    const summary = {
      timestamp: new Date().toISOString(),
      opened: result.opened.length,
      closed: result.closed.length,
      openedIds: result.opened,
      closedIds: result.closed,
    };

    console.log("[cron] election-transitions:", summary);

    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron] election-transitions error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
