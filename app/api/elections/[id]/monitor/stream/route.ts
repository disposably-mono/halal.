import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapabilityOrError } from "@/lib/server/auth";
import { permissionErrorMessage } from "@/lib/auth/permissions";
import { subscribe, getLatest } from "@/lib/server/monitor-hub";
import { computeAdminMonitorPayload } from "@/lib/server/results-aggregate";
import { tryAcquire, release } from "@/lib/server/sse-connections";
import type { ResultsPayload } from "@/app/(admin)/admin/elections/[id]/monitor/_components/monitor-shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Keep-alive comment cadence — under typical 30–60s proxy idle timeouts. */
const HEARTBEAT_MS = 25_000;

/**
 * Live monitor stream (Server-Sent Events).
 *
 * Replaces the admin monitor's 30s polling. A client opens this once and
 * receives: an initial frame (current tally) on connect, then a new frame every
 * time the server recomputes on an election-state change (see
 * `lib/server/monitor-broadcast.ts`). The endpoint is read-only from the
 * client's perspective — subscribing never mutates the database.
 *
 * Auth rides the session cookie (EventSource sends same-origin credentials), so
 * the same `admin:view` capability that gates `GET /api/results/[id]?admin=1`
 * gates the stream.
 */
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const guard = await requireCapabilityOrError("admin:view");
  if (!guard.ok) {
    return NextResponse.json(
      { error: permissionErrorMessage(guard.error) },
      { status: guard.error === "Forbidden" ? 403 : 401 },
    );
  }

  const { id } = params;
  const election = await prisma.election.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!election) {
    return NextResponse.json({ error: "Election not found" }, { status: 404 });
  }

  // Acquire as late as possible — right before the stream (and its heartbeat
  // interval + hub subscription) actually comes into existence — so a
  // rejected request never holds a slot.
  if (!tryAcquire()) {
    return NextResponse.json(
      { error: "Too many live monitor connections. Close other monitor tabs and retry." },
      { status: 429 },
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (payload: ResultsPayload) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          // Controller already closed (client vanished mid-write) — stop.
          cleanup();
        }
      };

      // Subscribe first so no frame published during warm-up is missed.
      const unsubscribe = subscribe(id, send);

      const heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          cleanup();
        }
      }, HEARTBEAT_MS);

      function cleanup() {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        req.signal.removeEventListener("abort", cleanup);
        release();
        try {
          controller.close();
        } catch {
          // already closed
        }
      }

      req.signal.addEventListener("abort", cleanup);

      try {
        // Initial frame: prefer the hub's cached latest (free); otherwise compute
        // once so a monitor opened on an idle election still renders immediately.
        const initial = getLatest(id) ?? (await computeAdminMonitorPayload(id));
        if (initial) send(initial);
      } catch (error) {
        // `cleanup` is already wired to `req.signal` by this point, so this
        // covers the one gap where it isn't yet reachable any other way: a
        // synchronous throw here would otherwise error the stream without
        // ever calling `cleanup()`, leaking the connection slot acquired
        // above. Routing through `cleanup()` also releases it exactly once.
        console.error(`monitor stream: failed to compute initial frame for election ${id}`, error);
        cleanup();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Disable proxy buffering (nginx) so frames flush immediately.
      "X-Accel-Buffering": "no",
    },
  });
}
